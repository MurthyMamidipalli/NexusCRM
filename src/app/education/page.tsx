"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, GraduationCap, Loader2, Trash2, Calendar, Award, Pencil, AlertCircle, Fingerprint, X } from 'lucide-react'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import { collections, deleteRecord, createRecord, updateRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors'

export default function EducationPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEdu, setEditingEdu] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const eduQuery = useMemo(() => {
    if (!db || !user) return null
    return query(
      collection(db, collections.EDUCATION), 
      where('ownerId', '==', user.uid)
    )
  }, [db, user])

  const { data: rawEducation, loading: eduLoading, error: eduError } = useCollection(eduQuery)

  const education = useMemo(() => {
    if (!rawEducation) return []
    return [...rawEducation].sort((a: any, b: any) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateB - dateA;
    })
  }, [rawEducation])

  const handleSaveEdu = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('[Education] handleSaveEdu triggered');
    
    if (!user || !db) {
      console.warn('[Education] User or DB not ready');
      return;
    }

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      institution: formData.get('institution') as string,
      degree: formData.get('degree') as string,
      fieldOfStudy: formData.get('fieldOfStudy') as string,
      idNumber: formData.get('idNumber') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      cgpa: formData.get('cgpa') as string,
      percentage: formData.get('percentage') as string,
      description: formData.get('description') as string,
    }

    console.log('[Education] Saving data:', data);

    const mutation = editingEdu
      ? updateRecord(db, collections.EDUCATION, editingEdu.id, data)
      : createRecord(db, collections.EDUCATION, data, user.uid)

    toast({ title: editingEdu ? 'Education Updated' : 'Education Added' })
    setIsDialogOpen(false)
    setEditingEdu(null)
    setLoading(false)

    mutation
      .then(() => console.log('[Education] Save successful'))
      .catch(async (err) => {
        console.error('[Education] Save failed:', err);
        const permissionError = new FirestorePermissionError({
          path: editingEdu ? `${collections.EDUCATION}/${editingEdu.id}` : collections.EDUCATION,
          operation: editingEdu ? 'update' : 'create',
          requestResourceData: data,
          originalError: err
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
  }

  const handleDelete = (id: string) => {
    if (!db) return
    console.log(`[Education] Deleting ID: ${id}`);
    deleteRecord(db, collections.EDUCATION, id)
      .catch(async (err) => {
        console.error('[Education] Delete failed:', err);
        const permissionError = new FirestorePermissionError({
          path: `${collections.EDUCATION}/${id}`,
          operation: 'delete',
          originalError: err
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
    toast({ title: 'Record Removed' })
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
            <Button className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white" onClick={() => setEditingEdu(null)}>
              <Plus className="h-4 w-4" />
              Add Record
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] bg-[#121214] text-white border-none rounded-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
            <DialogHeader className="p-8 pb-4 relative">
              <DialogTitle className="text-3xl font-bold font-headline">
                {editingEdu ? 'Edit Education' : 'Add Education'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Enter the details of your educational institution.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSaveEdu} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="institution" className="text-sm font-semibold text-white">Institution</Label>
                  <Input 
                    id="institution" 
                    name="institution" 
                    defaultValue={editingEdu?.institution || ''} 
                    placeholder="e.g. Stanford University" 
                    required 
                    className="bg-[#1c1c1f] border-none text-white h-12 px-4 focus:ring-1 focus:ring-primary rounded-xl"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="degree" className="text-sm font-semibold text-white">Degree</Label>
                    <Input 
                      id="degree" 
                      name="degree" 
                      defaultValue={editingEdu?.degree || ''} 
                      placeholder="e.g. Bachelor of Science" 
                      required 
                      className="bg-[#1c1c1f] border-none text-white h-12 px-4 focus:ring-1 focus:ring-primary rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fieldOfStudy" className="text-sm font-semibold text-white">Field of Study</Label>
                    <Input 
                      id="fieldOfStudy" 
                      name="fieldOfStudy" 
                      defaultValue={editingEdu?.fieldOfStudy || ''} 
                      placeholder="e.g. Computer Science" 
                      className="bg-[#1c1c1f] border-none text-white h-12 px-4 focus:ring-1 focus:ring-primary rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idNumber" className="text-sm font-semibold text-white">ID Number / Enrollment No.</Label>
                  <div className="relative">
                    <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      id="idNumber" 
                      name="idNumber" 
                      className="bg-[#1c1c1f] border-none text-white h-12 pl-12 focus:ring-1 focus:ring-primary rounded-xl" 
                      defaultValue={editingEdu?.idNumber || ''} 
                      placeholder="e.g. STU-123456" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-sm font-semibold text-white">Start Date</Label>
                    <Input 
                      id="startDate" 
                      name="startDate" 
                      type="date" 
                      defaultValue={editingEdu?.startDate || ''} 
                      required 
                      className="bg-[#1c1c1f] border-none text-white h-12 px-4 focus:ring-1 focus:ring-primary rounded-xl [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-sm font-semibold text-white">End Date (Optional)</Label>
                    <Input 
                      id="endDate" 
                      name="endDate" 
                      type="date" 
                      defaultValue={editingEdu?.endDate || ''} 
                      className="bg-[#1c1c1f] border-none text-white h-12 px-4 focus:ring-1 focus:ring-primary rounded-xl [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cgpa" className="text-sm font-semibold text-white">CGPA</Label>
                    <Input 
                      id="cgpa" 
                      name="cgpa" 
                      defaultValue={editingEdu?.cgpa || ''} 
                      placeholder="e.g. 3.8/4.0" 
                      className="bg-[#1c1c1f] border-none text-white h-12 px-4 focus:ring-1 focus:ring-primary rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="percentage" className="text-sm font-semibold text-white">Percentage</Label>
                    <Input 
                      id="percentage" 
                      name="percentage" 
                      defaultValue={editingEdu?.percentage || ''} 
                      placeholder="e.g. 92%" 
                      className="bg-[#1c1c1f] border-none text-white h-12 px-4 focus:ring-1 focus:ring-primary rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-white">Achievements / Description</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    defaultValue={editingEdu?.description || ''}
                    placeholder="Describe your major accomplishments..." 
                    className="bg-[#1c1c1f] border-none text-white min-h-[120px] rounded-xl focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <DialogFooter className="p-8 pt-4 border-t border-white/5 bg-[#121214]">
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="bg-[#10b981] hover:bg-[#0da372] text-white font-bold h-12 px-8 rounded-xl border-none w-full"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Record
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {eduError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>System Alert</AlertTitle>
          <AlertDescription>
            Loading optimized view. Please refresh if records do not appear instantly.
          </AlertDescription>
        </Alert>
      )}

      {!mounted || eduLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : education && education.length > 0 ? (
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
                        {edu.idNumber && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold uppercase tracking-widest">
                            <Fingerprint className="h-3 w-3" /> ID: {edu.idNumber}
                          </div>
                        )}
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
                    <Button variant="ghost" size="icon" onClick={() => { setEditingEdu(edu); setIsDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(edu.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
