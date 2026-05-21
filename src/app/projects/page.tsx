
"use client"

import React, { useMemo, useState } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Rocket, Loader2, Trash2, ExternalLink, Globe } from 'lucide-react'
import { useFirestore, useCollection } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'
import { collections, deleteRecord, createRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

export default function ProjectsPage() {
  const db = useFirestore()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const projectsQuery = useMemo(() => query(collection(db, collections.PROJECTS), orderBy('createdAt', 'desc')), [db])
  const { data: projects, loading: projectsLoading } = useCollection(projectsQuery)

  const handleAddProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      url: formData.get('url'),
      technologies: (formData.get('technologies') as string)?.split(',').map(t => t.trim()) || [],
      status: 'Active'
    }

    try {
      await createRecord(db, collections.PROJECTS, data)
      toast({ title: 'Project Added' })
      setIsAddOpen(false)
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord(db, collections.PROJECTS, id)
      toast({ title: 'Project Removed' })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    }
  }

  if (projectsLoading) {
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
          <h1 className="font-headline text-4xl font-bold tracking-tight">🚀 Projects</h1>
          <p className="text-muted-foreground">Showcasing your work, products, and creative ventures.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddProject} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title</Label>
                <Input id="title" name="title" placeholder="e.g. Nexus CRM" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="What does this project do?" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">Project URL</Label>
                <Input id="url" name="url" placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="technologies">Technologies (comma separated)</Label>
                <Input id="technologies" name="technologies" placeholder="React, Next.js, Firebase" />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Project
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((proj: any) => (
            <Card key={proj.id} className="group overflow-hidden border-none bg-card/50 backdrop-blur-md shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-0">
                <div className="h-32 bg-primary/5 flex items-center justify-center border-b border-border/50">
                  <Rocket className="h-12 w-12 text-primary opacity-20" />
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-headline text-xl font-bold">{proj.title}</h3>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{proj.description}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(proj.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    {proj.technologies?.map((tech: string) => (
                      <Badge key={tech} variant="secondary" className="text-[10px] uppercase">{tech}</Badge>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/50 flex items-center gap-2">
                    {proj.url && (
                      <Button variant="outline" size="sm" className="gap-2 text-xs" asChild>
                        <a href={proj.url} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-3 w-3" /> Live Demo
                        </a>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground">
                      <ExternalLink className="h-3 w-3" /> Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/30 text-muted-foreground italic">
          No projects showcased yet.
        </div>
      )}
    </CRMLayout>
  )
}
