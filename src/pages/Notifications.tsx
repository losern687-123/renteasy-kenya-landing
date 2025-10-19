import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useNotifications } from "@/hooks/useNotifications";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Notifications() {
  const { notifications, markAsRead, markAllAsRead, loading } = useNotifications();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground mt-1">
              Stay updated with your rent alerts
            </p>
          </div>
          {notifications.some((n) => !n.is_read) && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">You're all caught up!</h2>
            <p className="text-muted-foreground">
              No notifications to show right now.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 transition-colors ${
                  !notification.is_read ? "bg-muted/30 border-primary/20" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {notification.type === "rent_due" && (
                        <Badge variant="secondary">⚠️ Due Soon</Badge>
                      )}
                      {notification.type === "rent_overdue" && (
                        <Badge variant="destructive">❗ Overdue</Badge>
                      )}
                      {notification.type === "rent_paid" && (
                        <Badge variant="default">✅ Payment</Badge>
                      )}
                      {notification.type === "rent_pending" && (
                        <Badge variant="outline">⏳ Pending</Badge>
                      )}
                    </div>
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
