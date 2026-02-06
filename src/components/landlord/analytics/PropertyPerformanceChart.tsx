import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface PropertyPerformanceChartProps {
  data: { name: string; revenue: number; expected: number; collectionRate: number }[];
  isLoading?: boolean;
}

export function PropertyPerformanceChart({ data, isLoading }: PropertyPerformanceChartProps) {
  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Property Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }} 
                  stroke="hsl(var(--muted-foreground))"
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `KES ${value.toLocaleString()}`,
                    name === "revenue" ? "Collected" : "Expected"
                  ]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Collected" />
                <Bar dataKey="expected" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} name="Expected" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No property data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
