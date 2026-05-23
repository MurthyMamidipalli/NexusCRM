"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, GraduationCap, Loader2, Trash2, Calendar, Pencil, Fingerprint, X } from 'lucide-react'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import { collections, deleteRecord, createRecord, updateRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors'

export default function EducationPage() {
  const db = useFirestore()
  const { user, loading: authLoading } = useUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEdu, setEditingEdu] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const eduQuery = useMemo(() => {
    if (!db || !user) return null
    return query(collection(db, collections.EDUCATION), where('ownerId', '==', user.uid))
  }, [db, user])

  const { data: rawEducation, loading: eduLoading } = useCollection(eduQuery)

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
    
    if (authLoading) {
      toast({ title: 'Loading...', description: 'Please wait for your session to initialize.' });
      return;
    }

    if (!user || !db) {
      toast({ variant: 'destructive', title: 'Session Required', description: 'Please sign in to save records.' });
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
      description: formData.get('description') as string,
      ownerId: user.uid
    }

    const mutation = editingEdu
      ? updateRecord(db, collections.EDUCATION, editingEdu.id, data)
      : createRecord(db, collections.EDUCATION, data, user.uid)

    toast({ title: editingEdu ? 'Record Updated' : 'Record Created' })
    setIsDialogOpen(false)
    setEditingEdu(null)
    setLoading(false)

    mutation.catch(async (err) => {
      const permissionError = new FirestorePermissionError({
        path: editingEdu ? `${collections.EDUCATION}/${editingEdu.id}` : collections.EDUCATION,
        operation: 'write',
        requestResourceData: data,
        originalError: err
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    })
  }

  const handleDelete = (id: string) => {
    if (!db) return
    deleteRecord(db, collections.EDUCATION, id).catch(console.error)
    toast({ title: 'Record Removed' })
  }

  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground">🎓 Education</h1>
          <p className="text-muted-foreground">Your academic background and formal learning journey.</p>
        </div>
        <Button className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white font-bold h-12 px-6 rounded-xl" onClick={() => { setEditingEdu(null); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4" /> Add Record
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setEditingEdu(null);
      }}>
        <DialogContent className="sm:max-w-[550px] bg-[#121214] text-white border-none rounded-3xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="p-8 pb-4 border-b border-white/5 relative shrink-0">
            <DialogTitle className="text-3xl font-bold font-headline text-white">Academic Record</DialogTitle>
            <DialogDescription className="text-gray-400">Enter details of your educational institution.</DialogDescription>
            <DialogClose className="absolute right-4 top-4 text-gray-500 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </DialogClose>
          </DialogHeader>
          
          <form onSubmit={handleSaveEdu} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-white">Institution</Label>
                <Input name="institution" defaultValue={editingEdu?.institution} placeholder="e.g. Stanford University" required className="bg-[#1c1c1f] border-none text-white h-14 rounded-2xl focus:ring-1 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-white">Degree</Label>
                  <Input name="degree" defaultValue={editingEdu?.degree} placeholder="B.S." required className="bg-[#1c1c1f] border-none h-14 rounded-2xl focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-white">Field of Study</Label>
                  <Input name="fieldOfStudy" defaultValue={editingEdu?.fieldOfStudy} placeholder="Computer Science" className="bg-[#1c1c1f] border-none h-14 rounded-2xl focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-white">ID / Enrollment Number</Label>
                <div className="relative">
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input name="idNumber" defaultValue={editingEdu?.idNumber} className="bg-[#1c1c1f] border-none h-14 pl-12 rounded-2xl focus:ring-1 focus:ring-primary" placeholder="STU-123456" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-white">Start Date</Label>
                  <Input name="startDate" type="date" defaultValue={editingEdu?.startDate} required className="bg-[#1c1c1f] border-none h-14 rounded-2xl [color-scheme:dark] focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-white">End Date</Label>
                  <Input name="endDate" type="date" defaultValue={editingEdu?.endDate} className="bg-[#1c1c1f] border-none h-14 rounded-2xl [color-scheme:dark] focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-white">Description / Achievements</Label>
                <Textarea name="description" defaultValue={editingEdu?.description} placeholder="Describe your key learnings and awards..." className="bg-[#1c1c1f] border-none min-h-[120px] rounded-2xl focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            <DialogFooter className="p-8 pt-4 border-t border-white/5 bg-[#121214] shrink-0">
              <Button type="submit" disabled={loading} className="w-full bg-[#10b981] hover:bg-[#0da372] text-white font-bold h-14 rounded-2xl shadow-lg shadow-emerald-500/20 text-lg">
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Save Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {!mounted || eduLoading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : education.length > 0 ? (
        <div className="space-y-4">
          {education.map((edu: any) => (
            <Card key={edu.id} className="group border-none bg-card/50 backdrop-blur-md shadow-md hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary h-fit"><GraduationCap className="h-6 w-6" /></div>
                    <div className="space-y-1">
                      <h3 className="font-headline text-xl font-bold">{edu.institution}</h3>
                      <p className="text-primary font-semibold">{edu.degree} • {edu.fieldOfStudy}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{edu.startDate} — {edu.endDate || 'Present'}</span>
                        {edu.idNumber && <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-bold">ID: {edu.idNumber}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingEdu(edu); setIsDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(edu.id)} className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/30 text-muted-foreground italic">
          <GraduationCap className="h-10 w-10 opacity-20 mb-4" />
          No academic records found. Click "Add Record" to start.
        </div>
      )}
    </CRMLayout>
  )
}
