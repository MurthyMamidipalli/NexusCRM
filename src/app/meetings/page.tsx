
"use client"

import React, { useMemo, useState } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Button } from '@/components/ui/button'
import { Plus, Calendar as CalendarIcon, Clock, Users, MapPin, Loader2, MoreVertical, MessageSquare } from 'lucide-react'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, orderBy, where } from 'firebase/firestore'
import { collections } from '@/lib/firestore-service'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AddMeetingDialog } from '@/components/meetings/add-meeting-dialog'
import { format } from 'date-fns'

export default function MeetingsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const db = useFirestore()
  const { user } = useUser()

  const meetingsQuery = useMemo(() => {
    if (!db || !user) return null
    return query(
      collection(db, collections.MEETINGS),
      where('ownerId', '==', user.uid),
      orderBy('date', 'asc')
    )
  }, [db, user])

  const { data: meetings, loading } = useCollection(meetingsQuery)

  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">Meeting Room</h1>
          <p className="text-muted-foreground">Coordinate strategic discussions and sync with your team.</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" />
          Schedule Meeting
        </Button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : meetings && meetings.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {meetings.map((meeting: any) => (
            <Card key={meeting.id} className="border-none bg-card/50 backdrop-blur-md shadow-md hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary min-w-[80px]">
                      <span className="text-[10px] uppercase font-bold tracking-tighter">
                        {meeting.date ? format(new Date(meeting.date), 'MMM') : 'OCT'}
                      </span>
                      <span className="text-2xl font-bold leading-none">
                        {meeting.date ? format(new Date(meeting.date), 'dd') : '12'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold font-headline">{meeting.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {meeting.time || '10:00 AM'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          {meeting.attendees?.length || 0} Attendees
                        </span>
                        {meeting.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {meeting.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 uppercase text-[10px]">
                      {meeting.type || 'Sync'}
                    </Badge>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
                
                {meeting.notes && (
                  <div className="mt-4 pt-4 border-t border-border/50 flex items-start gap-2 text-sm text-muted-foreground italic">
                    <MessageSquare className="h-4 w-4 mt-0.5 opacity-50" />
                    <p>{meeting.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/30">
          <CalendarIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No meetings scheduled. Stay proactive and book your first one!</p>
        </div>
      )}

      <AddMeetingDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </CRMLayout>
  )
}
