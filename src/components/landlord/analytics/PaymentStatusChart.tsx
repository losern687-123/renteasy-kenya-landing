import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface PaymentStatusChartProps {
  data: { status: string; count: number; amount: number }[];
  isLoading?: boolean;
}

const COLORS = {
  Paid: "hsl(142 76% 36%)",
  Pending: "hsl(45 93% 47%)",
  Overdue: "hsl(0 72% 50%)",
};

export function PaymentStatusChart({ data, isLoading }: PaymentStatusChartProps) {
  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const filteredData = data.filter(d => d.count > 0);

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Payment Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          {filteredData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filteredData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="status"
                  label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {filteredData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.status as keyof typeof COLORS] || "hsl(var(--muted))"} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => [
                    `${value} payments (KES ${props.payload.amount.toLocaleString()})`,
                    name
                  ]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No payment data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
