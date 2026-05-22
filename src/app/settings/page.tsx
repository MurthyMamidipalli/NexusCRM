
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
import { Settings, User, Bell, Shield, Eye, Loader2, Save } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

const EMPTY_SETTINGS = {
  notifications: true,
  publicProfile: false,
  compactMode: false
};

export default function SettingsPage() {
  const { user, loading: userLoading } = useUser()
  const db = useFirestore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const profileRef = useMemo(() => user ? doc(db, collections.PROFILES, user.uid) : null, [db, user])
  const { data: profileDoc, loading: profileLoading } = useDoc(profileRef)

  const initialData = useMemo(() => {
    if (!profileDoc) return EMPTY_SETTINGS;
    return {
      notifications: profileDoc.notifications ?? true,
      publicProfile: profileDoc.publicProfile ?? false,
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
      description: "Your preferences have been synchronized to the cloud."
    })
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
          {/* Account Section */}
          <Card className="border-none bg-card/50 backdrop-blur-md shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Account Information
              </CardTitle>
              <CardDescription>Managed via Firebase Authentication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Display Name</Label>
                  <p className="font-medium">{user?.displayName || 'Not set'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Email Address</Label>
                  <p className="font-medium">{user?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences Section */}
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
                  <p className="text-xs text-muted-foreground">Receive alerts for deal updates and tasks.</p>
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
                  <p className="text-xs text-muted-foreground">Allow others to view your shared professional data.</p>
                </div>
                <Switch 
                  checked={settings.publicProfile} 
                  onCheckedChange={(val) => updateField('publicProfile', val)} 
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/50">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <Label className="font-bold cursor-pointer">Compact Dashboard</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">Streamline the UI for high-density data viewing.</p>
                </div>
                <Switch 
                  checked={settings.compactMode} 
                  onCheckedChange={(val) => updateField('compactMode', val)} 
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
                <span className="opacity-80">Version</span>
                <span className="font-mono">v1.2.4-stable</span>
              </div>
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs opacity-70 leading-relaxed italic">
                  NexusCRM uses end-to-end encryption for all private documents and contact intelligence.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CRMLayout>
  )
}
