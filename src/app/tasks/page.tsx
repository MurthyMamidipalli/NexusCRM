
"use client"

import React, { useMemo } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { NextAction } from '@/components/gen-ai/next-action'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Plus, Clock, Loader2, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import { collections, updateRecord } from '@/lib/firestore-service'

export default function TasksPage() {
  const db = useFirestore()
  const { user } = useUser()

  const tasksQuery = useMemo(() => {
    if (!db || !user) return null
    return query(
      collection(db, collections.TASKS), 
      where('ownerId', '==', user.uid)
    )
  }, [db, user])

  const { data: rawTasks, loading } = useCollection(tasksQuery)

  // In-memory sorting for index resilience
  const tasks = useMemo(() => {
    if (!rawTasks) return []
    return [...rawTasks].sort((a: any, b: any) => {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      return dateA - dateB;
    })
  }, [rawTasks])

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed'
    await updateRecord(db, collections.TASKS, taskId, { status: newStatus })
  }

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
              {loading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : tasks && tasks.length > 0 ? (
                <div className="space-y-4">
                  {tasks.map((task: any) => (
                    <div key={task.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-border/50">
                      <div className="flex items-center gap-4">
                        <Checkbox 
                          checked={task.status === 'Completed'} 
                          onCheckedChange={() => handleToggleTask(task.id, task.status)}
                          className="h-5 w-5 rounded-md" 
                        />
                        <div className={cn(task.status === 'Completed' && "opacity-50")}>
                          <p className={cn("text-sm font-semibold group-hover:text-primary transition-colors", task.status === 'Completed' && "line-through")}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                            <span className="font-bold text-foreground/70 uppercase tracking-tighter">{task.leadName || 'General'}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No due date'}
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
              ) : (
                <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-border/50 text-muted-foreground italic">
                  <ClipboardList className="mb-2 h-6 w-6 opacity-20" />
                  No tasks assigned. You're all caught up!
                </div>
              )}
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
            leadId="lead-demo" 
            leadName="Strategic Prospect" 
            company="Global Industries" 
            status="Qualified" 
            historySummary="Ongoing negotiation for enterprise licenses. Customer requested a customized integration roadmap."
          />
          
          <Card className="border-none bg-primary shadow-2xl text-primary-foreground">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Nexus Pro Tip</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm opacity-90 leading-relaxed">
                Leads contacted within 5 minutes of inquiry are 100x more likely to convert. Use automated alerts to stay ahead of the curve.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </CRMLayout>
  )
}
