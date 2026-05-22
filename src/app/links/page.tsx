
"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Link as LinkIcon, Loader2, Trash2, Globe, Github, Linkedin, Twitter, ExternalLink, Pencil } from 'lucide-react'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, orderBy, where } from 'firebase/firestore'
import { collections, deleteRecord, createRecord, updateRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors'

export default function LinksPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [mounted, setMounted] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const linksQuery = useMemo(() => {
    if (!db || !user) return null
    return query(
      collection(db, collections.LINKS), 
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
  }, [db, user])

  const { data: links, loading: linksLoading } = useCollection(linksQuery)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSaveLink = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db) return

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      label: formData.get('label') as string,
      url: formData.get('url') as string,
      type: formData.get('type') || 'Other',
    }

    const mutation = editingLink 
      ? updateRecord(db, collections.LINKS, editingLink.id, data)
      : createRecord(db, collections.LINKS, data, user.uid)

    mutation.catch(async (err) => {
      const permissionError = new FirestorePermissionError({
        path: editingLink ? `${collections.LINKS}/${editingLink.id}` : collections.LINKS,
        operation: editingLink ? 'update' : 'create',
        requestResourceData: data,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    })

    toast({ title: editingLink ? 'Link Updated' : 'Link Saved' })
    setIsDialogOpen(false)
    setEditingLink(null)
    setLoading(false)
  }

  const handleDelete = (id: string) => {
    if (!db) return
    deleteRecord(db, collections.LINKS, id)
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: `${collections.LINKS}/${id}`,
          operation: 'delete',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
    toast({ title: 'Link Removed' })
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
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingLink(null);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => setEditingLink(null)}>
              <Plus className="h-4 w-4" />
              Add Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLink ? 'Edit Link' : 'Add External Presence'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveLink} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="label">Link Label</Label>
                <Input id="label" name="label" defaultValue={editingLink?.label || ''} placeholder="GitHub Portfolio" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input id="url" name="url" defaultValue={editingLink?.url || ''} placeholder="https://github.com/username" required />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
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
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-primary" 
                      onClick={() => {
                        setEditingLink(link);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive" 
                      onClick={() => handleDelete(link.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
