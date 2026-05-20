"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { month: "Jan", revenue: 15000, leads: 120 },
  { month: "Feb", revenue: 18000, leads: 145 },
  { month: "Mar", revenue: 16000, leads: 130 },
  { month: "Apr", revenue: 21000, leads: 180 },
  { month: "May", revenue: 25000, leads: 210 },
  { month: "Jun", revenue: 28000, leads: 240 },
  { month: "Jul", revenue: 32000, leads: 280 },
]

export function RevenueChart() {
  return (
    <Card className="col-span-1 border-none bg-card/50 backdrop-blur-md shadow-xl lg:col-span-2">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Growth Pulse</CardTitle>
        <CardDescription>Visualizing revenue and lead acquisition trends over time.</CardDescription>
      </CardHeader>
      <CardContent className="h-[350px] w-full pt-4">
        <ChartContainer config={{
          revenue: { label: "Revenue", color: "hsl(var(--primary))" },
          leads: { label: "Leads", color: "hsl(var(--accent))" }
        }} className="h-full w-full">
          <LineChart data={data}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(value) => `$${value/1000}k`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="var(--color-revenue)" 
              strokeWidth={3} 
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Line 
              type="monotone" 
              dataKey="leads" 
              stroke="var(--color-leads)" 
              strokeWidth={3} 
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}