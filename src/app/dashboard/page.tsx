import React from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { StatsGrid } from '@/components/dashboard/stats-grid'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { Button } from '@/components/ui/button'
import { Plus, Download } from 'lucide-react'

export default function DashboardPage() {
  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">Executive Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Sales Commander. Here's your pulse for today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 border-border/50 bg-card hover:bg-muted">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Button className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" />
            New Lead
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        <StatsGrid />
        
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <RevenueChart />
          <RecentActivity />
        </div>
      </div>
    </CRMLayout>
  )
}