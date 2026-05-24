"use client"

import React, { useMemo, useState } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Hammer, Loader2, Trash2, Award, Pencil, X } from 'lucide-react'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import { collections, deleteRecord, createRecord, updateRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription, DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function SkillsPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [level, setLevel] = useState<string>("Medium")

  const skillsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, collections.SKILLS), where('ownerId', '==', user.uid));
  }, [db, user])

  const { data: rawSkills, loading: skillsLoading } = useCollection(skillsQuery)

  const skills = useMemo(() => {
    if (!rawSkills) return []
    return [...rawSkills].sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))
  }, [rawSkills])

  const handleSaveSkill = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db) return
    
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      level: level,
    }

    const mutation = editingSkill 
      ? updateRecord(db, collections.SKILLS, editingSkill.id, data)
      : createRecord(db, collections.SKILLS, data, user.uid)

    mutation.catch(async (err) => {
      const permissionError = new FirestorePermissionError({
        path: editingSkill ? `${collections.SKILLS}/${editingSkill.id}` : collections.SKILLS,
        operation: editingSkill ? 'update' : 'create',
        requestResourceData: data,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    })

    toast({ title: editingSkill ? 'Skill Updated' : 'Skill Created' })
    setIsDialogOpen(false)
    setEditingSkill(null)
    setLoading(false)
  }

  const handleDelete = (id: string) => {
    if (!db) return
    deleteRecord(db, collections.SKILLS, id)
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: `${collections.SKILLS}/${id}`,
          operation: 'delete',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
    toast({ title: 'Skill Removed' })
  }

  const getLevelColor = (lvl: string) => {
    switch (lvl) {
      case 'High': return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'Medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'Low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">🛠 Skills & Expertise</h1>
          <p className="text-muted-foreground">Mapping your core competencies and professional tools.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingSkill(null);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => { setEditingSkill(null); setLevel("Medium"); }}>
              <Plus className="h-4 w-4" />
              Add Skill
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] bg-[#121214] text-white border-none rounded-3xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
            <DialogHeader className="p-8 pb-4 border-b border-white/5 relative shrink-0 text-left">
              <DialogTitle className="text-3xl font-bold font-headline text-white">{editingSkill ? 'Edit Expertise' : 'Add New Expertise'}</DialogTitle>
              <DialogDescription className="text-gray-400">Add detailed skills to your professional profile.</DialogDescription>
              <DialogClose className="absolute right-4 top-4 text-gray-500 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </DialogClose>
            </DialogHeader>

            <form onSubmit={handleSaveSkill} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-white">Skill Name</Label>
                  <Input id="name" name="name" defaultValue={editingSkill?.name || ''} placeholder="e.g. React.js, Strategic Sales" required className="bg-[#1c1c1f] border-none text-white h-14 rounded-2xl focus:ring-1 focus:ring-primary px-4" />
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-semibold text-white">Category</Label>
                    <Select name="category" defaultValue={editingSkill?.category || "Technical"}>
                      <SelectTrigger className="bg-[#1c1c1f] border-none text-white h-14 px-4 focus:ring-1 focus:ring-primary rounded-2xl">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1c1c1f] border-gray-800 text-white">
                        <SelectItem value="Technical">Technical</SelectItem>
                        <SelectItem value="Soft Skills">Soft Skills</SelectItem>
                        <SelectItem value="Tools">Tools</SelectItem>
                        <SelectItem value="Languages">Languages</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level" className="text-sm font-semibold text-white">Proficiency Level</Label>
                    <Select onValueChange={setLevel} defaultValue={editingSkill?.level || "Medium"}>
                      <SelectTrigger className="bg-[#1c1c1f] border-none text-white h-14 px-4 focus:ring-1 focus:ring-primary rounded-2xl">
                        <SelectValue placeholder="Level" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1c1c1f] border-gray-800 text-white">
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter className="p-8 pt-4 border-t border-white/5 bg-[#121214] shrink-0">
                <Button type="submit" disabled={loading} className="w-full bg-[#10b981] hover:bg-[#0da372] text-white font-bold h-14 rounded-2xl shadow-lg shadow-emerald-500/20 text-lg">
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  Save Expertise
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {skillsLoading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : skills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill: any) => (
            <Card key={skill.id} className="group border-none bg-card/50 backdrop-blur-md shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary"><Award className="h-5 w-5" /></div>
                    <div>
                      <h3 className="font-headline font-bold">{skill.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">{skill.category}</span>
                        {skill.level && <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5 font-bold uppercase tracking-widest", getLevelColor(skill.level))}>{skill.level}</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingSkill(skill); setLevel(skill.level || "Medium"); setIsDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(skill.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/30 text-muted-foreground"><Hammer className="h-12 w-12 opacity-20 mb-4" />No skills mapped yet.</div>
      )}
    </CRMLayout>
  )
}
