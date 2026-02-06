import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, User, Bell, Lock, CreditCard, Shield, Sun, Moon, Monitor, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTheme } from "@/hooks/useTheme";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Password must be at least 6 characters"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface LandlordSettingsTabProps {
  onUpgrade: () => void;
}

export default function LandlordSettingsTab({ onUpgrade }: LandlordSettingsTabProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isUpdating, setIsUpdating] = useState(false);
  const [rentReminders, setRentReminders] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", email: "" },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("name, email, rent_reminders_enabled, payment_alerts_enabled")
      .eq("id", user.id)
      .single();

    if (data) {
      profileForm.reset({ name: data.name, email: data.email });
      setRentReminders(data.rent_reminders_enabled ?? true);
      setPaymentAlerts(data.payment_alerts_enabled ?? true);
    }
  };

  const onProfileSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    setIsUpdating(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name: data.name, email: data.email })
      .eq("id", user.id);
    setIsUpdating(false);
    if (error) toast.error("Failed to update profile");
    else toast.success("Profile updated successfully");
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsUpdating(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser?.email) {
        toast.error("Unable to verify user session");
        return;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: data.currentPassword,
      });

      if (authError) {
        toast.error("Current password is incorrect");
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: data.newPassword });
      if (error) toast.error(error.message);
      else {
        toast.success("Password updated successfully");
        passwordForm.reset();
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!user) return;
    setIsUpdating(true);
    const { error } = await supabase
      .from("profiles")
      .update({ rent_reminders_enabled: rentReminders, payment_alerts_enabled: paymentAlerts })
      .eq("id", user.id);
    setIsUpdating(false);
    if (error) toast.error("Failed to update preferences");
    else toast.success("Notification preferences updated");
  };

  const themeOptions = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "system" as const, label: "System", icon: Monitor },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...profileForm.register("name")} />
              {profileForm.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">{profileForm.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...profileForm.register("email")} />
              {profileForm.formState.errors.email && (
                <p className="text-sm text-destructive mt-1">{profileForm.formState.errors.email.message}</p>
              )}
            </div>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Subscription
          </CardTitle>
          <CardDescription>Manage your plan and billing</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/landlord/subscription")}>
            View Plan Details
          </Button>
          <Button onClick={onUpgrade}>
            Upgrade Plan
          </Button>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how RentEasy looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.value;
              return (
                <motion.button
                  key={option.value}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setTheme(option.value)}
                  className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                    isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className={`rounded-full p-3 ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium">{option.label}</span>
                  {isSelected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Choose what notifications you receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Rent Reminders</Label>
              <p className="text-sm text-muted-foreground">Get notified when rent is due</p>
            </div>
            <Switch checked={rentReminders} onCheckedChange={setRentReminders} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Payment Alerts</Label>
              <p className="text-sm text-muted-foreground">Get notified about payment confirmations</p>
            </div>
            <Switch checked={paymentAlerts} onCheckedChange={setPaymentAlerts} />
          </div>
          <Button onClick={handleSaveNotifications} disabled={isUpdating} variant="outline">
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Preferences
          </Button>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security
          </CardTitle>
          <CardDescription>Manage your password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" {...passwordForm.register("currentPassword")} />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" {...passwordForm.register("newPassword")} />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" {...passwordForm.register("confirmPassword")} />
            </div>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50 bg-card/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
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
  );
}
