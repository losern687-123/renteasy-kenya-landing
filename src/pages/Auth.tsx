import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Building2, UserCircle, Search, Link2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { useRoleRedirect } from "@/hooks/useRoleRedirect";

const emailSchema = z.string().email("Invalid email address").max(255, "Email must be less than 255 characters");
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");
const nameSchema = z.string().trim().min(1, "Name cannot be empty").max(100, "Name must be less than 100 characters");

export default function Auth() {
  const { user, signUp, signIn, loading } = useAuth();
  const { redirectBasedOnRole } = useRoleRedirect();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<'tenant' | 'landlord' | 'property_seeker'>('tenant');
  const [nationalId, setNationalId] = useState("");
  const [landlordCode, setLandlordCode] = useState("");
  const [isValidatingLandlord, setIsValidatingLandlord] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user && !loading) {
    redirectBasedOnRole();
    return null;
  }

  const validateInputs = () => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (!isLogin) {
        nameSchema.parse(name);
        if (role === 'landlord' && !nationalId.trim()) {
          toast({
            title: "Validation Error",
            description: "National ID is required for landlord registration",
            variant: "destructive",
          });
          return false;
        }
        if (role === 'tenant' && landlordCode.trim() && !/^LND-\d{6}$/.test(landlordCode.trim())) {
          toast({
            title: "Validation Error",
            description: "Landlord ID must be in format LND-XXXXXX (e.g. LND-123456)",
            variant: "destructive",
          });
          return false;
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
    const isValid = validateInputs();
    if (!isValid) return;
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({ title: "Login failed", description: error.message, variant: "destructive" });
        }
      } else {
        const { error } = await signUp(email, password, name, role, role === 'landlord' ? nationalId : undefined, role === 'tenant' ? landlordCode.trim() || undefined : undefined);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({ title: "Account exists", description: "This email is already registered. Please log in instead.", variant: "destructive" });
          } else {
            toast({ title: "Registration failed", description: error.message, variant: "destructive" });
          }
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-8">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">RE</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLogin ? "Sign in to your RentEasy Kenya account" : "Join RentEasy Kenya today"}
          </p>
        </div>

        <Card className="border border-border shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-foreground">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      maxLength={100}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">I am a:</Label>
                    <Tabs value={role} onValueChange={(v) => setRole(v as 'tenant' | 'landlord' | 'property_seeker')} className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="tenant" className="gap-1.5 text-xs sm:text-sm">
                          <UserCircle className="w-4 h-4" />
                          Tenant
                        </TabsTrigger>
                        <TabsTrigger value="landlord" className="gap-1.5 text-xs sm:text-sm">
                          <Building2 className="w-4 h-4" />
                          Landlord
                        </TabsTrigger>
                        <TabsTrigger value="property_seeker" className="gap-1.5 text-xs sm:text-sm">
                          <Search className="w-4 h-4" />
                          Seeker
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  {role === 'tenant' && (
                    <div className="space-y-2">
                      <Label htmlFor="landlordCode" className="text-sm font-medium text-foreground">
                        <span className="flex items-center gap-1.5">
                          <Link2 className="w-4 h-4" />
                          Landlord ID <span className="text-muted-foreground font-normal">(optional)</span>
                        </span>
                      </Label>
                      <Input
                        id="landlordCode"
                        type="text"
                        placeholder="e.g. LND-123456"
                        value={landlordCode}
                        onChange={(e) => setLandlordCode(e.target.value.toUpperCase())}
                        maxLength={10}
                        className="h-12 font-mono tracking-wider"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter your landlord's unique ID to automatically link your account. You can also do this later in settings.
                      </p>
                    </div>
                  )}

                  {role === 'landlord' && (
                    <div className="space-y-2">
                      <Label htmlFor="nationalId" className="text-sm font-medium text-foreground">National ID Number</Label>
                      <Input
                        id="nationalId"
                        type="text"
                        placeholder="Enter your National ID"
                        value={nationalId}
                        onChange={(e) => setNationalId(e.target.value)}
                        required
                        className="h-12"
                      />
                      <p className="text-xs text-muted-foreground">
                        Required for verification. Your application will be reviewed by admin.
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={255}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-12"
                />
              </div>

              <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isSubmitting}>
                {isSubmitting ? "Please wait..." : (isLogin ? "Sign In" : "Create Account")}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 p-6 pt-0">
            <div className="text-sm text-center text-muted-foreground">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </div>
            {isLogin && (
              <div className="text-sm text-center">
                <Link to="/forgot-password" className="text-primary hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
            )}
            <div className="text-center">
              <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                ← Back to home
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
