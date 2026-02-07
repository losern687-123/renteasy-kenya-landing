import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, Download, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  parseCSV, 
  csvToObjects, 
  validateTenantRow, 
  generateSampleCSV, 
  downloadCSV,
  TenantCSVRow,
  CSVError 
} from "@/utils/csvParser";
import { CSVPreviewTable } from "./CSVPreviewTable";
import { ImportResultsSummary } from "./ImportResultsSummary";
import { cn } from "@/lib/utils";

interface BulkTenantImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

export function BulkTenantImportModal({ open, onOpenChange }: BulkTenantImportModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<ImportStep>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<{ headers: string[]; rows: TenantCSVRow[] }>({ headers: [], rows: [] });
  const [validationErrors, setValidationErrors] = useState<CSVError[]>([]);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [importResults, setImportResults] = useState({ success: 0, failed: 0 });
  
  const resetState = () => {
    setStep('upload');
    setFileName(null);
    setParsedData({ headers: [], rows: [] });
    setValidationErrors([]);
    setImportResults({ success: 0, failed: 0 });
  };
  
  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };
  
  const loadProperties = async () => {
    if (!user) return [];
    const { data } = await supabase
      .from('properties')
      .select('id, name')
      .eq('landlord_id', user.id);
    return data || [];
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
    
    // Load properties for validation
    const props = await loadProperties();
    setProperties(props);
    
    // Parse CSV
    const content = await file.text();
    const parsed = parseCSV(content);
    const rows = csvToObjects<TenantCSVRow>(parsed);
    
    // Validate all rows
    const propertyNames = props.map(p => p.name);
    const errors: CSVError[] = [];
    rows.forEach((row, index) => {
      errors.push(...validateTenantRow(row, index, propertyNames));
    });
    
    setParsedData({ headers: parsed.headers, rows });
    setValidationErrors(errors);
    setStep('preview');
  }, [user]);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleImport = async () => {
    if (!user) return;
    
    setStep('importing');
    
    let successCount = 0;
    let failedCount = 0;
    const failedErrors: CSVError[] = [];
    
    // Filter out rows with validation errors
    const validRows = parsedData.rows.filter((_, index) => 
      !validationErrors.some(e => e.row === index)
    );
    
    // Process in batches
    const batchSize = 50;
    for (let i = 0; i < validRows.length; i += batchSize) {
      const batch = validRows.slice(i, i + batchSize);
      
      for (const row of batch) {
        try {
          // Find property ID
          const property = properties.find(p => 
            p.name.toLowerCase() === row.property_name.toLowerCase()
          );
          
          if (!property) {
            failedCount++;
            failedErrors.push({
              row: parsedData.rows.indexOf(row),
              field: 'property_name',
              message: 'Property not found',
              value: row.property_name,
            });
            continue;
          }
          
          // Insert tenant
          const { error } = await supabase
            .from('tenants')
            .insert({
              landlord_id: user.id,
              property_id: property.id,
              name: row.name.trim(),
              email: row.email?.trim() || '',
              phone: row.phone.replace(/\D/g, ''),
              status: 'active',
              verification_status: 'verified',
            });
          
          if (error) {
            failedCount++;
            failedErrors.push({
              row: parsedData.rows.indexOf(row),
              field: 'general',
              message: error.message,
            });
          } else {
            successCount++;
          }
        } catch (error: any) {
          failedCount++;
          failedErrors.push({
            row: parsedData.rows.indexOf(row),
            field: 'general',
            message: error.message || 'Unknown error',
          });
        }
      }
    }
    
    // Add skipped rows to failed count
    const skippedCount = parsedData.rows.length - validRows.length;
    failedCount += skippedCount;
    
    setImportResults({ success: successCount, failed: failedCount });
    setValidationErrors([...validationErrors, ...failedErrors]);
    setStep('complete');
    
    // Refresh data
    queryClient.invalidateQueries({ queryKey: ['tenants'] });
    queryClient.invalidateQueries({ queryKey: ['subscription-limits'] });
    
    if (successCount > 0) {
      toast.success(`${successCount} tenant(s) imported successfully`);
    }
  };
  
  const downloadSample = () => {
    downloadCSV(generateSampleCSV('tenants'), 'sample-tenants.csv');
    toast.success('Sample CSV downloaded');
  };
  
  const validRowCount = parsedData.rows.length - 
    new Set(validationErrors.map(e => e.row)).size;
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Tenants from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple tenants at once
          </DialogDescription>
        </DialogHeader>
        
        {step === 'upload' && (
          <div className="space-y-6">
            {/* Upload Area */}
            <Card
              className={cn(
                "border-2 border-dashed transition-colors cursor-pointer",
                isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <p className="text-lg font-medium">
                  Drop your CSV file here
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-4">
                  Maximum file size: 5MB
                </p>
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
            
            {/* Sample Download */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Need a template?</p>
                  <p className="text-xs text-muted-foreground">
                    Download our sample CSV file to see the required format
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={downloadSample} className="gap-2">
                <Download className="w-4 h-4" />
                Download Sample
              </Button>
            </div>
            
            {/* Required Columns Info */}
            <div className="text-sm space-y-2">
              <p className="font-medium">Required columns:</p>
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <div>• <code className="bg-muted px-1 rounded">name</code> - Tenant name</div>
                <div>• <code className="bg-muted px-1 rounded">email</code> - Email (optional)</div>
                <div>• <code className="bg-muted px-1 rounded">phone</code> - Phone number</div>
                <div>• <code className="bg-muted px-1 rounded">property_name</code> - Property</div>
                <div>• <code className="bg-muted px-1 rounded">rent_amount</code> - Monthly rent</div>
                <div>• <code className="bg-muted px-1 rounded">due_date</code> - Day (1-31)</div>
              </div>
            </div>
          </div>
        )}
        
        {step === 'preview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">{fileName}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={resetState}>
                Choose different file
              </Button>
            </div>
            
            <CSVPreviewTable
              headers={parsedData.headers}
              rows={parsedData.rows}
              errors={validationErrors}
            />
            
            {validationErrors.length > 0 && (
              <div className="flex items-start gap-2 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Some rows have validation errors
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Rows with errors will be skipped. {validRowCount} of {parsedData.rows.length} rows will be imported.
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleImport}
                disabled={validRowCount === 0}
              >
                Import {validRowCount} Tenant{validRowCount !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}
        
        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Importing tenants...</p>
            <p className="text-sm text-muted-foreground mt-1">
              Please wait, this may take a moment
            </p>
          </div>
        )}
        
        {step === 'complete' && (
          <ImportResultsSummary
            successCount={importResults.success}
            failedCount={importResults.failed}
            errors={validationErrors}
            entityName="tenants"
            onClose={handleClose}
            onRetry={resetState}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
