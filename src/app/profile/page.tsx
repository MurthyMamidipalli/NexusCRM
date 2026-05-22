
"use client"

import React, { useMemo, useRef } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { User, Mail, Phone, MapPin, Loader2, Calendar, Home, Save, Camera, Upload, Trash2 } from 'lucide-react'
import { useUser, useFirestore, useDoc } from '@/firebase'
import { doc } from 'firebase/firestore'
import { collections } from '@/lib/firestore-service'
import { usePersistentDocument } from '@/hooks/use-persistence'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/hooks/use-toast'

const EMPTY_PROFILE = {};

export default function ProfilePage() {
  const { user } = useUser()
  const db = useFirestore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const profileRef = useMemo(() => user ? doc(db, collections.PROFILES, user.uid) : null, [db, user])
  const { data: profileDoc, loading: profileLoading } = useDoc(profileRef)

  const initialData = useMemo(() => profileDoc || EMPTY_PROFILE, [profileDoc]);

  const { data: profile, updateField, save } = usePersistentDocument(
    collections.PROFILES,
    user?.uid,
    initialData
  )

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Format',
        description: 'Please upload a PNG or JPG image.'
      });
      return;
    }

    // Check file size (500MB = 500 * 1024 * 1024 bytes)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: 'Maximum allowed size is 500MB.'
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadstart = () => {
      toast({ title: 'Processing Image', description: 'Preparing your new profile picture...' });
    };
    reader.onloadend = () => {
      updateField('avatarUrl' as any, reader.result as string);
      toast({ title: 'Image Uploaded', description: 'Your profile picture has been updated locally and will sync shortly.' });
    };
    reader.onerror = () => {
      toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not process the image file.' });
    };
    reader.readAsDataURL(file);
  }

  const removeAvatar = () => {
    updateField('avatarUrl' as any, '');
    toast({ title: 'Avatar Removed' });
  }

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
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">👤 Personal Profile</h1>
          <p className="text-muted-foreground">Manage your core identity, contact details, and demographics.</p>
        </div>
        <Button onClick={save} className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white">
          <Save className="h-4 w-4" />
          Save Profile
        </Button>
      </div>

      <div className="max-w-4xl space-y-8 pb-20">
        {/* Profile Identity Header */}
        <Card className="border-none bg-card/50 backdrop-blur-md shadow-xl overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20" />
          <CardContent className="relative pt-0 px-8 pb-8">
            <div className="flex flex-col md:flex-row items-end gap-6 -mt-12">
              <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-background shadow-2xl">
                  <AvatarImage src={(profile as any)?.avatarUrl || `https://picsum.photos/seed/${user?.uid}/128/128`} />
                  <AvatarFallback className="bg-muted text-4xl">
                    <User className="h-12 w-12 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <Camera className="h-8 w-8 text-white" />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/png, image/jpeg, image/jpg" 
                  onChange={handleImageUpload}
                />
              </div>
              <div className="flex-1 space-y-1 mb-2">
                <h2 className="text-2xl font-bold font-headline">{(profile as any)?.fullName || user?.displayName || 'Set your name'}</h2>
                <p className="text-muted-foreground font-medium">{(profile as any)?.tagline || 'Your professional headline'}</p>
                <div className="flex items-center gap-2 pt-2">
                  <Button size="sm" variant="outline" className="h-8 text-[11px] gap-1.5" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-3 w-3" /> Change Photo
                  </Button>
                  {(profile as any)?.avatarUrl && (
                    <Button size="sm" variant="ghost" className="h-8 text-[11px] gap-1.5 text-destructive hover:bg-destructive/10" onClick={removeAvatar}>
                      <Trash2 className="h-3 w-3" /> Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  <SelectTrigger id="gender" className="focus:ring-primary text-foreground">
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
