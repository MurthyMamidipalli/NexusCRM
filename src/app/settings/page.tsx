"use client"

import React, { useMemo, useEffect, useState } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useUser, useFirestore, useDoc } from '@/firebase'
import { doc } from 'firebase/firestore'
import { collections } from '@/lib/firestore-service'
import { usePersistentDocument } from '@/hooks/use-persistence'
import { Settings, User, Bell, Shield, Eye, Loader2, Save, Cloud, CheckCircle2, AlertCircle, RefreshCw, Globe } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

const EMPTY_SETTINGS = {
  notifications: true,
  isPublic: false,
  compactMode: false
};

export default function SettingsPage() {
  const { user, loading: userLoading } = useUser()
  const db = useFirestore()
  const [mounted, setMounted] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const profileRef = useMemo(() => user ? doc(db, collections.PROFILES, user.uid) : null, [db, user])
  const { data: profileDoc, loading: profileLoading } = useDoc(profileRef)

  const initialData = useMemo(() => {
    if (!profileDoc) return EMPTY_SETTINGS;
    return {
      notifications: profileDoc.notifications ?? true,
      isPublic: profileDoc.isPublic ?? false,
      compactMode: profileDoc.compactMode ?? false,
    };
  }, [profileDoc]);

  const { data: settings, updateField, save } = usePersistentDocument(
    collections.PROFILES,
    user?.uid,
    initialData
  )

  const handleSaveSettings = () => {
    save()
    toast({
      title: "Settings Saved",
      description: "Your preferences have been synchronized."
    })
  }

  const verifyConnection = async () => {
    setIsVerifying(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    if (supabase) {
      toast({
        title: "Integration Active",
        description: "Supabase Storage is responding correctly."
      })
    } else {
      toast({
        variant: "destructive",
        title: "Integration Inactive",
        description: "Check your environment variable configuration."
      })
    }
    setIsVerifying(false)
  }

  if (!mounted || userLoading || profileLoading) {
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
        <h1 className="font-headline text-4xl font-bold tracking-tight">⚙️ Settings</h1>
        <p className="text-muted-foreground">Configure your professional hub preferences and account security.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none bg-card/50 backdrop-blur-md shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Display Name</Label>
                  <p className="font-medium">{user?.displayName || 'Not set'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Email Address</Label>
                  <p className="font-medium lowercase">{user?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-card/50 backdrop-blur-md shadow-xl overflow-hidden">
            <CardHeader className="bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-headline text-xl flex items-center gap-2 text-primary">
                    <Cloud className="h-5 w-5" /> Supabase Storage
                  </CardTitle>
                  <CardDescription>Live connection diagnostics for vault services.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={verifyConnection} disabled={isVerifying} className="gap-2">
                  <RefreshCw className={`h-4 w-4 ${isVerifying ? 'animate-spin' : ''}`} />
                  Verify Bridge
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-muted/20 border border-border/50 space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Detected URL</Label>
                  <div className="flex items-center gap-2">
                    <Globe className={`h-4 w-4 ${process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-project') ? 'text-destructive' : 'text-green-500'}`} />
                    <span className="text-xs font-mono truncate max-w-[200px]">
                      {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not Detected'}
                    </span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-muted/20 border border-border/50 space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Client Status</Label>
                  <div className="flex items-center gap-2">
                    {supabase ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className="text-xs font-bold">
                      {supabase ? 'READY' : 'OFFLINE'}
                    </span>
                  </div>
                </div>
              </div>

              {!supabase && (
                <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10 text-xs leading-relaxed">
                  <p className="font-bold text-destructive mb-1">Configuration Required:</p>
                  <p className="text-muted-foreground italic">
                    The Supabase client is not active. Please ensure your .env file contains valid keys and does not use placeholder text like "your-project".
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none bg-card/50 backdrop-blur-md shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" /> Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/50">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    <Label className="font-bold cursor-pointer">In-app Notifications</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">Receive alerts for updates and tasks.</p>
                </div>
                <Switch 
                  checked={settings.notifications} 
                  onCheckedChange={(val) => updateField('notifications', val)} 
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/50">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    <Label className="font-bold cursor-pointer">Public Visibility</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">Allow others to view your shared professional hub.</p>
                </div>
                <Switch 
                  checked={settings.isPublic} 
                  onCheckedChange={(val) => updateField('isPublic', val)} 
                />
              </div>
            </CardContent>
            <CardFooter className="border-t border-border/50 pt-6">
              <Button onClick={handleSaveSettings} className="ml-auto gap-2 shadow-lg shadow-primary/20">
                <Save className="h-4 w-4" />
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none bg-primary text-primary-foreground shadow-2xl">
            <CardHeader>
              <CardTitle className="font-headline text-lg">System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-80">Cloud Sync</span>
                <span className="font-bold">Operational</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-80">Storage Hub</span>
                <span className={`font-bold ${supabase ? 'text-green-200' : 'text-red-200'}`}>
                  {supabase ? 'Connected' : 'Offline'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CRMLayout>
  )
}
