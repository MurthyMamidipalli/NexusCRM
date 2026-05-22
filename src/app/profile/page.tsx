
"use client"

import React, { useMemo } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, Mail, Phone, MapPin, Loader2, Calendar, Home } from 'lucide-react'
import { useUser, useFirestore, useDoc } from '@/firebase'
import { doc } from 'firebase/firestore'
import { collections } from '@/lib/firestore-service'
import { usePersistentDocument } from '@/hooks/use-persistence'

const EMPTY_PROFILE = {};

export default function ProfilePage() {
  const { user } = useUser()
  const db = useFirestore()

  const profileRef = useMemo(() => user ? doc(db, collections.PROFILES, user.uid) : null, [db, user])
  const { data: profileDoc, loading: profileLoading } = useDoc(profileRef)

  // Use a memoized initial data object to prevent re-render loops
  const initialData = useMemo(() => profileDoc || EMPTY_PROFILE, [profileDoc]);

  const { data: profile, updateField } = usePersistentDocument(
    collections.PROFILES,
    user?.uid,
    initialData
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
        <p className="text-muted-foreground">Manage your core identity, contact details, and demographics.</p>
      </div>

      <div className="max-w-4xl space-y-8">
        {/* Identity Section */}
        <Card className="border-none bg-card/50 backdrop-blur-md shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="fullName" 
                    value={(profile as any)?.fullName || ''} 
                    onChange={(e) => updateField('fullName', e.target.value)}
                    className="pl-10 focus:ring-primary" 
                    placeholder="John Doe" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">Professional Tagline</Label>
                <Input 
                  id="tagline" 
                  value={(profile as any)?.tagline || ''} 
                  onChange={(e) => updateField('tagline', e.target.value)}
                  placeholder="Software Engineer | AI Specialist" 
                  className="focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Professional Bio</Label>
              <Textarea 
                id="bio" 
                className="min-h-[120px] focus:ring-primary" 
                value={(profile as any)?.bio || ''} 
                onChange={(e) => updateField('bio', e.target.value)}
                placeholder="Brief summary of your professional background..." 
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Details Section */}
        <Card className="border-none bg-card/50 backdrop-blur-md shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email">Primary Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    value={(profile as any)?.email || ''} 
                    onChange={(e) => updateField('email', e.target.value)}
                    className="pl-10 focus:ring-primary" 
                    placeholder="primary@example.com" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryEmail">Secondary Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                  <Input 
                    id="secondaryEmail" 
                    type="email" 
                    value={(profile as any)?.secondaryEmail || ''} 
                    onChange={(e) => updateField('secondaryEmail', e.target.value)}
                    className="pl-10 focus:ring-primary" 
                    placeholder="secondary@example.com" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Primary Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="phone" 
                    value={(profile as any)?.phone || ''} 
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="pl-10 focus:ring-primary" 
                    placeholder="+1 (555) 000-0000" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryPhone">Secondary Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                  <Input 
                    id="secondaryPhone" 
                    value={(profile as any)?.secondaryPhone || ''} 
                    onChange={(e) => updateField('secondaryPhone', e.target.value)}
                    className="pl-10 focus:ring-primary" 
                    placeholder="+1 (555) 111-2222" 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demographics & Address Section */}
        <Card className="border-none bg-card/50 backdrop-blur-md shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Demographics & Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="age" 
                    type="number"
                    value={(profile as any)?.age || ''} 
                    onChange={(e) => updateField('age', e.target.value ? parseInt(e.target.value) : '')}
                    className="pl-10 focus:ring-primary" 
                    placeholder="25" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select 
                  value={(profile as any)?.gender || 'Prefer not to say'} 
                  onValueChange={(val) => updateField('gender', val)}
                >
                  <SelectTrigger id="gender" className="focus:ring-primary">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                    <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">City / State</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="location" 
                    value={(profile as any)?.location || ''} 
                    onChange={(e) => updateField('location', e.target.value)}
                    className="pl-10 focus:ring-primary" 
                    placeholder="San Francisco, CA" 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Full Address</Label>
              <div className="relative">
                <Home className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea 
                  id="address" 
                  className="pl-10 min-h-[80px] focus:ring-primary" 
                  value={(profile as any)?.address || ''} 
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="House No, Street, Landmark, Pincode..." 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CRMLayout>
  )
}
