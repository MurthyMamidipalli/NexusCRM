
"use client"

import React, { useMemo, useState } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Rocket, Loader2, Trash2, ExternalLink, Globe, Image as ImageIcon, Paperclip, Calendar, Link as LinkIcon } from 'lucide-react'
import { useFirestore, useCollection } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'
import { collections, deleteRecord, createRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
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
      date: formData.get('date'),
      status: 'Active',
      // Placeholder for visual and doc paths
      visualCover: 'Pending Upload',
      documentationPath: 'Pending Attachment'
    }

    try {
      await createRecord(db, collections.PROJECTS, data)
      toast({ title: 'Project Added to Vault' })
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
          <h1 className="font-headline text-4xl font-bold tracking-tight">🚀 Projects & Products</h1>
          <p className="text-muted-foreground">Showcasing your work, products, and creative ventures.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-[#121214] text-white border-none">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold font-headline">Add Project</DialogTitle>
              <DialogDescription className="text-gray-400">
                Provide details, upload visuals, or attach technical documentation.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddProject} className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold">Title</Label>
                <Input 
                  id="title" 
                  name="title" 
                  placeholder="e.g. My Awesome project" 
                  required 
                  className="bg-[#1c1c1f] border-none text-white focus:ring-1 focus:ring-primary h-12"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-semibold">Date (Optional)</Label>
                  <div className="relative">
                    <Input 
                      id="date" 
                      name="date" 
                      type="date" 
                      className="bg-[#1c1c1f] border-none text-white focus:ring-1 focus:ring-primary h-12 pr-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-sm font-semibold">URL (Optional)</Label>
                  <Input 
                    id="url" 
                    name="url" 
                    placeholder="https://example.com" 
                    className="bg-[#1c1c1f] border-none text-white focus:ring-1 focus:ring-primary h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  placeholder="Describe the features and impact..." 
                  required 
                  className="bg-[#1c1c1f] border-none text-white focus:ring-1 focus:ring-primary min-h-[120px] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Visual Cover</Label>
                  <div className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-700 bg-[#1c1c1f] p-8 transition-all hover:border-primary/50 cursor-pointer">
                    <ImageIcon className="mb-2 h-6 w-6 text-gray-400 group-hover:text-primary" />
                    <span className="text-xs font-semibold text-gray-400 group-hover:text-gray-200">Upload Visual</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Documentation (PDF)</Label>
                  <div className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-700 bg-[#1c1c1f] p-8 transition-all hover:border-primary/50 cursor-pointer">
                    <Paperclip className="mb-2 h-6 w-6 text-gray-400 group-hover:text-primary" />
                    <span className="text-xs font-semibold text-gray-400 group-hover:text-gray-200">Attach PDF</span>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex gap-3 pt-4 sm:justify-end">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsAddOpen(false)}
                  className="bg-[#1c1c1f] hover:bg-gray-800 text-white font-bold h-10 px-8"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="bg-[#7299f0] hover:bg-[#6387d9] text-white font-bold h-10 px-8 shadow-none"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add to Vault
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
                <div className="h-32 bg-primary/5 flex items-center justify-center border-b border-border/50 relative">
                  <Rocket className="h-12 w-12 text-primary opacity-20" />
                  {proj.date && (
                    <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-background/50 px-2 py-1 rounded">
                      {proj.date}
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-headline text-xl font-bold">{proj.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{proj.description}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(proj.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-border/50 flex items-center gap-2">
                    {proj.url && (
                      <Button variant="outline" size="sm" className="gap-2 text-xs h-8" asChild>
                        <a href={proj.url} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-3 w-3" /> Live Link
                        </a>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground h-8">
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
          No projects showcased yet. Start building your vault.
        </div>
      )}
    </CRMLayout>
  )
}
