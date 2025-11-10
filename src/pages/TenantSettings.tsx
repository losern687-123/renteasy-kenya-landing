import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, User, Bell, Link as LinkIcon, Lock, Copy, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Password must be at least 6 characters"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function TenantSettings() {
  const { user, userRole, loading, signOut } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [rentReminders, setRentReminders] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [landlordCode, setLandlordCode] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<string>("");
  const [myLandlordCode, setMyLandlordCode] = useState<string>("");

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (user) {
      loadProfile();
      checkTenantConnection();
      loadMyLandlordCode();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("name, email, rent_reminders_enabled, payment_alerts_enabled")
      .eq("id", user.id)
      .single();

    if (data) {
      profileForm.reset({
        name: data.name,
        email: data.email,
        phone: user.phone || "",
      });
      setRentReminders(data.rent_reminders_enabled ?? true);
      setPaymentAlerts(data.payment_alerts_enabled ?? true);
    }
  };

  const checkTenantConnection = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("tenants")
      .select("verification_status")
      .eq("id", user.id)
      .single();

    if (data) {
      setConnectionStatus(data.verification_status || "pending");
    }
  };

  const loadMyLandlordCode = async () => {
    if (!user) return;
    
    // Check if user has landlord role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    
    if (roleData?.role !== "landlord") return;

    const { data } = await supabase
      .from("profiles")
      .select("landlord_code")
      .eq("id", user.id)
      .single();

    if (data?.landlord_code) {
      setMyLandlordCode(data.landlord_code);
    } else {
      // Generate new code for landlord
      const { data: newCode } = await supabase.rpc("generate_landlord_code");
      if (newCode) {
        await supabase
          .from("profiles")
          .update({ landlord_code: newCode })
          .eq("id", user.id);
        setMyLandlordCode(newCode);
      }
    }
  };

  const onProfileSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    setIsUpdating(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        name: data.name,
        email: data.email,
      })
      .eq("id", user.id);

    setIsUpdating(false);

    if (error) {
      toast.error("Failed to update profile");
      return;
    }

    toast.success("Profile updated successfully");
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsUpdating(true);

    const { error } = await supabase.auth.updateUser({
      password: data.newPassword,
    });

    setIsUpdating(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password updated successfully");
    passwordForm.reset();
  };

  const handleLandlordConnect = async () => {
    if (!user || !landlordCode.trim()) {
      toast.error("Please enter a landlord code");
      return;
    }

    // Validate code format
    if (landlordCode.length !== 8) {
      toast.error("Landlord code must be 8 characters");
      return;
    }

    setIsUpdating(true);

    try {
      // Find landlord by code with role verification
      const { data: landlordProfile, error: landlordError } = await supabase
        .from("profiles")
        .select(`
          id,
          user_roles!inner(role)
        `)
        .eq("landlord_code", landlordCode.toUpperCase())
        .single();

      if (landlordError || !landlordProfile) {
        toast.error("Invalid landlord code");
        setIsUpdating(false);
        return;
      }

      // Verify landlord role
      const userRole = (landlordProfile as any).user_roles?.role;
      if (userRole !== 'landlord') {
        toast.error("Invalid landlord code");
        setIsUpdating(false);
        return;
      }

      // Check landlord application status
      const { data: application } = await supabase
        .from("landlord_applications")
        .select("status")
        .eq("user_id", landlordProfile.id)
        .single();

      if (!application || application.status !== 'approved') {
        toast.error("Landlord account not yet verified by admin");
        setIsUpdating(false);
        return;
      }

      // Check if already connected
      const { data: existingTenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("id", user.id)
        .single();

      if (existingTenant) {
        toast.error("You are already connected to a landlord");
        setIsUpdating(false);
        return;
      }

      // Get profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", user.id)
        .single();

      // Create tenant connection
      const { error } = await supabase
        .from("tenants")
        .insert({
          id: user.id,
          landlord_id: landlordProfile.id,
          name: profile?.name || "",
          email: profile?.email || "",
          phone: user.phone || "",
          verification_status: "pending",
        });

      if (error) throw error;

      toast.success("Connection request sent to landlord");
      setConnectionStatus("pending");
      setLandlordCode("");
    } catch (error: any) {
      console.error("Connection error:", error);
      toast.error("Failed to connect with landlord");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!user) return;

    setIsUpdating(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        rent_reminders_enabled: rentReminders,
        payment_alerts_enabled: paymentAlerts,
      })
      .eq("id", user.id);

    setIsUpdating(false);

    if (error) {
      toast.error("Failed to update preferences");
    } else {
      toast.success("Notification preferences updated");
    }
  };

  const copyLandlordCode = () => {
    if (myLandlordCode) {
      navigator.clipboard.writeText(myLandlordCode);
      toast.success("Landlord code copied to clipboard");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (userRole === "landlord") {
    return <Navigate to="/landlord-dashboard" replace />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and profile</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="landlord" className="gap-2">
              <LinkIcon className="h-4 w-4" />
              Landlord
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-2">
              <Lock className="h-4 w-4" />
              Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Your full name"
                      {...profileForm.register("name")}
                    />
                    {profileForm.formState.errors.name && (
                      <p className="text-sm text-destructive mt-1">
                        {profileForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      {...profileForm.register("email")}
                    />
                    {profileForm.formState.errors.email && (
                      <p className="text-sm text-destructive mt-1">
                        {profileForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0712345678"
                      {...profileForm.register("phone")}
                    />
                    {profileForm.formState.errors.phone && (
                      <p className="text-sm text-destructive mt-1">
                        {profileForm.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose what notifications you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="rent-reminders">Rent Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when rent is due
                    </p>
                  </div>
                  <Switch
                    id="rent-reminders"
                    checked={rentReminders}
                    onCheckedChange={setRentReminders}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="payment-alerts">Payment Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when payments are confirmed
                    </p>
                  </div>
                  <Switch
                    id="payment-alerts"
                    checked={paymentAlerts}
                    onCheckedChange={setPaymentAlerts}
                  />
                </div>

                <Button onClick={handleSaveNotifications} disabled={isUpdating}>
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="landlord">
            <Card>
              <CardHeader>
                <CardTitle>Landlord Connection</CardTitle>
                <CardDescription>
                  {myLandlordCode
                    ? "Share your code with tenants to connect them to your account"
                    : "Connect your account to your landlord for automated rent tracking"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {myLandlordCode && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <Label>Your Landlord Code</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={myLandlordCode}
                        readOnly
                        className="font-mono text-lg"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={copyLandlordCode}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Share this code with your tenants to connect them
                    </p>
                  </div>
                )}

                {!myLandlordCode && (
                  <>
                    {connectionStatus && (
                      <div className="p-3 rounded-lg bg-muted flex items-center gap-2">
                        {connectionStatus === "verified" && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        <p className="text-sm font-medium">
                          Connection Status: <span className="capitalize">{connectionStatus}</span>
                        </p>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="landlord-code">Landlord Code</Label>
                      <Input
                        id="landlord-code"
                        placeholder="Enter the 8-character code"
                        value={landlordCode}
                        onChange={(e) => setLandlordCode(e.target.value.toUpperCase())}
                        maxLength={8}
                        disabled={connectionStatus === "verified"}
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        Ask your landlord for their unique connection code
                      </p>
                    </div>

                    <Button 
                      onClick={handleLandlordConnect} 
                      disabled={isUpdating || !landlordCode || connectionStatus === "verified"}
                    >
                      {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {connectionStatus === "verified" ? "Connected" : "Connect to Landlord"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <div>
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        {...passwordForm.register("currentPassword")}
                      />
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="text-sm text-destructive mt-1">
                          {passwordForm.formState.errors.currentPassword.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        {...passwordForm.register("newPassword")}
                      />
                      {passwordForm.formState.errors.newPassword && (
                        <p className="text-sm text-destructive mt-1">
                          {passwordForm.formState.errors.newPassword.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        {...passwordForm.register("confirmPassword")}
                      />
                      {passwordForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-destructive mt-1">
                          {passwordForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Update Password
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Danger Zone</CardTitle>
                  <CardDescription>Irreversible account actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive" onClick={signOut}>
                    <Lock className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
