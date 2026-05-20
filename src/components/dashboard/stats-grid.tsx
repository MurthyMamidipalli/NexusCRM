
"use client"

import React, { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, Users, Target, Activity, DollarSign, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFirestore, useCollection } from '@/firebase'
import { collection } from 'firebase/firestore'
import { collections } from '@/lib/firestore-service'

export function StatsGrid() {
  const db = useFirestore()
  
  const { data: leads, loading: leadsLoading } = useCollection(collection(db, collections.LEADS))
  const { data: customers, loading: customersLoading } = useCollection(collection(db, collections.CUSTOMERS))
  const { data: deals, loading: dealsLoading } = useCollection(collection(db, collections.DEALS))

  const stats = useMemo(() => {
    const totalRevenue = leads?.reduce((acc, lead: any) => acc + (lead.value || 0), 0) || 0;
    
    return [
      { 
        label: 'Total Leads', 
        value: leads?.length.toLocaleString() || '0', 
        change: '+12%', 
        icon: Target, 
        trend: 'up',
        loading: leadsLoading 
      },
      { 
        label: 'Customers', 
        value: customers?.length.toLocaleString() || '0', 
        change: '+5%', 
        icon: Users, 
        trend: 'up',
        loading: customersLoading 
      },
      { 
        label: 'Active Deals', 
        value: deals?.length.toLocaleString() || '0', 
        change: '-2%', 
        icon: Activity, 
        trend: 'down',
        loading: dealsLoading 
      },
      { 
        label: 'Potential Pipeline', 
        value: `$${totalRevenue.toLocaleString()}`, 
        change: '+18%', 
        icon: DollarSign, 
        trend: 'up',
        loading: leadsLoading 
      },
    ]
  }, [leads, customers, deals, leadsLoading, customersLoading, dealsLoading])

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
                {stat.loading ? (
                  <Loader2 className="mt-2 h-8 w-8 animate-spin text-primary/20" />
                ) : (
                  <h3 className="mt-2 text-3xl font-bold tracking-tight text-foreground font-headline">
                    {stat.value}
                  </h3>
                )}
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
