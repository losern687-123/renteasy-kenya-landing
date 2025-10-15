import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  property_name: z.string().min(1, "Property name is required"),
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a valid positive number",
  }),
  payment_date: z.string().optional(),
  due_date: z.string().min(1, "Due date is required"),
  status: z.enum(["Paid", "Pending", "Overdue"]),
});

type FormData = z.infer<typeof formSchema>;

interface RentRecord {
  id: string;
  property_name: string;
  amount: number;
  payment_date: string | null;
  due_date: string;
  status: string;
}

interface EditPaymentDialogProps {
  record: RentRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditPaymentDialog = ({ record, open, onOpenChange, onSuccess }: EditPaymentDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (record) {
      form.reset({
        property_name: record.property_name,
        amount: record.amount.toString(),
        payment_date: record.payment_date || "",
        due_date: record.due_date,
        status: record.status as any,
      });
    }
  }, [record, form]);

  const onSubmit = async (data: FormData) => {
    if (!record) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from("rent_records")
      .update({
        property_name: data.property_name,
        amount: Number(data.amount),
        payment_date: data.payment_date || null,
        due_date: data.due_date,
        status: data.status,
      })
      .eq("id", record.id);

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update payment record",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Payment record updated successfully!",
    });

    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Payment Record</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="edit_property_name">Property Name</Label>
            <Input
              id="edit_property_name"
              placeholder="e.g., Apartment 101, Nairobi"
              {...form.register("property_name")}
            />
            {form.formState.errors.property_name && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.property_name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="edit_amount">Rent Amount (KES)</Label>
            <Input
              id="edit_amount"
              type="number"
              placeholder="e.g., 25000"
              {...form.register("amount")}
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.amount.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="edit_due_date">Due Date</Label>
            <Input id="edit_due_date" type="date" {...form.register("due_date")} />
            {form.formState.errors.due_date && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.due_date.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="edit_payment_date">Payment Date (Optional)</Label>
            <Input id="edit_payment_date" type="date" {...form.register("payment_date")} />
          </div>

          <div>
            <Label htmlFor="edit_status">Payment Status</Label>
            <Select onValueChange={(value) => form.setValue("status", value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
