"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Loader2, Trash2, Calendar, Trophy, Pencil, X } from 'lucide-react'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import { collections, deleteRecord, createRecord, updateRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription, DialogClose } from '@/components/ui/dialog'
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
          <DialogContent className="sm:max-w-[550px] bg-[#121214] text-white border-none rounded-3xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
            <DialogHeader className="p-8 pb-4 border-b border-white/5 relative shrink-0 text-left">
              <DialogTitle className="text-3xl font-bold font-headline text-white">{editingAch ? 'Edit Achievement' : 'Add Achievement'}</DialogTitle>
              <DialogDescription className="text-gray-400">Record your professional milestones and awards.</DialogDescription>
              <DialogClose className="absolute right-4 top-4 text-gray-500 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </DialogClose>
            </DialogHeader>
            
            <form onSubmit={handleSaveAch} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold text-white">Achievement Title</Label>
                  <Input id="title" name="title" defaultValue={editingAch?.title || ''} placeholder="Employee of the Year" required className="bg-[#1c1c1f] border-none text-white h-14 rounded-2xl focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issuer" className="text-sm font-semibold text-white">Issued by</Label>
                  <Input id="issuer" name="issuer" defaultValue={editingAch?.issuer || ''} placeholder="Global Tech Corp" required className="bg-[#1c1c1f] border-none text-white h-14 rounded-2xl focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-semibold text-white">Date Received</Label>
                  <Input id="date" name="date" type="date" defaultValue={editingAch?.date || ''} required className="bg-[#1c1c1f] border-none text-white h-14 rounded-2xl [color-scheme:dark] focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-white">Significance / Description</Label>
                  <Textarea id="description" name="description" defaultValue={editingAch?.description || ''} placeholder="Briefly describe why you received this award..." className="bg-[#1c1c1f] border-none min-h-[120px] rounded-2xl focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <DialogFooter className="p-8 pt-4 border-t border-white/5 bg-[#121214] shrink-0">
                <Button type="submit" disabled={loading} className="w-full bg-[#10b981] hover:bg-[#0da372] text-white font-bold h-14 rounded-2xl shadow-lg shadow-emerald-500/20 text-lg">
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  Save Achievement
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
