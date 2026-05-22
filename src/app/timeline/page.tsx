
"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Milestone, Briefcase, GraduationCap, Trophy, Rocket, Loader2 } from 'lucide-react'
import { useFirestore, useCollection } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'
import { collections } from '@/lib/firestore-service'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export default function TimelinePage() {
  const db = useFirestore()
  const [mounted, setMounted] = useState(false)

  const expQuery = useMemo(() => query(collection(db, collections.EXPERIENCE), orderBy('startDate', 'desc')), [db])
  const eduQuery = useMemo(() => query(collection(db, collections.EDUCATION), orderBy('startDate', 'desc')), [db])
  
  const { data: experience, loading: expLoading } = useCollection(expQuery)
  const { data: education, loading: eduLoading } = useCollection(eduQuery)

  useEffect(() => {
    setMounted(true)
  }, [])

  const timelineItems = useMemo(() => {
    if (!experience && !education) return []
    
    const items = [
      ...(experience || []).map((e: any) => ({
        id: e.id,
        date: e.startDate,
        title: e.role,
        subtitle: e.company,
        type: 'experience',
        icon: Briefcase,
        color: 'text-primary'
      })),
      ...(education || []).map((e: any) => ({
        id: e.id,
        date: e.startDate,
        title: e.degree,
        subtitle: e.institution,
        type: 'education',
        icon: GraduationCap,
        color: 'text-accent'
      }))
    ]
    
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [experience, education])

  if (!mounted || expLoading || eduLoading) {
    return (
      <CRMLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CRMLayout>
    )
  }

  return (
    <CRMLayout>
      <div className="mb-8">
        <h1 className="font-headline text-4xl font-bold tracking-tight">📈 Career Timeline</h1>
        <p className="text-muted-foreground">A chronological visualization of your professional evolution.</p>
      </div>

      <div className="relative max-w-3xl mx-auto py-12">
        <div className="absolute left-9 top-0 bottom-0 w-0.5 bg-border/50" />
        
        {timelineItems.length > 0 ? (
          <div className="space-y-12">
            {timelineItems.map((item, idx) => (
              <div key={item.id} className="relative pl-24 group">
                <div className="absolute left-6 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-card border-2 border-primary z-10 group-hover:scale-110 transition-transform">
                  <item.icon className={cn("h-3.5 w-3.5", item.color)} />
                </div>
                
                <div className="absolute left-0 top-0 pt-1 text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">
                  {item.date ? format(new Date(item.date), 'MMM yyyy') : 'Date'}
                </div>
                
                <Card className="border-none bg-card/50 backdrop-blur-md shadow-md group-hover:shadow-xl transition-all">
                  <CardContent className="p-5">
                    <h3 className="font-headline font-bold text-lg">{item.title}</h3>
                    <p className="text-sm text-primary font-semibold">{item.subtitle}</p>
                    <p className="text-xs text-muted-foreground mt-2 opacity-80 uppercase tracking-widest font-bold">
                      {item.type}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/30">
            <Milestone className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Your timeline is empty. Add experience or education to see it grow.</p>
          </div>
        )}
      </div>
    </CRMLayout>
  )
}
