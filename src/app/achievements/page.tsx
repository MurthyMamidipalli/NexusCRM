"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Loader2, Trash2, Calendar, Trophy, Pencil } from 'lucide-react'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import { collections, deleteRecord, createRecord, updateRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors'

export default function AchievementsPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [mounted, setMounted] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAch, setEditingAch] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const achQuery = useMemo(() => {
    if (!db || !user) return null
    return query(
      collection(db, collections.ACHIEVEMENTS), 
      where('ownerId', '==', user.uid)
    )
  }, [db, user])

  const { data: rawAchievements, loading: achLoading } = useCollection(achQuery)

  const achievements = useMemo(() => {
    if (!rawAchievements) return []
    return [...rawAchievements].sort((a: any, b: any) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    })
  }, [rawAchievements])

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSaveAch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db) return

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get('title') as string,
      issuer: formData.get('issuer') as string,
      date: formData.get('date') as string,
      description: formData.get('description') as string,
    }

    const mutation = editingAch 
      ? updateRecord(db, collections.ACHIEVEMENTS, editingAch.id, data)
      : createRecord(db, collections.ACHIEVEMENTS, data, user.uid)

    // Snappy UI: Immediate Feedback
    toast({ title: editingAch ? 'Achievement Updated' : 'Achievement Recorded' })
    setIsDialogOpen(false)
    setEditingAch(null)
    setLoading(false)

    mutation.catch(async (serverError: any) => {
      const permissionError = new FirestorePermissionError({
        path: editingAch ? `${collections.ACHIEVEMENTS}/${editingAch.id}` : collections.ACHIEVEMENTS,
        operation: editingAch ? 'update' : 'create',
        requestResourceData: data,
        originalError: serverError
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    })
  }

  const handleDelete = (id: string) => {
    if (!db) return
    deleteRecord(db, collections.ACHIEVEMENTS, id)
      .catch((err: any) => {
        const permissionError = new FirestorePermissionError({
          path: `${collections.ACHIEVEMENTS}/${id}`,
          operation: 'delete',
          originalError: err
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
    toast({ title: 'Record Removed' })
  }

  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">🎯 Achievements & Awards</h1>
          <p className="text-muted-foreground">Celebrating your professional milestones and excellence.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingAch(null);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => setEditingAch(null)}>
              <Plus className="h-4 w-4" />
              Add Record
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAch ? 'Edit Achievement' : 'Add Achievement'}</DialogTitle>
              <DialogDescription>Record your professional milestones and awards.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveAch} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" defaultValue={editingAch?.title || ''} placeholder="Employee of the Year" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issuer">Issued by</Label>
                <Input id="issuer" name="issuer" defaultValue={editingAch?.issuer || ''} placeholder="Global Tech Corp" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" name="date" type="date" defaultValue={editingAch?.date || ''} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={editingAch?.description || ''} placeholder="Briefly describe the significance..." />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  Save Record
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!mounted || achLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : achievements && achievements.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {achievements.map((ach: any) => (
            <Card key={ach.id} className="group border-none bg-card/50 backdrop-blur-md shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="p-4 rounded-2xl bg-yellow-500/10 text-yellow-500 h-fit">
                      <Trophy className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-headline text-2xl font-bold">{ach.title}</h3>
                      <p className="text-primary font-bold">{ach.issuer}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                        <Calendar className="h-3 w-3" />
                        {ach.date}
                      </div>
                      {ach.description && (
                        <p className="text-sm mt-4 text-muted-foreground leading-relaxed">
                          {ach.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" 
                      onClick={() => {
                        setEditingAch(ach);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" 
                      onClick={() => handleDelete(ach.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/30 text-muted-foreground italic">
          No awards recorded yet.
        </div>
      )}
    </CRMLayout>
  )
}
