"use client"

import React, { useMemo, useState } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Hammer, Loader2, Trash2, Award, Pencil } from 'lucide-react'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import { collections, deleteRecord, createRecord, updateRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
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
          <DialogContent className="bg-[#121214] text-white border-none rounded-2xl p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold font-headline">{editingSkill ? 'Edit Expertise' : 'Add New Expertise'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveSkill} className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold">Skill Name</Label>
                <Input id="name" name="name" defaultValue={editingSkill?.name || ''} placeholder="e.g. React.js, Sales Strategy" required className="bg-[#1c1c1f] border-none text-white h-12 px-4 focus:ring-1 focus:ring-primary rounded-xl" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-semibold">Category</Label>
                  <Select name="category" defaultValue={editingSkill?.category || "Technical"}>
                    <SelectTrigger className="bg-[#1c1c1f] border-none text-white h-12 px-4 focus:ring-1 focus:ring-primary rounded-xl"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent className="bg-[#1c1c1f] border-gray-800 text-white">
                      <SelectItem value="Technical">Technical</SelectItem>
                      <SelectItem value="Soft Skills">Soft Skills</SelectItem>
                      <SelectItem value="Tools">Tools</SelectItem>
                      <SelectItem value="Languages">Languages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level" className="text-sm font-semibold">Proficiency Level</Label>
                  <Select onValueChange={setLevel} defaultValue={editingSkill?.level || "Medium"}>
                    <SelectTrigger className="bg-[#1c1c1f] border-none text-white h-12 px-4 focus:ring-1 focus:ring-primary rounded-xl"><SelectValue placeholder="Level" /></SelectTrigger>
                    <SelectContent className="bg-[#1c1c1f] border-gray-800 text-white">
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-white font-bold h-12 px-8 rounded-xl border-none w-full sm:w-auto">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Skill'}
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