import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Home, DollarSign, LogOut } from "lucide-react";

export default function LandlordDashboard() {
  const { user, userRole, signOut, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (userRole === 'tenant') {
    return <Navigate to="/tenant-dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
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
          <h2 className="text-3xl font-bold mb-2">Landlord Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your properties and track rent payments effortlessly.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-primary/20 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Home className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Properties</CardTitle>
              <CardDescription>Total managed properties</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">5</p>
              <p className="text-sm text-muted-foreground mt-2">All properties active</p>
            </CardContent>
          </Card>

          <Card className="border-accent/20 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <CardTitle>Tenants</CardTitle>
              <CardDescription>Active tenant accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-accent">12</p>
              <p className="text-sm text-muted-foreground mt-2">3 pending payments</p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-secondary" />
              </div>
              <CardTitle>This Month</CardTitle>
              <CardDescription>Expected collections</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-secondary">KES 240,000</p>
              <p className="text-sm text-muted-foreground mt-2">75% collected</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Latest rent payment updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Apartment 3B</p>
                  <p className="text-sm text-muted-foreground">Sarah Mwangi - Feb 2025</p>
                </div>
                <span className="text-green-600 font-semibold">KES 20,000</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">House 5A</p>
                  <p className="text-sm text-muted-foreground">John Kamau - Feb 2025</p>
                </div>
                <span className="text-green-600 font-semibold">KES 25,000</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Studio 1C</p>
                  <p className="text-sm text-muted-foreground">Grace Njeri - Feb 2025</p>
                </div>
                <span className="text-yellow-600 font-semibold">Pending</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
