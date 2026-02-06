import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

interface MonthlyData {
  month: string;
  revenue: number;
  expected: number;
  collected: number;
}

interface PropertyPerformance {
  name: string;
  revenue: number;
  expected: number;
  collectionRate: number;
}

interface PaymentStatusData {
  status: string;
  count: number;
  amount: number;
}

interface AnalyticsData {
  // KPI Cards
  totalRevenue: number;
  revenueChange: number;
  collectionRate: number;
  outstandingBalance: number;
  avgDaysToPay: number;
  
  // Chart Data
  revenueByMonth: MonthlyData[];
  paymentStatus: PaymentStatusData[];
  propertyPerformance: PropertyPerformance[];
  
  // Recent Payments
  recentPayments: any[];
  
  // Loading state
  isLoading: boolean;
}

export function useAnalyticsData(monthsBack: number = 6): AnalyticsData {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["landlord-analytics", user?.id, monthsBack],
    queryFn: async () => {
      if (!user) return null;

      const now = new Date();
      const startDate = startOfMonth(subMonths(now, monthsBack - 1));
      
      // Fetch all rent records for the landlord
      const { data: rentRecords } = await supabase
        .from("rent_records")
        .select("*")
        .gte("due_date", format(startDate, "yyyy-MM-dd"))
        .order("due_date", { ascending: false });

      // Fetch properties
      const { data: properties } = await supabase
        .from("properties")
        .select("*")
        .eq("landlord_id", user.id);

      // Fetch tenants linked to landlord
      const { data: tenants } = await supabase
        .from("tenants")
        .select("*")
        .eq("landlord_id", user.id);

      // Filter rent records to only those belonging to landlord's tenants
      const tenantIds = new Set(tenants?.map(t => t.id) || []);
      const landlordRecords = rentRecords?.filter(r => tenantIds.has(r.tenant_id)) || [];

      // Calculate current month stats
      const currentMonthStart = startOfMonth(now);
      const currentMonthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));

      const currentMonthRecords = landlordRecords.filter(r => {
        const date = new Date(r.due_date);
        return date >= currentMonthStart && date <= currentMonthEnd;
      });

      const lastMonthRecords = landlordRecords.filter(r => {
        const date = new Date(r.due_date);
        return date >= lastMonthStart && date <= lastMonthEnd;
      });

      // Revenue calculations
      const currentMonthRevenue = currentMonthRecords
        .filter(r => r.status === "paid")
        .reduce((sum, r) => sum + Number(r.amount), 0);

      const lastMonthRevenue = lastMonthRecords
        .filter(r => r.status === "paid")
        .reduce((sum, r) => sum + Number(r.amount), 0);

      const revenueChange = lastMonthRevenue > 0 
        ? Math.round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
        : 0;

      // Collection rate
      const currentMonthExpected = currentMonthRecords.reduce((sum, r) => sum + Number(r.amount), 0);
      const collectionRate = currentMonthExpected > 0
        ? Math.round((currentMonthRevenue / currentMonthExpected) * 100)
        : 0;

      // Outstanding balance
      const outstandingBalance = landlordRecords
        .filter(r => r.status === "pending" || r.status === "overdue")
        .reduce((sum, r) => sum + Number(r.amount), 0);

      // Average days to pay (simplified)
      const paidRecords = landlordRecords.filter(r => r.status === "paid" && r.payment_date);
      let totalDays = 0;
      paidRecords.forEach(r => {
        if (r.payment_date && r.due_date) {
          const payDate = new Date(r.payment_date);
          const dueDate = new Date(r.due_date);
          const diff = Math.ceil((payDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          totalDays += diff;
        }
      });
      const avgDaysToPay = paidRecords.length > 0 ? Math.round(totalDays / paidRecords.length) : 0;

      // Revenue by month
      const revenueByMonth: MonthlyData[] = [];
      for (let i = monthsBack - 1; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        
        const monthRecords = landlordRecords.filter(r => {
          const date = new Date(r.due_date);
          return date >= monthStart && date <= monthEnd;
        });

        const revenue = monthRecords
          .filter(r => r.status === "paid")
          .reduce((sum, r) => sum + Number(r.amount), 0);
        
        const expected = monthRecords.reduce((sum, r) => sum + Number(r.amount), 0);
        const collected = revenue;

        revenueByMonth.push({
          month: format(monthDate, "MMM"),
          revenue,
          expected,
          collected,
        });
      }

      // Payment status breakdown
      const paid = landlordRecords.filter(r => r.status === "paid");
      const pending = landlordRecords.filter(r => r.status === "pending");
      const overdue = landlordRecords.filter(r => r.status === "overdue");

      const paymentStatus: PaymentStatusData[] = [
        { status: "Paid", count: paid.length, amount: paid.reduce((s, r) => s + Number(r.amount), 0) },
        { status: "Pending", count: pending.length, amount: pending.reduce((s, r) => s + Number(r.amount), 0) },
        { status: "Overdue", count: overdue.length, amount: overdue.reduce((s, r) => s + Number(r.amount), 0) },
      ];

      // Property performance
      const propertyPerformance: PropertyPerformance[] = (properties || []).map(prop => {
        const propRecords = landlordRecords.filter(r => r.property_name === prop.name);
        const propRevenue = propRecords
          .filter(r => r.status === "paid")
          .reduce((sum, r) => sum + Number(r.amount), 0);
        const propExpected = propRecords.reduce((sum, r) => sum + Number(r.amount), 0);
        
        return {
          name: prop.name.length > 15 ? prop.name.substring(0, 15) + "..." : prop.name,
          revenue: propRevenue,
          expected: propExpected,
          collectionRate: propExpected > 0 ? Math.round((propRevenue / propExpected) * 100) : 0,
        };
      }).slice(0, 5); // Top 5 properties

      // Recent payments (last 7 days)
      const sevenDaysAgo = subMonths(now, 0);
      const recentPayments = landlordRecords
        .filter(r => r.status === "paid" && r.payment_date)
        .sort((a, b) => new Date(b.payment_date!).getTime() - new Date(a.payment_date!).getTime())
        .slice(0, 10);

      return {
        totalRevenue: currentMonthRevenue,
        revenueChange,
        collectionRate,
        outstandingBalance,
        avgDaysToPay,
        revenueByMonth,
        paymentStatus,
        propertyPerformance,
        recentPayments,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return {
    totalRevenue: data?.totalRevenue || 0,
    revenueChange: data?.revenueChange || 0,
    collectionRate: data?.collectionRate || 0,
    outstandingBalance: data?.outstandingBalance || 0,
    avgDaysToPay: data?.avgDaysToPay || 0,
    revenueByMonth: data?.revenueByMonth || [],
    paymentStatus: data?.paymentStatus || [],
    propertyPerformance: data?.propertyPerformance || [],
    recentPayments: data?.recentPayments || [],
    isLoading,
  };
}
