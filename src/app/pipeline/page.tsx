"use client"

import React from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, MoreVertical, DollarSign, Calendar } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const pipelineStages = [
  { id: 'stage-1', title: 'Qualification', deals: [
    { id: 'deal-1', title: 'Enterprise Software', company: 'TechFlow', value: '$12,500', priority: 'High', date: 'Oct 12' },
    { id: 'deal-2', title: 'Consulting Services', company: 'Global Solutions', value: '$8,000', priority: 'Medium', date: 'Oct 15' },
  ]},
  { id: 'stage-2', title: 'Meeting Scheduled', deals: [
    { id: 'deal-3', title: 'Cloud Migration', company: 'Nova Corp', value: '$25,000', priority: 'High', date: 'Oct 18' },
  ]},
  { id: 'stage-3', title: 'Proposal Sent', deals: [
    { id: 'deal-4', title: 'Security Audit', company: 'SafeNet', value: '$5,000', priority: 'Low', date: 'Oct 20' },
    { id: 'deal-5', title: 'API Integration', company: 'ConnectHub', value: '$15,000', priority: 'Medium', date: 'Oct 22' },
  ]},
  { id: 'stage-4', title: 'Negotiation', deals: [
    { id: 'deal-6', title: 'Digital Transformation', company: 'OldWorld Ltd', value: '$45,000', priority: 'High', date: 'Oct 25' },
  ]},
  { id: 'stage-5', title: 'Closing', deals: [] },
]

export default function PipelinePage() {
  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">Sales Pipeline</h1>
          <p className="text-muted-foreground">Monitor deal flow and prioritize high-value opportunities.</p>
        </div>
        <Button className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" />
          Create Deal
        </Button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
        {pipelineStages.map((stage) => (
          <div key={stage.id} className="flex min-w-[300px] flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <h3 className="font-headline text-sm font-bold uppercase tracking-widest text-muted-foreground">{stage.title}</h3>
                <Badge variant="secondary" className="bg-muted text-muted-foreground">{stage.deals.length}</Badge>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-1 flex-col gap-4 rounded-xl bg-muted/30 p-2 min-h-[600px] border border-border/50 border-dashed">
              {stage.deals.map((deal) => (
                <Card key={deal.id} className="cursor-grab border-none bg-card shadow-md transition-all hover:scale-[1.02] hover:shadow-xl active:scale-95 active:cursor-grabbing">
                  <CardHeader className="p-4 pb-2 space-y-1">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-semibold text-primary">{deal.company}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                    <CardTitle className="text-sm font-bold font-body">{deal.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1.5 text-foreground font-semibold">
                        <DollarSign className="h-3.5 w-3.5 text-accent" />
                        <span className="text-sm">{deal.value}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span className="text-[10px] uppercase font-bold tracking-tighter">{deal.date}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={`https://picsum.photos/seed/${deal.id}/24/24`} />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <Badge className={cn(
                        "text-[10px] h-5 px-1.5",
                        deal.priority === 'High' ? "bg-red-500/10 text-red-500 border-red-500/20" : 
                        deal.priority === 'Medium' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" : 
                        "bg-green-500/10 text-green-500 border-green-500/20"
                      )} variant="outline">
                        {deal.priority}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {stage.deals.length === 0 && (
                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border/50">
                  <span className="text-xs text-muted-foreground italic">No active deals</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </CRMLayout>
  )
}