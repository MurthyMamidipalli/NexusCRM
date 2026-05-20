import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, Users, Target, Activity, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

const stats = [
  { label: 'Total Leads', value: '1,284', change: '+12.5%', icon: Target, trend: 'up' },
  { label: 'Customers', value: '452', change: '+5.2%', icon: Users, trend: 'up' },
  { label: 'Active Deals', value: '84', change: '-2.1%', icon: Activity, trend: 'down' },
  { label: 'Total Revenue', value: '$245,600', change: '+18.4%', icon: DollarSign, trend: 'up' },
]

export function StatsGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="overflow-hidden border-none bg-card/50 backdrop-blur-md shadow-lg transition-transform hover:scale-[1.02]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </p>
                <h3 className="mt-2 text-3xl font-bold tracking-tight text-foreground font-headline">
                  {stat.value}
                </h3>
              </div>
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                stat.trend === 'up' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
              )}>
                {stat.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                {stat.change}
              </span>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}