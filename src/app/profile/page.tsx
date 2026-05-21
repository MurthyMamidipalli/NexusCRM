
"use client"

import React, { useState, useEffect } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { User, Mail, Phone, MapPin, Save, Loader2, Sparkles } from 'lucide-react'
import { useUser, useFirestore, useDoc } from '@/firebase'
import { doc, setDoc } from 'firebase/firestore'
import { collections } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'

export default function ProfilePage() {
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
      fullName: formData.get('fullName'),
      tagline: formData.get('tagline'),
      bio: formData.get('bio'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      location: formData.get('location'),
    }

    try {
      await setDoc(doc(db, collections.PROFILES, user.uid), data, { merge: true })
      toast({ title: 'Profile Updated', description: 'Your personal information has been saved.' })
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
        <h1 className="font-headline text-4xl font-bold tracking-tight">👤 Personal Profile</h1>
        <p className="text-muted-foreground">Define your professional identity and presence.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border-none bg-card/50 backdrop-blur-md shadow-xl">
            <form onSubmit={handleSave}>
              <CardHeader>
                <CardTitle className="font-headline text-xl">General Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="fullName" name="fullName" className="pl-10" defaultValue={profile?.fullName || ''} placeholder="John Doe" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Public Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="email" name="email" type="email" className="pl-10" defaultValue={profile?.email || user?.email || ''} placeholder="john@example.com" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagline">Professional Tagline</Label>
                  <Input id="tagline" name="tagline" defaultValue={profile?.tagline || ''} placeholder="Enterprise Sales Strategist | Growth Specialist" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea id="bio" name="bio" className="min-h-[150px]" defaultValue={profile?.bio || ''} placeholder="Tell your story..." />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="phone" name="phone" className="pl-10" defaultValue={profile?.phone || ''} placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="location" name="location" className="pl-10" defaultValue={profile?.location || ''} placeholder="London, UK" />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={loading} className="gap-2 shadow-lg shadow-primary/20">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Profile Changes
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary shadow-2xl text-primary-foreground relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <Sparkles className="h-12 w-12" />
            </div>
            <CardHeader>
              <CardTitle className="font-headline text-lg">AI Branding Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm opacity-90 leading-relaxed mb-4">
                Your profile tagline is good, but it could be more descriptive for executive search filters.
              </p>
              <Button variant="secondary" className="w-full text-primary font-bold">Optimize Bio</Button>
            </CardContent>
          </Card>

          <Card className="border-none bg-accent text-white shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Profile Completeness</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">Progress</span>
                <span className="text-sm font-bold">65%</span>
              </div>
              <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white w-[65%]" />
              </div>
              <p className="text-[10px] mt-4 opacity-80 italic">Add your Certifications and Experience to reach 100%.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </CRMLayout>
  )
}
