
"use client"

import React, { useMemo, useState } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, GraduationCap, Loader2, Trash2, Calendar, BookOpen, Award, Pencil } from 'lucide-react'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, orderBy, where } from 'firebase/firestore'
import { collections, deleteRecord, createRecord, updateRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function EducationPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEdu, setEditingEdu] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const eduQuery = useMemo(() => {
    if (!db || !user) return null
    return query(
      collection(db, collections.EDUCATION), 
      where('ownerId', '==', user.uid),
      orderBy('startDate', 'desc')
    )
  }, [db, user])

  const { data: education, loading: eduLoading } = useCollection(eduQuery)

  const handleSaveEdu = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      institution: formData.get('institution'),
      degree: formData.get('degree'),
      fieldOfStudy: formData.get('fieldOfStudy'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      cgpa: formData.get('cgpa'),
      percentage: formData.get('percentage'),
      description: formData.get('description'),
    }

    try {
      if (editingEdu) {
        await updateRecord(db, collections.EDUCATION, editingEdu.id, data)
        toast({ title: 'Education Updated' })
      } else {
        await createRecord(db, collections.EDUCATION, data, user.uid)
        toast({ title: 'Education Added' })
      }
      setIsDialogOpen(false)
      setEditingEdu(null)
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

  if (eduLoading) {
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
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingEdu(null);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => setEditingEdu(null)}>
              <Plus className="h-4 w-4" />
              Add Record
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold font-headline">
                {editingEdu ? 'Edit Education' : 'Add Education'}
              </DialogTitle>
              <DialogDescription>
                Enter the details of your educational institution.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveEdu} className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="institution">Institution</Label>
                <Input id="institution" name="institution" defaultValue={editingEdu?.institution || ''} placeholder="e.g. Stanford University" required />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="degree">Degree</Label>
                  <Input id="degree" name="degree" defaultValue={editingEdu?.degree || ''} placeholder="e.g. Bachelor of Science" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fieldOfStudy">Field of Study</Label>
                  <Input id="fieldOfStudy" name="fieldOfStudy" defaultValue={editingEdu?.fieldOfStudy || ''} placeholder="e.g. Computer Science" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" name="startDate" type="date" defaultValue={editingEdu?.startDate || ''} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input id="endDate" name="endDate" type="date" defaultValue={editingEdu?.endDate || ''} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cgpa">CGPA</Label>
                  <Input id="cgpa" name="cgpa" defaultValue={editingEdu?.cgpa || ''} placeholder="e.g. 3.8/4.0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="percentage">Percentage</Label>
                  <Input id="percentage" name="percentage" defaultValue={editingEdu?.percentage || ''} placeholder="e.g. 92%" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Achievements / Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  defaultValue={editingEdu?.description || ''}
                  placeholder="Describe your major accomplishments..." 
                  className="min-h-[120px]"
                />
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
            <Card key={edu.id} className="group border-none bg-card/50 backdrop-blur-md shadow-md hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary h-fit">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <div>
                        <h3 className="font-headline text-xl font-bold">{edu.institution}</h3>
                        <p className="text-primary font-semibold flex items-center gap-2">
                          {edu.degree}
                          {edu.fieldOfStudy && (
                            <span className="text-muted-foreground font-normal text-sm">
                              • {edu.fieldOfStudy}
                            </span>
                          )}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{edu.startDate} — {edu.endDate || 'Present'}</span>
                        </div>
                        {(edu.cgpa || edu.percentage) && (
                          <div className="flex items-center gap-4">
                            {edu.cgpa && (
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-accent/10 text-accent font-bold text-xs">
                                <Award className="h-3 w-3" /> CGPA: {edu.cgpa}
                              </div>
                            )}
                            {edu.percentage && (
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-green-500/10 text-green-500 font-bold text-xs">
                                <Award className="h-3 w-3" /> {edu.percentage}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {edu.description && (
                        <div className="mt-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {edu.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-primary" 
                      onClick={() => {
                        setEditingEdu(edu);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive" 
                      onClick={() => handleDelete(edu.id)}
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
          No academic records found.
        </div>
      )}
    </CRMLayout>
  )
}
