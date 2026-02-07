import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Loader2, CheckCircle, Users, Home, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, getDaysInMonth } from "date-fns";

interface BulkInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TenantForInvoice {
  id: string;
  name: string;
  email: string;
  property_name: string;
  rent_amount: number;
  hasExistingInvoice: boolean;
}

type InvoiceStep = 'select' | 'preview' | 'generating' | 'complete';

export function BulkInvoiceModal({ open, onOpenChange }: BulkInvoiceModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState<InvoiceStep>('select');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(true);
  const [sendNotifications, setSendNotifications] = useState(true);
  const [tenantsToInvoice, setTenantsToInvoice] = useState<TenantForInvoice[]>([]);
  const [generationResults, setGenerationResults] = useState({ created: 0, skipped: 0 });
  
  // Fetch properties
  const { data: properties = [] } = useQuery({
    queryKey: ['landlord-properties-for-invoice', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('properties')
        .select('id, name, rent_amount')
        .eq('landlord_id', user.id);
      return data || [];
    },
    enabled: !!user && open,
  });
  
  const resetState = () => {
    setStep('select');
    setSelectedPropertyIds([]);
    setSelectAll(true);
    setSendNotifications(true);
    setTenantsToInvoice([]);
    setGenerationResults({ created: 0, skipped: 0 });
  };
  
  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };
  
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];
  
  const years = [
    new Date().getFullYear() - 1,
    new Date().getFullYear(),
    new Date().getFullYear() + 1,
  ];
  
  const loadTenantsForPreview = async () => {
    if (!user) return;
    
    // Fetch tenants with their properties
    let query = supabase
      .from('tenants')
      .select('id, name, email, property_id, properties(name, rent_amount)')
      .eq('landlord_id', user.id)
      .eq('status', 'active');
    
    if (!selectAll && selectedPropertyIds.length > 0) {
      query = query.in('property_id', selectedPropertyIds);
    }
    
    const { data: tenants } = await query;
    
    if (!tenants || tenants.length === 0) {
      toast.error('No tenants found for selected properties');
      return;
    }
    
    // Check for existing invoices
    const monthStart = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    const monthEnd = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${getDaysInMonth(new Date(selectedYear, selectedMonth - 1))}`;
    
    const { data: existingRecords } = await supabase
      .from('rent_records')
      .select('tenant_id')
      .gte('due_date', monthStart)
      .lte('due_date', monthEnd);
    
    const existingTenantIds = new Set(existingRecords?.map(r => r.tenant_id) || []);
    
    const tenantsForInvoice: TenantForInvoice[] = tenants.map(t => ({
      id: t.id,
      name: t.name,
      email: t.email,
      property_name: (t.properties as any)?.name || 'Unknown',
      rent_amount: (t.properties as any)?.rent_amount || 0,
      hasExistingInvoice: existingTenantIds.has(t.id),
    }));
    
    setTenantsToInvoice(tenantsForInvoice);
    setStep('preview');
  };
  
  const handleGenerate = async () => {
    if (!user) return;
    
    setStep('generating');
    
    let createdCount = 0;
    let skippedCount = 0;
    
    // Filter out tenants with existing invoices
    const tenantsToCreate = tenantsToInvoice.filter(t => !t.hasExistingInvoice);
    
    for (const tenant of tenantsToCreate) {
      try {
        // Create due date (default to 5th of the month)
        const dueDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-05`;
        
        const { error } = await supabase
          .from('rent_records')
          .insert({
            tenant_id: tenant.id,
            tenant_name: tenant.name,
            property_name: tenant.property_name,
            amount: tenant.rent_amount,
            due_date: dueDate,
            status: 'pending',
          });
        
        if (error) {
          console.error('Failed to create invoice for', tenant.name, error);
          skippedCount++;
        } else {
          createdCount++;
          
          // Create notification if enabled
          if (sendNotifications) {
            await supabase
              .from('notifications')
              .insert({
                user_id: tenant.id,
                type: 'rent_due',
                message: `Rent invoice for ${format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy')} has been generated. Amount: KES ${tenant.rent_amount.toLocaleString()}`,
              });
          }
        }
      } catch (error) {
        console.error('Error creating invoice:', error);
        skippedCount++;
      }
    }
    
    // Count already-skipped tenants
    skippedCount += tenantsToInvoice.filter(t => t.hasExistingInvoice).length;
    
    setGenerationResults({ created: createdCount, skipped: skippedCount });
    setStep('complete');
    
    // Refresh data
    queryClient.invalidateQueries({ queryKey: ['rent-records'] });
    
    if (createdCount > 0) {
      toast.success(`${createdCount} invoice(s) generated successfully`);
    }
  };
  
  const newInvoiceCount = tenantsToInvoice.filter(t => !t.hasExistingInvoice).length;
  const existingInvoiceCount = tenantsToInvoice.filter(t => t.hasExistingInvoice).length;
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generate Rent Invoices
          </DialogTitle>
          <DialogDescription>
            Create rent records for all tenants for a specific month
          </DialogDescription>
        </DialogHeader>
        
        {step === 'select' && (
          <div className="space-y-6">
            {/* Month/Year Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(m => (
                      <SelectItem key={m.value} value={String(m.value)}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(y => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Property Selection */}
            <div className="space-y-3">
              <Label>Properties</Label>
              <div className="flex items-center gap-2 mb-3">
                <Checkbox 
                  id="selectAll" 
                  checked={selectAll}
                  onCheckedChange={(checked) => {
                    setSelectAll(checked === true);
                    if (checked) setSelectedPropertyIds([]);
                  }}
                />
                <label htmlFor="selectAll" className="text-sm font-medium cursor-pointer">
                  All properties ({properties.length})
                </label>
              </div>
              
              {!selectAll && (
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                  {properties.map(prop => (
                    <div key={prop.id} className="flex items-center gap-2">
                      <Checkbox 
                        id={prop.id}
                        checked={selectedPropertyIds.includes(prop.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPropertyIds([...selectedPropertyIds, prop.id]);
                          } else {
                            setSelectedPropertyIds(selectedPropertyIds.filter(id => id !== prop.id));
                          }
                        }}
                      />
                      <label htmlFor={prop.id} className="text-sm cursor-pointer">
                        {prop.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Notification Option */}
            <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/50">
              <Checkbox 
                id="sendNotifications" 
                checked={sendNotifications}
                onCheckedChange={(checked) => setSendNotifications(checked === true)}
              />
              <label htmlFor="sendNotifications" className="text-sm cursor-pointer">
                Send notification to tenants when invoices are generated
              </label>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={loadTenantsForPreview}>
                Preview Invoices
              </Button>
            </div>
          </div>
        )}
        
        {step === 'preview' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="gap-1">
                {format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy')}
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Users className="w-3 h-3" />
                {tenantsToInvoice.length} tenants
              </Badge>
            </div>
            
            {existingInvoiceCount > 0 && (
              <div className="flex items-start gap-2 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    {existingInvoiceCount} tenant(s) already have invoices for this month
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    These will be skipped to avoid duplicates.
                  </p>
                </div>
              </div>
            )}
            
            <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Tenant</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenantsToInvoice.map(tenant => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell>{tenant.property_name}</TableCell>
                      <TableCell className="text-right">KES {tenant.rent_amount.toLocaleString()}</TableCell>
                      <TableCell>
                        {tenant.hasExistingInvoice ? (
                          <Badge variant="secondary">Already exists</Badge>
                        ) : (
                          <Badge className="bg-primary">Will create</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStep('select')}>
                Back
              </Button>
              <Button onClick={handleGenerate} disabled={newInvoiceCount === 0}>
                Generate {newInvoiceCount} Invoice{newInvoiceCount !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}
        
        {step === 'generating' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Generating invoices...</p>
            <p className="text-sm text-muted-foreground mt-1">
              Please wait, this may take a moment
            </p>
          </div>
        )}
        
        {step === 'complete' && (
          <div className="space-y-6">
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Invoices Generated</h3>
              <p className="text-muted-foreground mt-1">
                {format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy')}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-primary/30">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-primary">{generationResults.created}</div>
                  <div className="text-sm text-muted-foreground">Created</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-muted-foreground">{generationResults.skipped}</div>
                  <div className="text-sm text-muted-foreground">Skipped</div>
                </CardContent>
              </Card>
            </div>
            
            {sendNotifications && generationResults.created > 0 && (
              <p className="text-sm text-center text-muted-foreground">
                Notifications have been sent to {generationResults.created} tenant(s)
              </p>
            )}
            
            <div className="flex justify-end">
              <Button onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
