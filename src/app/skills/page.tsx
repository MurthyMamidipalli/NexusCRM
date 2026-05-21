
"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Hammer, Loader2, Trash2, Award } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useFirestore, useCollection } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'
import { collections, deleteRecord, createRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function SkillsPage() {
  const db = useFirestore()
  const [mounted, setMounted] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const skillsQuery = useMemo(() => query(collection(db, collections.SKILLS), orderBy('level', 'desc')), [db])
  const { data: skills, loading: skillsLoading } = useCollection(skillsQuery)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleAddSkill = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      category: formData.get('category'),
      level: parseInt(formData.get('level') as string) || 0,
    }

    try {
      await createRecord(db, collections.SKILLS, data)
      toast({ title: 'Skill Added' })
      setIsAddOpen(false)
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord(db, collections.SKILLS, id)
      toast({ title: 'Skill Removed' })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    }
  }

  if (!mounted || skillsLoading) {
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
          <h1 className="font-headline text-4xl font-bold tracking-tight">🛠 Skills & Expertise</h1>
          <p className="text-muted-foreground">Mapping your core competencies and professional tools.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" />
              Add Skill
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Expertise</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSkill} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Skill Name</Label>
                <Input id="name" name="name" placeholder="e.g. React.js, Sales Strategy" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select name="category" defaultValue="Technical">
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Soft Skills">Soft Skills</SelectItem>
                    <SelectItem value="Tools">Tools</SelectItem>
                    <SelectItem value="Languages">Languages</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Proficiency Level (0-100)</Label>
                <Input id="level" name="level" type="number" min="0" max="100" defaultValue="80" required />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Skill
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {skills && skills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill: any) => (
            <Card key={skill.id} className="group border-none bg-card/50 backdrop-blur-md shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-headline font-bold">{skill.name}</h3>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">{skill.category}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(skill.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span>Proficiency</span>
                    <span className="text-primary">{skill.level}%</span>
                  </div>
                  <Progress value={skill.level} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/30">
          <Hammer className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No skills mapped yet. Start by defining your expertise.</p>
        </div>
      )}
    </CRMLayout>
  )
}
