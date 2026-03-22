import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SeekerLayout } from "@/components/seeker/SeekerLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Heart, FileText, MessageSquare, Upload, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ConversationList } from "@/components/chat/ConversationList";
import { Link } from "react-router-dom";

export default function SeekerDashboard() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("browse");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (user) {
      loadUserName();
    }
  }, [user]);

  const loadUserName = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();
    if (data?.name) setUserName(data.name);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const renderTabContent = () => {
    switch (activeTab) {
      case "browse":
        return (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {userName ? `Welcome, ${userName}` : "Find Your Next Home"}
              </h2>
              <p className="text-muted-foreground">Browse available properties across Nairobi</p>
            </div>

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Explore the Marketplace</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Browse hundreds of verified rental properties with photos, amenities, and instant contact.
                  </p>
                </div>
                <Link to="/marketplace">
                  <Button className="gap-2">
                    Browse Marketplace <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Heart className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">Saved Properties</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <FileText className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">Applications</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <MessageSquare className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">Messages</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Upload className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">Documents</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "saved":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Saved Properties</h2>
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                <p className="font-medium">No saved properties yet</p>
                <p className="text-sm mt-1">Browse the marketplace and save properties you like</p>
                <Button variant="outline" className="mt-4" onClick={() => setActiveTab("browse")}>
                  Browse Properties
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case "applications":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">My Applications</h2>
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                <p className="font-medium">No applications yet</p>
                <p className="text-sm mt-1">Apply to properties you're interested in</p>
              </CardContent>
            </Card>
          </div>
        );

      case "messages":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Messages</h2>
            <Card className="overflow-hidden">
              <ConversationList
                onSelect={(convo) => navigate(`/chat/${convo.id}`)}
              />
            </Card>
          </div>
        );

      case "documents":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">My Documents</h2>
            <p className="text-muted-foreground">Upload your ID and payslips for faster applications</p>
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                <p className="font-medium">No documents uploaded</p>
                <p className="text-sm mt-1">Upload documents to speed up your rental applications</p>
                <Button variant="outline" className="mt-4">Upload Document</Button>
              </CardContent>
            </Card>
          </div>
        );

      case "settings":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Settings</h2>
            <Card>
              <CardHeader>
                <CardTitle>Become a Tenant</CardTitle>
                <CardDescription>
                  Already renting? Enter your landlord's ID to connect as a tenant.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This feature will be available once you connect with a landlord through the marketplace.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <SeekerLayout activeTab={activeTab} onTabChange={setActiveTab} userName={userName}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderTabContent()}
        </motion.div>
      </AnimatePresence>
    </SeekerLayout>
  );
}
