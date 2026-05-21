
"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Target, Loader2, Trash2, Calendar, Trophy } from 'lucide-react'
import { useFirestore, useCollection } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'
import { collections, deleteRecord, createRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function AchievementsPage() {
  const db = useFirestore()
  const [mounted, setMounted] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const achQuery = useMemo(() => query(collection(db, collections.ACHIEVEMENTS), orderBy('date', 'desc')), [db])
  const { data: achievements, loading: achLoading } = useCollection(achQuery)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleAddAch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get('title'),
      issuer: formData.get('issuer'),
      date: formData.get('date'),
      description: formData.get('description'),
    }

    try {
      await createRecord(db, collections.ACHIEVEMENTS, data)
      toast({ title: 'Achievement Recorded' })
      setIsAddOpen(false)
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord(db, collections.ACHIEVEMENTS, id)
      toast({ title: 'Record Removed' })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    }
  }

  if (!mounted || achLoading) {
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
          <h1 className="font-headline text-4xl font-bold tracking-tight">🎯 Achievements & Awards</h1>
          <p className="text-muted-foreground">Celebrating your professional milestones and excellence.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" />
              Add Record
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Achievement</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddAch} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" placeholder="Employee of the Year" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issuer">Issued by</Label>
                <Input id="issuer" name="issuer" placeholder="Global Tech Corp" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" name="date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Briefly describe the significance..." />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Record
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {achievements && achievements.length > 0 ? (
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
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(ach.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
