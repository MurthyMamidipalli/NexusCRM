
"use client"

import React, { useMemo } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Building2, Briefcase, Loader2, Sparkles } from 'lucide-react'
import { useUser, useFirestore, useDoc } from '@/firebase'
import { doc } from 'firebase/firestore'
import { collections } from '@/lib/firestore-service'
import { usePersistentDocument } from '@/hooks/use-persistence'

export default function CareerPage() {
  const { user } = useUser()
  const db = useFirestore()

  const profileRef = useMemo(() => user ? doc(db, collections.PROFILES, user.uid) : null, [db, user])
  const { data: profileDoc, loading: profileLoading } = useDoc(profileRef)

  // Use global persistence hook for the nested currentJob object
  const { data: profile, updateField } = usePersistentDocument(
    collections.PROFILES,
    user?.uid,
    profileDoc || {}
  )

  const handleJobUpdate = (field: string, value: string) => {
    const currentJob = { ...(profile?.currentJob || {}), [field]: value }
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">🏢 Current Job</h1>
          <p className="text-muted-foreground">Managing your current professional role details with auto-save.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
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
                    value={profile?.currentJob?.title || ''} 
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
                    value={profile?.currentJob?.company || ''} 
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
                  value={profile?.currentJob?.startDate || ''} 
                  onChange={(e) => handleJobUpdate('startDate', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-accent/20 bg-accent text-white shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5" /> Persistence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm opacity-90 leading-relaxed">
                Changes here are captured instantly and synced to your professional vault. Never lose a detail.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </CRMLayout>
  )
}
