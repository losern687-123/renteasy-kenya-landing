import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Download, Loader2, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  parseCSV, 
  csvToObjects, 
  validatePaymentRow, 
  generateSampleCSV, 
  downloadCSV,
  PaymentCSVRow,
  CSVError 
} from "@/utils/csvParser";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface BulkPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MatchedPayment {
  csvRow: PaymentCSVRow;
  tenant: { id: string; name: string } | null;
  rentRecord: { id: string; amount: number; status: string } | null;
  status: 'matched' | 'tenant_not_found' | 'no_pending' | 'amount_mismatch' | 'already_paid';
  amountDiff?: number;
}

type PaymentStep = 'upload' | 'matching' | 'preview' | 'processing' | 'complete';

export function BulkPaymentModal({ open, onOpenChange }: BulkPaymentModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<PaymentStep>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<{ headers: string[]; rows: PaymentCSVRow[] }>({ headers: [], rows: [] });
  const [validationErrors, setValidationErrors] = useState<CSVError[]>([]);
  const [matchedPayments, setMatchedPayments] = useState<MatchedPayment[]>([]);
  const [processResults, setProcessResults] = useState({ success: 0, failed: 0 });
  
  const resetState = () => {
    setStep('upload');
    setFileName(null);
    setParsedData({ headers: [], rows: [] });
    setValidationErrors([]);
    setMatchedPayments([]);
    setProcessResults({ success: 0, failed: 0 });
  };
  
  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };
  
  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    
    setFileName(file.name);
    
    // Parse CSV
    const content = await file.text();
    const parsed = parseCSV(content);
    const rows = csvToObjects<PaymentCSVRow>(parsed);
    
    // Validate all rows
    const errors: CSVError[] = [];
    rows.forEach((row, index) => {
      errors.push(...validatePaymentRow(row, index));
    });
    
    setParsedData({ headers: parsed.headers, rows });
    setValidationErrors(errors);
    
    if (errors.length === 0) {
      setStep('matching');
      await matchPaymentsWithTenants(rows);
    } else {
      // Show preview with errors
      setStep('preview');
    }
  }, [user]);
  
  const matchPaymentsWithTenants = async (rows: PaymentCSVRow[]) => {
    if (!user) return;
    
    // Fetch all tenants
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id, name')
      .eq('landlord_id', user.id);
    
    // Fetch pending rent records
    const { data: rentRecords } = await supabase
      .from('rent_records')
      .select('id, tenant_id, amount, status')
      .in('status', ['pending', 'overdue']);
    
    const matched: MatchedPayment[] = rows.map(row => {
      // Find tenant by name (case-insensitive fuzzy match)
      const tenant = tenants?.find(t => 
        t.name.toLowerCase().trim() === row.tenant_name.toLowerCase().trim()
      );
      
      if (!tenant) {
        return {
          csvRow: row,
          tenant: null,
          rentRecord: null,
          status: 'tenant_not_found' as const,
        };
      }
      
      // Find pending rent record for this tenant
      const records = rentRecords?.filter(r => r.tenant_id === tenant.id) || [];
      const pendingRecord = records.find(r => r.status === 'pending' || r.status === 'overdue');
      
      if (!pendingRecord) {
        // Check if all records are already paid
        const paidRecord = records.find(r => r.status === 'paid');
        if (paidRecord) {
          return {
            csvRow: row,
            tenant,
            rentRecord: null,
            status: 'already_paid' as const,
          };
        }
        return {
          csvRow: row,
          tenant,
          rentRecord: null,
          status: 'no_pending' as const,
        };
      }
      
      const csvAmount = parseFloat(row.amount);
      const recordAmount = pendingRecord.amount;
      const amountDiff = Math.abs(csvAmount - recordAmount);
      
      if (amountDiff > 0 && amountDiff / recordAmount > 0.01) { // More than 1% difference
        return {
          csvRow: row,
          tenant,
          rentRecord: pendingRecord,
          status: 'amount_mismatch' as const,
          amountDiff,
        };
      }
      
      return {
        csvRow: row,
        tenant,
        rentRecord: pendingRecord,
        status: 'matched' as const,
      };
    });
    
    setMatchedPayments(matched);
    setStep('preview');
  };
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);
  
  const handleProcess = async () => {
    if (!user) return;
    
    setStep('processing');
    
    let successCount = 0;
    let failedCount = 0;
    
    const recordablePayments = matchedPayments.filter(p => 
      p.status === 'matched' || p.status === 'amount_mismatch'
    );
    
    for (const payment of recordablePayments) {
      if (!payment.rentRecord) continue;
      
      try {
        const { error } = await supabase
          .from('rent_records')
          .update({
            status: 'paid',
            payment_date: payment.csvRow.payment_date,
            payment_method: payment.csvRow.payment_method || 'bank_transfer',
          })
          .eq('id', payment.rentRecord.id);
        
        if (error) {
          failedCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        failedCount++;
      }
    }
    
    // Count unprocessable as failed
    failedCount += matchedPayments.filter(p => 
      p.status === 'tenant_not_found' || p.status === 'no_pending' || p.status === 'already_paid'
    ).length;
    
    setProcessResults({ success: successCount, failed: failedCount });
    setStep('complete');
    
    // Refresh data
    queryClient.invalidateQueries({ queryKey: ['rent-records'] });
    
    if (successCount > 0) {
      toast.success(`${successCount} payment(s) recorded successfully`);
    }
  };
  
  const downloadSample = () => {
    downloadCSV(generateSampleCSV('payments'), 'sample-payments.csv');
    toast.success('Sample CSV downloaded');
  };
  
  const getStatusBadge = (status: MatchedPayment['status']) => {
    switch (status) {
      case 'matched':
        return <Badge className="bg-primary gap-1"><CheckCircle className="w-3 h-3" />Matched</Badge>;
      case 'tenant_not_found':
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Tenant not found</Badge>;
      case 'no_pending':
        return <Badge variant="secondary" className="gap-1"><AlertCircle className="w-3 h-3" />No pending invoice</Badge>;
      case 'amount_mismatch':
        return <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600"><AlertCircle className="w-3 h-3" />Amount differs</Badge>;
      case 'already_paid':
        return <Badge variant="secondary" className="gap-1">Already paid</Badge>;
    }
  };
  
  const matchedCount = matchedPayments.filter(p => p.status === 'matched').length;
  const mismatchCount = matchedPayments.filter(p => p.status === 'amount_mismatch').length;
  const recordableCount = matchedCount + mismatchCount;
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Record Bulk Payments
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to record multiple rent payments at once
          </DialogDescription>
        </DialogHeader>
        
        {step === 'upload' && (
          <div className="space-y-6">
            <Card
              className={cn(
                "border-2 border-dashed transition-colors cursor-pointer",
                isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              )}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
            >
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <p className="text-lg font-medium">Drop your CSV file here</p>
                <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
              </CardContent>
            </Card>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Need a template?</p>
                  <p className="text-xs text-muted-foreground">Download sample CSV</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={downloadSample} className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </div>
        )}
        
        {step === 'matching' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Matching payments...</p>
          </div>
        )}
        
        {step === 'preview' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Badge variant="outline">{matchedPayments.length} payments</Badge>
              <Badge className="bg-primary">{matchedCount} matched</Badge>
              {mismatchCount > 0 && (
                <Badge variant="outline" className="border-amber-500 text-amber-600">{mismatchCount} amount differs</Badge>
              )}
            </div>
            
            <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Tenant</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matchedPayments.map((payment, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{payment.csvRow.tenant_name}</TableCell>
                      <TableCell className="text-right">
                        KES {parseFloat(payment.csvRow.amount).toLocaleString()}
                        {payment.amountDiff && (
                          <span className="text-xs text-amber-600 block">
                            Expected: KES {payment.rentRecord?.amount.toLocaleString()}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(payment.csvRow.payment_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleProcess} disabled={recordableCount === 0}>
                Record {recordableCount} Payment{recordableCount !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}
        
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Recording payments...</p>
          </div>
        )}
        
        {step === 'complete' && (
          <div className="space-y-6">
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Payments Recorded</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-primary/30">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-primary">{processResults.success}</div>
                  <div className="text-sm text-muted-foreground">Recorded</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-muted-foreground">{processResults.failed}</div>
                  <div className="text-sm text-muted-foreground">Skipped</div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
