import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Bell, MessageSquare, LogOut } from "lucide-react";

export default function TenantDashboard() {
  const { user, userRole, signOut, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (userRole === 'landlord') {
    return <Navigate to="/landlord-dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            RentEasy Kenya
          </h1>
          <Button variant="outline" onClick={signOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Tenant Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back! Manage your rent payments and stay on top of deadlines.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-primary/20 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <CalendarDays className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Next Rent Due</CardTitle>
              <CardDescription>Track your upcoming payment</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">15 Days</p>
              <p className="text-sm text-muted-foreground mt-2">Due on March 1, 2025</p>
            </CardContent>
          </Card>

          <Card className="border-accent/20 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Bell className="w-6 h-6 text-accent" />
              </div>
              <CardTitle>Reminders</CardTitle>
              <CardDescription>Active payment reminders</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-accent">3 Active</p>
              <p className="text-sm text-muted-foreground mt-2">Email & SMS notifications</p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-secondary" />
              </div>
              <CardTitle>Messages</CardTitle>
              <CardDescription>Landlord communication</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-secondary">2 New</p>
              <p className="text-sm text-muted-foreground mt-2">Unread messages</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest transactions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Rent Payment</p>
                  <p className="text-sm text-muted-foreground">February 2025</p>
                </div>
                <span className="text-green-600 font-semibold">Paid</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Reminder Set</p>
                  <p className="text-sm text-muted-foreground">March rent reminder</p>
                </div>
                <span className="text-blue-600 font-semibold">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
