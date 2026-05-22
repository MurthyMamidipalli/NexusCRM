
"use client"

import React, { useMemo } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { User, Mail, Phone, MapPin, Loader2, CheckCircle2 } from 'lucide-react'
import { useUser, useFirestore, useDoc } from '@/firebase'
import { doc } from 'firebase/firestore'
import { collections } from '@/lib/firestore-service'
import { usePersistentDocument } from '@/hooks/use-persistence'

export default function ProfilePage() {
  const { user } = useUser()
  const db = useFirestore()

  const profileRef = useMemo(() => user ? doc(db, collections.PROFILES, user.uid) : null, [db, user])
  const { data: profileDoc, loading: profileLoading } = useDoc(profileRef)

  const { data: profile, updateField } = usePersistentDocument(
    collections.PROFILES,
    user?.uid,
    profileDoc || {}
  )

  if (profileLoading) {
    return (
      <CRMLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CRMLayout>
    )
  }

  return (
    <CRMLayout>
      <div className="mb-8">
        <h1 className="font-headline text-4xl font-bold tracking-tight">👤 Personal Profile</h1>
        <p className="text-muted-foreground">Changes are persistent across all your sessions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border-none bg-card/50 backdrop-blur-md shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-xl">General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="fullName" 
                      value={profile?.fullName || ''} 
                      onChange={(e) => updateField('fullName', e.target.value)}
                      className="pl-10 focus:ring-primary" 
                      placeholder="John Doe" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Public Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      value={profile?.email || ''} 
                      onChange={(e) => updateField('email', e.target.value)}
                      className="pl-10 focus:ring-primary" 
                      placeholder="john@example.com" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">Professional Tagline</Label>
                <Input 
                  id="tagline" 
                  value={profile?.tagline || ''} 
                  onChange={(e) => updateField('tagline', e.target.value)}
                  placeholder="Enterprise Sales Strategist | Growth Specialist" 
                  className="focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea 
                  id="bio" 
                  className="min-h-[150px] focus:ring-primary" 
                  value={profile?.bio || ''} 
                  onChange={(e) => updateField('bio', e.target.value)}
                  placeholder="Tell your story..." 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="phone" 
                      value={profile?.phone || ''} 
                      onChange={(e) => updateField('phone', e.target.value)}
                      className="pl-10 focus:ring-primary" 
                      placeholder="+1 (555) 000-0000" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="location" 
                      value={profile?.location || ''} 
                      onChange={(e) => updateField('location', e.target.value)}
                      className="pl-10 focus:ring-primary" 
                      placeholder="London, UK" 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none bg-primary shadow-2xl text-primary-foreground relative overflow-hidden">
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" /> 
                Persistent Storage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm opacity-90 leading-relaxed">
                Your data is stored in the cloud with local-first persistence. It remains available even after refreshes, system restarts, or logout/login cycles.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none bg-accent text-white shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Profile Strength</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">Completeness</span>
                <span className="text-sm font-bold">85%</span>
              </div>
              <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white w-[85%]" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CRMLayout>
  )
}
