
"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, GraduationCap, Loader2, Trash2, Calendar } from 'lucide-react'
import { useFirestore, useCollection } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'
import { collections, deleteRecord, createRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function EducationPage() {
  const db = useFirestore()
  const [mounted, setMounted] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const eduQuery = useMemo(() => query(collection(db, collections.EDUCATION), orderBy('startDate', 'desc')), [db])
  const { data: education, loading: eduLoading } = useCollection(eduQuery)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleAddEdu = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      institution: formData.get('institution'),
      degree: formData.get('degree'),
      fieldOfStudy: formData.get('fieldOfStudy'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
    }

    try {
      await createRecord(db, collections.EDUCATION, data)
      toast({ title: 'Education Added' })
      setIsAddOpen(false)
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord(db, collections.EDUCATION, id)
      toast({ title: 'Record Removed' })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    }
  }

  if (!mounted || eduLoading) {
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
          <h1 className="font-headline text-4xl font-bold tracking-tight">🎓 Education</h1>
          <p className="text-muted-foreground">Your academic background and formal learning.</p>
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
              <DialogTitle>Add Academic Record</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddEdu} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="institution">Institution</Label>
                <Input id="institution" name="institution" placeholder="University of Oxford" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="degree">Degree / Qualification</Label>
                <Input id="degree" name="degree" placeholder="BSc Computer Science" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" name="startDate" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (or expected)</Label>
                  <Input id="endDate" name="endDate" type="date" />
                </div>
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

      {education && education.length > 0 ? (
        <div className="space-y-4">
          {education.map((edu: any) => (
            <Card key={edu.id} className="group border-none bg-card/50 backdrop-blur-md shadow-md">
              <CardContent className="p-6 flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary h-fit">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-headline text-xl font-bold">{edu.institution}</h3>
                    <p className="text-primary font-semibold">{edu.degree}</p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{edu.startDate} — {edu.endDate || 'Present'}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(edu.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/30 text-muted-foreground italic">
          No academic records found.
        </div>
      )}
    </CRMLayout>
  )
}
