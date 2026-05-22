
"use client"

import React, { useMemo, useEffect, useState } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Globe, Copy, Share2, Loader2, Eye, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useUser, useFirestore, useDoc } from '@/firebase'
import { doc } from 'firebase/firestore'
import { collections } from '@/lib/firestore-service'
import { usePersistentDocument } from '@/hooks/use-persistence'
import { toast } from '@/hooks/use-toast'

const EMPTY_VISIBILITY = {
  isPublic: false
};

export default function PublicSharePage() {
  const { user, loading: userLoading } = useUser()
  const db = useFirestore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const profileRef = useMemo(() => user ? doc(db, collections.PROFILES, user.uid) : null, [db, user])
  const { data: profileDoc, loading: profileLoading } = useDoc(profileRef)

  const initialData = useMemo(() => ({
    isPublic: profileDoc?.isPublic ?? false
  }), [profileDoc]);

  const { data: settings, updateField, save } = usePersistentDocument(
    collections.PROFILES,
    user?.uid,
    initialData
  )

  const publicUrl = user ? `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${user.uid}` : ''

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicUrl)
    toast({ 
      title: 'Link Copied', 
      description: 'Public profile URL is now in your clipboard.' 
    })
  }

  const handlePreview = () => {
    if (publicUrl) {
      window.open(publicUrl, '_blank')
    }
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
        <h1 className="font-headline text-4xl font-bold tracking-tight">🌐 Public Share</h1>
        <p className="text-muted-foreground">Publish your professional hub for recruiting and networking.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none bg-card/50 backdrop-blur-md shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" /> Visibility Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="space-y-1">
                  <h4 className="font-bold">Public Profile Access</h4>
                  <p className="text-sm text-muted-foreground">Make your professional hub accessible via a unique URL.</p>
                </div>
                <Switch 
                  checked={settings.isPublic} 
                  onCheckedChange={(val) => {
                    updateField('isPublic', val);
                    // Explicit manual save to ensure visibility is updated immediately for the preview
                    save();
                    toast({ 
                      title: val ? 'Hub Published' : 'Hub Private', 
                      description: val ? 'Your profile is now live.' : 'Public access revoked.' 
                    });
                  }} 
                />
              </div>

              {settings.isPublic ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                  <div className="p-5 rounded-xl bg-primary/10 border border-primary/20 flex gap-4">
                    <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-primary uppercase tracking-wider">Public Profile</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Your professional profile is publicly accessible through the generated URL. Share it with recruiters, clients, and networking contacts.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Your Hub Link</Label>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-muted/50 border border-border p-3 rounded-lg text-sm font-mono truncate select-all">
                        {publicUrl}
                      </div>
                      <Button onClick={copyToClipboard} variant="secondary" className="gap-2">
                        <Copy className="h-4 w-4" /> Copy
                      </Button>
                    </div>
                  </div>
                  <Button onClick={handlePreview} variant="outline" className="w-full gap-2 h-12 font-bold">
                    <Eye className="h-4 w-4" /> Preview Public Hub
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 rounded-full bg-muted mb-4">
                    <Lock className="h-10 w-10 text-muted-foreground opacity-50" />
                  </div>
                  <h3 className="font-bold">Privacy Mode Active</h3>
                  <p className="text-sm text-muted-foreground max-w-[300px] mt-2">
                    Your hub is currently private. Only you can see your data. Enable public access to share your expertise.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none bg-primary text-primary-foreground shadow-2xl overflow-hidden">
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" /> Safety First
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm opacity-90 leading-relaxed">
              When public access is enabled, your **Bio**, **Skills**, **Experience**, and **Projects** will be visible to anyone with access to the link. **Contacts** and **Private Documents** always remain secure.
            </CardContent>
          </Card>
        </div>
      </div>
    </CRMLayout>
  )
}
