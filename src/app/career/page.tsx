
"use client"

import React, { useState, useEffect } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Save, Loader2, Sparkles, Briefcase } from 'lucide-react'
import { useUser, useFirestore, useDoc } from '@/firebase'
import { doc, setDoc } from 'firebase/firestore'
import { collections } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'

export default function CareerPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)

  const profileRef = user ? doc(db, collections.PROFILES, user.uid) : null
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      currentJob: {
        title: formData.get('title'),
        company: formData.get('company'),
        startDate: formData.get('startDate'),
      }
    }

    try {
      await setDoc(doc(db, collections.PROFILES, user.uid), data, { merge: true })
      toast({ title: 'Career Info Updated' })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    } finally {
      setLoading(false)
    }
  }

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
      <div className="mb-8">
        <h1 className="font-headline text-4xl font-bold tracking-tight">🏢 Current Job</h1>
        <p className="text-muted-foreground">Manage details about your current professional role.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border-none bg-card/50 backdrop-blur-md shadow-xl">
            <form onSubmit={handleSave}>
              <CardHeader>
                <CardTitle className="font-headline text-xl">Employment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="title" name="title" className="pl-10" defaultValue={profile?.currentJob?.title || ''} placeholder="Principal Engineer" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="company" name="company" className="pl-10" defaultValue={profile?.currentJob?.company || ''} placeholder="Global Tech Systems" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" name="startDate" type="date" defaultValue={profile?.currentJob?.startDate || ''} />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={loading} className="gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Job Details
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-accent/20 bg-accent text-white shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5" /> Career Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm opacity-90 leading-relaxed">
                Keeping your current role updated helps our intelligence engine provide better career move suggestions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </CRMLayout>
  )
}
