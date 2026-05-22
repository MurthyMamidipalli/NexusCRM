"use client"

import React, { useMemo, useRef, useEffect, useState } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { User, Mail, Phone, Loader2, Save, Camera, Upload, Trash2, Fingerprint } from 'lucide-react'
import { useUser, useFirestore, useDoc } from '@/firebase'
import { doc } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { collections } from '@/lib/firestore-service'
import { usePersistentDocument } from '@/hooks/use-persistence'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/hooks/use-toast'

const EMPTY_PROFILE = {};

export default function ProfilePage() {
  const { user } = useUser()
  const db = useFirestore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSaving, setIsSaving] = useState(false)

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

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast({ variant: 'destructive', title: 'Invalid Format', description: 'Please upload a PNG or JPG image.' });
      return;
    }

    const maxSize = 2 * 1024 * 1024; // Standard 2MB limit for avatars
    if (file.size > maxSize) {
      toast({ variant: 'destructive', title: 'File Too Large', description: 'Maximum allowed size is 2MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onloadstart = () => { toast({ title: 'Processing Image', description: 'Preparing your new profile picture...' }); };
    reader.onloadend = () => {
      updateField('avatarUrl' as any, reader.result as string);
      toast({ title: 'Image Uploaded', description: 'Your profile picture has been updated.' });
    };
    reader.readAsDataURL(file);
  }

  const removeAvatar = () => {
    updateField('avatarUrl' as any, '');
    toast({ title: 'Avatar Removed' });
  }

  const handleFullProfileSave = async () => {
    setIsSaving(true)
    try {
      save()

      if (user && (profile as any)?.fullName) {
        await updateProfile(user, {
          displayName: (profile as any).fullName
        })
      }

      toast({
        title: 'Profile Synchronized',
        description: 'Your changes have been saved to your account and profile.'
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: error.message
      })
    } finally {
      setIsSaving(false)
    }
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

  const displayFirstName = (profile as any)?.firstName || '';
  const displayLastName = (profile as any)?.lastName || '';
  const displayHeaderName = (profile as any)?.fullName || 
    (displayFirstName || displayLastName 
      ? `${displayFirstName} ${displayLastName}`.trim()
      : user?.displayName || 'Set your name');

  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">👤 Personal Profile</h1>
          <p className="text-muted-foreground">Manage your core identity, contact details, and professional appearance.</p>
        </div>
        <Button 
          onClick={handleFullProfileSave} 
          disabled={isSaving}
          className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white min-w-[140px]"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <div className="max-w-4xl space-y-8 pb-20">
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
                <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={handleImageUpload} />
              </div>
              <div className="flex-1 space-y-1 mb-2">
                <h2 className="text-2xl font-bold font-headline">{displayHeaderName}</h2>
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

        <Card className="border-none bg-card/50 backdrop-blur-md shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-primary" /> Identity & Naming
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name / Display Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="fullName" 
                  value={(profile as any)?.fullName || ''} 
                  onChange={(e) => updateField('fullName', e.target.value)} 
                  className="pl-10 focus:ring-primary h-12 text-lg font-bold" 
                  placeholder="e.g. Johnathan Doe" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={(profile as any)?.firstName || ''} onChange={(e) => updateField('firstName', e.target.value)} className="focus:ring-primary" placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={(profile as any)?.lastName || ''} onChange={(e) => updateField('lastName', e.target.value)} className="focus:ring-primary" placeholder="Doe" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">Professional Tagline</Label>
              <Input id="tagline" value={(profile as any)?.tagline || ''} onChange={(e) => updateField('tagline', e.target.value)} placeholder="Software Engineer | AI Specialist" className="focus:ring-primary" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Professional Bio</Label>
              <Textarea id="bio" className="min-h-[120px] focus:ring-primary" value={(profile as any)?.bio || ''} onChange={(e) => updateField('bio', e.target.value)} placeholder="Brief summary of your professional background..." />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-card/50 backdrop-blur-md shadow-xl">
          <CardHeader><CardTitle className="font-headline text-xl">Contact Information</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email">Primary Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" value={(profile as any)?.email || ''} onChange={(e) => updateField('email', e.target.value)} className="pl-10 focus:ring-primary" placeholder="primary@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryEmail">Secondary Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="secondaryEmail" type="email" value={(profile as any)?.secondaryEmail || ''} onChange={(e) => updateField('secondaryEmail', e.target.value)} className="pl-10 focus:ring-primary" placeholder="secondary@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Primary Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="phone" value={(profile as any)?.phone || ''} onChange={(e) => updateField('phone', e.target.value)} className="pl-10 focus:ring-primary" placeholder="+1 (555) 000-0000" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryPhone">Secondary Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="secondaryPhone" value={(profile as any)?.secondaryPhone || ''} onChange={(e) => updateField('secondaryPhone', e.target.value)} className="pl-10 focus:ring-primary" placeholder="+1 (555) 000-0000" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CRMLayout>
  )
}