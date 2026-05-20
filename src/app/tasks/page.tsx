
import React from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { NextAction } from '@/components/gen-ai/next-action'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Plus, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const dummyTasks = [
  { id: '1', task: 'Follow up on proposal', lead: 'Robert Fox', due: 'Today, 2:00 PM', priority: 'High' },
  { id: '2', task: 'Send quarterly pricing', lead: 'Jane Cooper', due: 'Tomorrow, 10:00 AM', priority: 'Medium' },
  { id: '3', task: 'Review contract terms', lead: 'Wade Warren', due: 'Oct 15, 4:30 PM', priority: 'Low' },
  { id: '4', task: 'Onboarding call', lead: 'Eleanor Pena', due: 'Oct 18, 11:00 AM', priority: 'High' },
]

export default function TasksPage() {
  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">Task Command</h1>
          <p className="text-muted-foreground">Orchestrate your daily activities and strategic follow-ups.</p>
        </div>
        <Button className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" />
          Create Task
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none bg-card/50 backdrop-blur-md shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="font-headline text-xl">Today's Missions</CardTitle>
              <Button variant="ghost" size="sm" className="text-primary font-bold">View Calendar</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dummyTasks.map((task) => (
                  <div key={task.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-border/50">
                    <div className="flex items-center gap-4">
                      <Checkbox className="h-5 w-5 rounded-md" />
                      <div>
                        <p className="text-sm font-semibold group-hover:text-primary transition-colors">{task.task}</p>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                          <span className="font-bold text-foreground/70 uppercase tracking-tighter">{task.lead}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {task.due}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn(
                      "text-[10px] uppercase tracking-tighter px-2 h-6",
                      task.priority === 'High' ? "border-red-500/20 text-red-500 bg-red-500/5" : 
                      task.priority === 'Medium' ? "border-yellow-500/20 text-yellow-500 bg-yellow-500/5" : 
                      "border-green-500/20 text-green-500 bg-green-500/5"
                    )}>
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-card/50 backdrop-blur-md shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Interaction Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border/50 text-muted-foreground italic">
                <Calendar className="mr-2 h-4 w-4" />
                Select a lead to view communication history
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <NextAction 
            leadId="lead-101" 
            leadName="Robert Fox" 
            company="Fox Designs" 
            status="Qualified" 
            historySummary="Sent initial proposal yesterday. Robert expressed interest in the enterprise tier but was concerned about integration timelines. No response yet to the email follow-up."
          />
          
          <Card className="border-none bg-primary shadow-2xl text-primary-foreground">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Nexus Pro Tip</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm opacity-90 leading-relaxed">
                Leads contacted within 5 minutes of inquiry are 100x more likely to convert. Use the automated WhatsApp reminders to stay ahead.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </CRMLayout>
  )
}
