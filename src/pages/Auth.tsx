import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Building2, UserCircle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { useRoleRedirect } from "@/hooks/useRoleRedirect";
import { supabase } from "@/integrations/supabase/client";

const emailSchema = z.string().email("Invalid email address").max(255, "Email must be less than 255 characters");
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");
const nameSchema = z.string().trim().min(1, "Name cannot be empty").max(100, "Name must be less than 100 characters");
const landlordIdSchema = z.string().trim().min(1, "Landlord ID is required").regex(/^LND-\d{6}$/, "Invalid Landlord ID format (e.g., LND-123456)");

export default function Auth() {
  const { user, signUp, signIn, loading } = useAuth();
  const { redirectBasedOnRole } = useRoleRedirect();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<'tenant' | 'landlord'>('tenant');
  const [landlordId, setLandlordId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingLandlord, setIsValidatingLandlord] = useState(false);

  if (user && !loading) {
    redirectBasedOnRole();
    return null;
  }

  const validateLandlordId = async (id: string): Promise<{ valid: boolean; error?: string }> => {
    try {
      // Check if landlord ID exists in profiles and if they're approved
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, landlord_id')
        .eq('landlord_id', id)
        .maybeSingle();

      if (profileError) {
        console.error('Error checking landlord ID:', profileError);
        return { valid: false, error: "Error validating landlord ID. Please try again." };
      }

      if (!profile) {
        return { valid: false, error: "This landlord ID does not exist." };
      }

      // Check if landlord is approved
      const { data: application, error: appError } = await supabase
        .from('landlord_applications')
        .select('status')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (appError) {
        console.error('Error checking landlord application:', appError);
        return { valid: false, error: "Error validating landlord status. Please try again." };
      }

      if (!application || application.status !== 'approved') {
        return { valid: false, error: "This landlord ID is not approved yet." };
      }

      return { valid: true };
    } catch (error) {
      console.error('Unexpected error validating landlord:', error);
      return { valid: false, error: "An unexpected error occurred." };
    }
  };

  const validateInputs = async () => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (!isLogin) {
        nameSchema.parse(name);
        
        // For tenants, validate landlord ID
        if (role === 'tenant') {
          landlordIdSchema.parse(landlordId);
          
          setIsValidatingLandlord(true);
          const validation = await validateLandlordId(landlordId);
          setIsValidatingLandlord(false);
          
          if (!validation.valid) {
            toast({
              title: "Invalid Landlord ID",
              description: validation.error,
              variant: "destructive",
            });
            return false;
          }
        }
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = await validateInputs();
    if (!isValid) return;
    
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Login failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          await redirectBasedOnRole();
        }
      } else {
        // Pass landlord ID for tenant registration
        const { error } = await signUp(email, password, name, role, role === 'tenant' ? landlordId : undefined);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Please log in instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Registration failed",
              description: error.message,
              variant: "destructive",
            });
          }
        }
        // Note: signUp() handles role-based navigation after successful registration.
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            RentEasy Kenya
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isLogin ? "Welcome back to RentEasy Kenya" : "Join RentEasy Kenya today"}
          </p>
        </div>

        <Card className="border-primary/20 shadow-xl">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">{isLogin ? "Login" : "Create Account"}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {isLogin 
                ? "Enter your credentials to access your dashboard" 
                : "Choose your role and create your account"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>I am a:</Label>
                    <Tabs value={role} onValueChange={(v) => setRole(v as 'tenant' | 'landlord')} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="tenant" className="gap-2">
                          <UserCircle className="w-4 h-4" />
                          Tenant
                        </TabsTrigger>
                        <TabsTrigger value="landlord" className="gap-2">
                          <Building2 className="w-4 h-4" />
                          Landlord
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  {role === 'tenant' && (
                    <div className="space-y-2">
                      <Label htmlFor="landlordId">Landlord ID Number</Label>
                      <Input
                        id="landlordId"
                        type="text"
                        placeholder="LND-123456"
                        value={landlordId}
                        onChange={(e) => setLandlordId(e.target.value.toUpperCase())}
                        required
                        maxLength={10}
                        className="uppercase"
                      />
                      <p className="text-xs text-muted-foreground">
                        Ask your landlord for their unique ID (e.g., LND-123456)
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={255}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting || isValidatingLandlord}>
                {isValidatingLandlord ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validating Landlord...
                  </>
                ) : isSubmitting ? (
                  "Please wait..."
                ) : (
                  isLogin ? "Login" : "Create Account"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
            <div className="text-xs sm:text-sm text-center text-muted-foreground">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? "Sign up" : "Login"}
              </button>
            </div>
            {isLogin && (
              <div className="text-xs sm:text-sm text-center">
                <Link 
                  to="/forgot-password"
                  className="text-primary hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
            )}
            <div className="text-center">
              <Link to="/" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                ← Back to home
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
