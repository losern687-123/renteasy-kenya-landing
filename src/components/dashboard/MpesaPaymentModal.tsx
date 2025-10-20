import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MpesaPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function MpesaPaymentModal({ open, onOpenChange, onSuccess }: MpesaPaymentModalProps) {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber || !amount) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('pending');

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();

      // Call M-Pesa STK Push edge function
      const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: {
          phoneNumber,
          amount: numericAmount,
          tenantId: user.id,
          tenantName: profile?.name || 'Tenant',
        },
      });

      if (error) throw error;

      if (data.success) {
        setPaymentId(data.paymentId);
        toast({
          title: "STK Push Sent",
          description: "Please check your phone and enter your M-Pesa PIN",
        });

        // Poll for payment status
        pollPaymentStatus(data.paymentId);
      } else {
        throw new Error(data.error || 'Payment initiation failed');
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      setPaymentStatus('failed');
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const pollPaymentStatus = async (paymentRecordId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // Poll for 1 minute (30 * 2 seconds)

    const interval = setInterval(async () => {
      attempts++;

      try {
        const { data: payment, error } = await supabase
          .from('mpesa_payments')
          .select('status, result_desc, mpesa_receipt_number')
          .eq('id', paymentRecordId)
          .single();

        if (error) throw error;

        if (payment.status === 'success') {
          clearInterval(interval);
          setPaymentStatus('success');
          setIsProcessing(false);
          toast({
            title: "Payment Successful",
            description: `Payment received. Receipt: ${payment.mpesa_receipt_number}`,
          });
          onSuccess?.();
        } else if (payment.status === 'failed') {
          clearInterval(interval);
          setPaymentStatus('failed');
          setIsProcessing(false);
          toast({
            title: "Payment Failed",
            description: payment.result_desc || "Payment was not completed",
            variant: "destructive",
          });
        }

        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPaymentStatus('failed');
          setIsProcessing(false);
          toast({
            title: "Timeout",
            description: "Payment verification timed out. Please check your payment history.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error polling payment status:", error);
        clearInterval(interval);
        setPaymentStatus('failed');
        setIsProcessing(false);
      }
    }, 2000);
  };

  const handleClose = () => {
    if (!isProcessing) {
      setPhoneNumber("");
      setAmount("");
      setPaymentStatus('idle');
      setPaymentId(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-background/95 to-secondary/20 backdrop-blur-lg border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Make Rent Payment
          </DialogTitle>
          <DialogDescription>
            Pay your rent securely using M-Pesa STK Push
          </DialogDescription>
        </DialogHeader>

        <Alert className="bg-amber-500/10 border-amber-500/20">
          <Info className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-sm text-amber-600 dark:text-amber-400">
            <strong>Sandbox Mode:</strong> Payments are simulated for demo purposes only
          </AlertDescription>
        </Alert>

        {paymentStatus === 'idle' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="254712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isProcessing}
                className="bg-white/50 dark:bg-white/10 border-white/20"
              />
              <p className="text-xs text-muted-foreground">
                Enter your M-Pesa number (e.g., 254712345678)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (KES)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isProcessing}
                className="bg-white/50 dark:bg-white/10 border-white/20"
                step="0.01"
                min="1"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-hero hover:opacity-90 transition-opacity"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Initiate Payment"
              )}
            </Button>
          </form>
        )}

        {paymentStatus === 'pending' && (
          <div className="space-y-4 py-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div>
              <h3 className="font-semibold text-lg">Waiting for Payment</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Please check your phone and enter your M-Pesa PIN to complete the payment
              </p>
            </div>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="space-y-4 py-6 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
            <div>
              <h3 className="font-semibold text-lg text-green-600 dark:text-green-400">
                Payment Successful!
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Your rent payment has been processed successfully
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="space-y-4 py-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
            <div>
              <h3 className="font-semibold text-lg text-red-600 dark:text-red-400">
                Payment Failed
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                The payment could not be completed. Please try again.
              </p>
            </div>
            <Button
              onClick={() => {
                setPaymentStatus('idle');
                setPhoneNumber("");
                setAmount("");
              }}
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
