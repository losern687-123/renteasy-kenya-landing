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
        body: {
          name: data.name,
          email: data.email,
          phone: data.phone,
        },
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
      <div className="min-h-screen bg-gradient-subtle">
        <main className="container mx-auto px-4 py-16 min-h-[calc(100vh-80px)] flex items-center">
          <div className="max-w-lg mx-auto w-full">
            {!isSuccess ? (
              <Card className="animate-fade-in shadow-xl border-border/50">
                <CardHeader className="text-center">
                  <CardTitle className="text-3xl bg-gradient-hero bg-clip-text text-transparent">
                    Join the Waitlist
                  </CardTitle>
                  <CardDescription>
                    Be the first to know when RentEasy Kenya launches! Get early access and exclusive updates.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        {...register("name")}
                        placeholder="John Kamau"
                        className="mt-1"
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register("email")}
                        placeholder="john@example.com"
                        className="mt-1"
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        {...register("phone")}
                        placeholder="0712345678"
                        className="mt-1"
                      />
                      {errors.phone && (
                        <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="w-full bg-gradient-hero hover:opacity-90 transition-opacity hover-scale" 
                      size="lg"
                    >
                      {isSubmitting ? "Joining..." : "Join Waitlist"}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      We respect your privacy. Your information will only be used to notify you about RentEasy Kenya updates.
                    </p>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="text-center animate-scale-in shadow-xl">
                <CardContent className="pt-12 pb-12">
                  <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
                  <h2 className="text-2xl font-bold mb-2">You're on the list!</h2>
                  <p className="text-muted-foreground mb-6">
                    Thank you for joining the RentEasy Kenya waitlist. We'll keep you updated on our launch.
                  </p>
                  <Button onClick={() => navigate("/")} className="bg-gradient-hero hover:opacity-90 hover-scale">
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
