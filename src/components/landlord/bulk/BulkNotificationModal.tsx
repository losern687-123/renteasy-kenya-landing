import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell, Loader2, CheckCircle, Users, Mail, MessageSquare, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { cn } from "@/lib/utils";

interface BulkNotificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type NotificationStep = 'select' | 'compose' | 'preview' | 'sending' | 'complete';
type TenantFilter = 'all' | 'pending' | 'overdue';

interface TenantToNotify {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'pending' | 'overdue' | 'paid' | 'none';
  amount?: number;
}

const templates = {
  friendly: {
    name: 'Friendly Reminder',
    subject: 'Rent Payment Reminder',
    message: 'Hi {tenant_name}, just a friendly reminder that your rent payment of KES {amount} is due on the 5th. Please ensure timely payment to avoid any late fees. Thank you!',
  },
  due: {
    name: 'Due Date Reminder',
    subject: 'Rent Payment Due Tomorrow',
    message: 'Hi {tenant_name}, this is a reminder that your rent payment of KES {amount} is due tomorrow. Please make your payment at your earliest convenience.',
  },
  overdue: {
    name: 'Overdue Notice',
    subject: 'Rent Payment Overdue',
    message: 'Hi {tenant_name}, your rent payment of KES {amount} is now overdue. Please make your payment immediately to avoid additional charges.',
  },
  final: {
    name: 'Final Warning',
    subject: 'Final Payment Notice',
    message: 'Hi {tenant_name}, this is your final notice regarding your overdue rent payment of KES {amount}. Please contact us immediately to discuss payment options.',
  },
  custom: {
    name: 'Custom Message',
    subject: '',
    message: '',
  },
};

export function BulkNotificationModal({ open, onOpenChange }: BulkNotificationModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { tierName } = useSubscriptionLimits();
  const isPro = ['pro', 'enterprise', 'custom'].includes(tierName);
  
  const [step, setStep] = useState<NotificationStep>('select');
  const [tenantFilter, setTenantFilter] = useState<TenantFilter>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof templates>('friendly');
  const [customSubject, setCustomSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSMS, setSendSMS] = useState(false);
  const [tenantsToNotify, setTenantsToNotify] = useState<TenantToNotify[]>([]);
  const [sendResults, setSendResults] = useState({ sent: 0, failed: 0 });
  
  // Fetch tenants with their payment status
  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants-for-notification', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('id, name, email, phone')
        .eq('landlord_id', user.id)
        .eq('status', 'active');
      
      if (!tenantData) return [];
      
      // Get current month's rent records
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      
      const { data: rentRecords } = await supabase
        .from('rent_records')
        .select('tenant_id, status, amount')
        .gte('due_date', monthStart);
      
      return tenantData.map(t => {
        const record = rentRecords?.find(r => r.tenant_id === t.id);
        return {
          ...t,
          status: record?.status as TenantToNotify['status'] || 'none',
          amount: record?.amount,
        };
      });
    },
    enabled: !!user && open,
  });
  
  const resetState = () => {
    setStep('select');
    setTenantFilter('all');
    setSelectedTemplate('friendly');
    setCustomSubject('');
    setCustomMessage('');
    setSendEmail(true);
    setSendSMS(false);
    setTenantsToNotify([]);
    setSendResults({ sent: 0, failed: 0 });
  };
  
  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };
  
  const loadTenantsForPreview = () => {
    let filtered = tenants;
    
    if (tenantFilter === 'pending') {
      filtered = tenants.filter(t => t.status === 'pending');
    } else if (tenantFilter === 'overdue') {
      filtered = tenants.filter(t => t.status === 'overdue');
    }
    
    setTenantsToNotify(filtered);
    setStep('compose');
  };
  
  const getMessage = (tenant: TenantToNotify) => {
    const template = templates[selectedTemplate];
    let message = selectedTemplate === 'custom' ? customMessage : template.message;
    
    message = message
      .replace('{tenant_name}', tenant.name)
      .replace('{amount}', (tenant.amount || 0).toLocaleString());
    
    return message;
  };
  
  const getSubject = () => {
    if (selectedTemplate === 'custom') return customSubject;
    return templates[selectedTemplate].subject;
  };
  
  const handleSend = async () => {
    if (!user) return;
    
    setStep('sending');
    
    let sentCount = 0;
    let failedCount = 0;
    
    for (const tenant of tenantsToNotify) {
      try {
        // Create in-app notification
        const { error } = await supabase
          .from('notifications')
          .insert({
            user_id: tenant.id,
            type: 'rent_reminder',
            message: getMessage(tenant),
          });
        
        if (error) {
          failedCount++;
        } else {
          sentCount++;
        }
        
        // TODO: Add email sending via edge function
        // TODO: Add SMS sending via Africa's Talking (Phase 2)
        
      } catch (error) {
        failedCount++;
      }
    }
    
    setSendResults({ sent: sentCount, failed: failedCount });
    setStep('complete');
    
    if (sentCount > 0) {
      toast.success(`${sentCount} notification(s) sent successfully`);
    }
  };
  
  const filteredCount = {
    all: tenants.length,
    pending: tenants.filter(t => t.status === 'pending').length,
    overdue: tenants.filter(t => t.status === 'overdue').length,
  };
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Send Bulk Notifications
          </DialogTitle>
          <DialogDescription>
            Send rent reminders to multiple tenants at once
          </DialogDescription>
        </DialogHeader>
        
        {step === 'select' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Select tenants to notify</Label>
              <RadioGroup value={tenantFilter} onValueChange={(v) => setTenantFilter(v as TenantFilter)}>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="all" id="all" />
                  <label htmlFor="all" className="flex-1 cursor-pointer">
                    <div className="font-medium">All tenants</div>
                    <div className="text-sm text-muted-foreground">{filteredCount.all} tenants</div>
                  </label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="pending" id="pending" />
                  <label htmlFor="pending" className="flex-1 cursor-pointer">
                    <div className="font-medium">Tenants with pending payments</div>
                    <div className="text-sm text-muted-foreground">{filteredCount.pending} tenants</div>
                  </label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="overdue" id="overdue" />
                  <label htmlFor="overdue" className="flex-1 cursor-pointer">
                    <div className="font-medium">Tenants with overdue payments</div>
                    <div className="text-sm text-muted-foreground">{filteredCount.overdue} tenants</div>
                  </label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={loadTenantsForPreview} disabled={filteredCount[tenantFilter] === 0}>
                Next
              </Button>
            </div>
          </div>
        )}
        
        {step === 'compose' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Users className="w-3 h-3" />
                {tenantsToNotify.length} recipients
              </Badge>
            </div>
            
            {/* Template Selection */}
            <div className="space-y-3">
              <Label>Select message template</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(templates).map(([key, template]) => (
                  <Card 
                    key={key}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedTemplate === key ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedTemplate(key as keyof typeof templates)}
                  >
                    <CardContent className="p-3">
                      <p className="font-medium text-sm">{template.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            {/* Custom Message */}
            {selectedTemplate === 'custom' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Enter subject..."
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Enter your message... Use {tenant_name} and {amount} as placeholders."
                    rows={4}
                  />
                </div>
              </div>
            )}
            
            {/* Preview */}
            {selectedTemplate !== 'custom' && (
              <div className="space-y-2">
                <Label>Message preview</Label>
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium mb-2">{getSubject()}</p>
                    <p className="text-sm text-muted-foreground">
                      {templates[selectedTemplate].message}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Delivery Channels */}
            <div className="space-y-3">
              <Label>Delivery channels</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="email" 
                    checked={sendEmail}
                    onCheckedChange={(checked) => setSendEmail(checked === true)}
                  />
                  <label htmlFor="email" className="flex items-center gap-2 cursor-pointer">
                    <Mail className="w-4 h-4" />
                    In-app notification
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="sms" 
                    checked={sendSMS}
                    onCheckedChange={(checked) => setSendSMS(checked === true)}
                    disabled={!isPro}
                  />
                  <label htmlFor="sms" className={cn("flex items-center gap-2 cursor-pointer", !isPro && "opacity-50")}>
                    <MessageSquare className="w-4 h-4" />
                    SMS
                    {!isPro && <Badge variant="secondary" className="text-xs">Pro</Badge>}
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStep('select')}>Back</Button>
              <Button onClick={() => setStep('preview')}>
                Preview & Send
              </Button>
            </div>
          </div>
        )}
        
        {step === 'preview' && (
          <div className="space-y-6">
            <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Tenant</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenantsToNotify.slice(0, 10).map(tenant => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{tenant.email}</TableCell>
                      <TableCell>
                        <Badge variant={tenant.status === 'overdue' ? 'destructive' : 'secondary'}>
                          {tenant.status || 'N/A'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {tenantsToNotify.length > 10 && (
              <p className="text-sm text-center text-muted-foreground">
                +{tenantsToNotify.length - 10} more tenants
              </p>
            )}
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStep('compose')}>Back</Button>
              <Button onClick={handleSend}>
                Send to {tenantsToNotify.length} Tenant{tenantsToNotify.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}
        
        {step === 'sending' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Sending notifications...</p>
          </div>
        )}
        
        {step === 'complete' && (
          <div className="space-y-6">
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Notifications Sent</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-primary/30">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-primary">{sendResults.sent}</div>
                  <div className="text-sm text-muted-foreground">Sent</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-muted-foreground">{sendResults.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
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
