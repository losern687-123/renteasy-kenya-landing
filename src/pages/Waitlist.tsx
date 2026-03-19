import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";

const waitlistSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15),
});

type WaitlistFormData = z.infer<typeof waitlistSchema>;

export default function Waitlist() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
  });

  const onSubmit = async (data: WaitlistFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("send-waitlist-email", {
        body: { name: data.name, email: data.email, phone: data.phone },
      });
      if (error) throw error;
      setIsSuccess(true);
      toast.success("Thank you for joining our waitlist!");
      reset();
    } catch (error: any) {
      console.error("Error submitting waitlist:", error);
      toast.error(error.message || "Failed to join waitlist. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-16 min-h-[calc(100vh-80px)] flex items-center">
          <div className="max-w-lg mx-auto w-full">
            {!isSuccess ? (
              <Card className="animate-fade-in border border-border shadow-sm">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold text-foreground">
                    Join the Waitlist
                  </CardTitle>
                  <CardDescription>
                    Be the first to know when RentEasy Kenya launches! Get early access and exclusive updates.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-foreground">Full Name</Label>
                      <Input id="name" {...register("name")} placeholder="John Kamau" className="h-12" />
                      {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-foreground">Email Address</Label>
                      <Input id="email" type="email" {...register("email")} placeholder="john@example.com" className="h-12" />
                      {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-foreground">Phone Number</Label>
                      <Input id="phone" {...register("phone")} placeholder="0712345678" className="h-12" />
                      {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-base font-medium" size="lg">
                      {isSubmitting ? "Joining..." : "Join Waitlist"}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      We respect your privacy. Your information will only be used to notify you about RentEasy Kenya updates.
                    </p>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="text-center animate-scale-in border border-border shadow-sm">
                <CardContent className="pt-12 pb-12">
                  <CheckCircle2 className="w-14 h-14 mx-auto text-accent mb-4" />
                  <h2 className="text-2xl font-bold text-foreground mb-2">You're on the list!</h2>
                  <p className="text-muted-foreground mb-6">
                    Thank you for joining the RentEasy Kenya waitlist. We'll keep you updated on our launch.
                  </p>
                  <Button onClick={() => navigate("/")} className="h-12 px-8">
                    Return to Home
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
