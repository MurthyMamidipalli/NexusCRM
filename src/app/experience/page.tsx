
"use client"

import React, { useMemo, useState } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Briefcase, Loader2, Trash2, Calendar, MapPin, Pencil } from 'lucide-react'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, orderBy, where } from 'firebase/firestore'
import { collections, deleteRecord, createRecord, updateRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function ExperiencePage() {
  const db = useFirestore()
  const { user } = useUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingExp, setEditingExp] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const expQuery = useMemo(() => {
    if (!db || !user) return null
    return query(
      collection(db, collections.EXPERIENCE), 
      where('ownerId', '==', user.uid),
      orderBy('startDate', 'desc')
    )
  }, [db, user])

  const { data: experience, loading: expLoading } = useCollection(expQuery)

  const handleSaveExp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      role: formData.get('role'),
      company: formData.get('company'),
      location: formData.get('location'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      description: formData.get('description'),
    }

    try {
      if (editingExp) {
        await updateRecord(db, collections.EXPERIENCE, editingExp.id, data)
        toast({ title: 'Experience Updated' })
      } else {
        await createRecord(db, collections.EXPERIENCE, data, user.uid)
        toast({ title: 'Experience Added' })
      }
      setIsDialogOpen(false)
      setEditingExp(null)
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord(db, collections.EXPERIENCE, id)
      toast({ title: 'Experience Removed' })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    }
  }

  if (expLoading) {
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
          <h1 className="font-headline text-4xl font-bold tracking-tight">💼 Experience</h1>
          <p className="text-muted-foreground">Your professional journey and career highlights.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingExp(null);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => setEditingExp(null)}>
              <Plus className="h-4 w-4" />
              Add Experience
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingExp ? 'Edit Work Experience' : 'Add Work Experience'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveExp} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" name="role" defaultValue={editingExp?.role || ''} placeholder="Senior Product Designer" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" name="company" defaultValue={editingExp?.company || ''} placeholder="Acme Inc." required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" defaultValue={editingExp?.location || ''} placeholder="San Francisco, CA" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" name="startDate" type="date" defaultValue={editingExp?.startDate || ''} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" name="endDate" type="date" defaultValue={editingExp?.endDate || ''} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={editingExp?.description || ''} placeholder="Summarize your impact..." className="min-h-[100px]" />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Experience
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {experience && experience.length > 0 ? (
        <div className="space-y-6">
          {experience.map((exp: any) => (
            <Card key={exp.id} className="group border-none bg-card/50 backdrop-blur-md shadow-md hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="p-3 rounded-2xl bg-accent/10 text-accent h-fit">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-headline text-xl font-bold">{exp.role}</h3>
                      <p className="text-primary font-bold">{exp.company}</p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {exp.startDate} — {exp.endDate || 'Present'}
                        </span>
                        {exp.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {exp.location}
                          </span>
                        )}
                      </div>
                      {exp.description && (
                        <p className="text-sm mt-4 text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-primary" 
                      onClick={() => {
                        setEditingExp(exp);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive" 
                      onClick={() => handleDelete(exp.id)}
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
          No experience records found.
        </div>
      )}
    </CRMLayout>
  )
}
