
"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Link as LinkIcon, Loader2, Trash2, Globe, Github, Linkedin, Twitter, ExternalLink } from 'lucide-react'
import { useFirestore, useCollection } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'
import { collections, deleteRecord, createRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LinksPage() {
  const db = useFirestore()
  const [mounted, setMounted] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const linksQuery = useMemo(() => query(collection(db, collections.LINKS), orderBy('createdAt', 'desc')), [db])
  const { data: links, loading: linksLoading } = useCollection(linksQuery)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleAddLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      label: formData.get('label'),
      url: formData.get('url'),
      type: formData.get('type') || 'Other',
      createdAt: new Date().toISOString()
    }

    try {
      await createRecord(db, collections.LINKS, data)
      toast({ title: 'Link Saved' })
      setIsAddOpen(false)
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord(db, collections.LINKS, id)
      toast({ title: 'Link Removed' })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    }
  }

  const getIcon = (label: string) => {
    const l = label.toLowerCase()
    if (l.includes('github')) return <Github className="h-5 w-5" />
    if (l.includes('linkedin')) return <Linkedin className="h-5 w-5" />
    if (l.includes('twitter')) return <Twitter className="h-5 w-5" />
    return <Globe className="h-5 w-5" />
  }

  if (!mounted || linksLoading) {
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
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">🔗 Portfolios & Links</h1>
          <p className="text-muted-foreground">Your digital footprint and professional social presence.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" />
              Add Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add External Presence</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddLink} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="label">Link Label</Label>
                <Input id="label" name="label" placeholder="GitHub Portfolio" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input id="url" name="url" placeholder="https://github.com/username" required />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Link
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {links && links.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {links.map((link: any) => (
            <Card key={link.id} className="group border-none bg-card/50 backdrop-blur-md shadow-md hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                    {getIcon(link.label)}
                  </div>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100" onClick={() => handleDelete(link.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-4 space-y-1">
                  <h3 className="font-headline font-bold text-lg">{link.label}</h3>
                  <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                </div>
                <Button variant="outline" className="w-full mt-6 gap-2 group-hover:bg-primary group-hover:text-white transition-all" asChild>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" /> Visit Link
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/30 text-muted-foreground italic">
          No external links added yet.
        </div>
      )}
    </CRMLayout>
  )
}
