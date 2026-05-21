
"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Save, Loader2, Sparkles, Briefcase, Zap } from 'lucide-react'
import { useUser, useFirestore, useDoc } from '@/firebase'
import { doc, setDoc } from 'firebase/firestore'
import { collections } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'

export default function CareerPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [mounted, setMounted] = useState(false)
  const [saving, setSaving] = useState(false)

  const profileRef = user ? doc(db, collections.PROFILES, user.uid) : null
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleAutoSave = useCallback(async (field: string, value: string) => {
    if (!user || !db || profile?.currentJob?.[field] === value) return

    setSaving(true)
    const currentJob = { ...profile?.currentJob, [field]: value }
    try {
      await setDoc(doc(db, collections.PROFILES, user.uid), { currentJob }, { merge: true })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    } finally {
      setSaving(false)
    }
  }, [user, db, profile])

  if (!mounted || profileLoading) {
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
          <p className="text-muted-foreground">Managing your current professional role details.</p>
        </div>
        {saving && (
          <div className="flex items-center gap-2 text-xs text-primary animate-pulse">
            <Zap className="h-3 w-3 fill-primary" />
            Auto-saving...
          </div>
        )}
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
                    defaultValue={profile?.currentJob?.title || ''} 
                    onBlur={(e) => handleAutoSave('title', e.target.value)}
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
                    defaultValue={profile?.currentJob?.company || ''} 
                    onBlur={(e) => handleAutoSave('company', e.target.value)}
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
                  defaultValue={profile?.currentJob?.startDate || ''} 
                  onBlur={(e) => handleAutoSave('startDate', e.target.value)}
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
                Data entered here is saved the moment you move to another field. Your information is never lost.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </CRMLayout>
  )
}
