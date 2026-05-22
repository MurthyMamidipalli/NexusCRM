
"use client"

import React, { useMemo } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Building2, Briefcase, Loader2, Save } from 'lucide-react'
import { useUser, useFirestore, useDoc } from '@/firebase'
import { doc } from 'firebase/firestore'
import { collections } from '@/lib/firestore-service'
import { usePersistentDocument } from '@/hooks/use-persistence'

const EMPTY_CAREER = {};

export default function CareerPage() {
  const { user } = useUser()
  const db = useFirestore()

  const profileRef = useMemo(() => user ? doc(db, collections.PROFILES, user.uid) : null, [db, user])
  const { data: profileDoc, loading: profileLoading } = useDoc(profileRef)

  const initialData = useMemo(() => profileDoc || EMPTY_CAREER, [profileDoc]);

  // Use global persistence hook for the nested currentJob object
  const { data: profile, updateField, save } = usePersistentDocument(
    collections.PROFILES,
    user?.uid,
    initialData
  )

  const handleJobUpdate = (field: string, value: string) => {
    const currentJob = { ...((profile as any)?.currentJob || {}), [field]: value }
    updateField('currentJob' as any, currentJob)
  }

  if (profileLoading) {
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
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">🏢 Current Job</h1>
          <p className="text-muted-foreground">Managing your current professional role details with auto-save.</p>
        </div>
        <Button onClick={save} className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <div className="max-w-4xl">
        <Card className="border-none bg-card/50 backdrop-blur-md shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Employment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="title" 
                  value={(profile as any)?.currentJob?.title || ''} 
                  onChange={(e) => handleJobUpdate('title', e.target.value)}
                  className="pl-10" 
                  placeholder="Principal Engineer" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="company" 
                  value={(profile as any)?.currentJob?.company || ''} 
                  onChange={(e) => handleJobUpdate('company', e.target.value)}
                  className="pl-10" 
                  placeholder="Global Tech Systems" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input 
                id="startDate" 
                type="date" 
                value={(profile as any)?.currentJob?.startDate || ''} 
                onChange={(e) => handleJobUpdate('startDate', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </CRMLayout>
  )
}
