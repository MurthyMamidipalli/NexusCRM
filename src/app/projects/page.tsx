
"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Rocket, 
  Loader2, 
  Trash2, 
  ExternalLink, 
  Globe, 
  Image as ImageIcon, 
  Paperclip, 
  FolderCode, 
  Box,
  Layers,
  Pencil,
  X,
  Upload,
  Link as LinkIcon
} from 'lucide-react'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, orderBy, where } from 'firebase/firestore'
import { collections, deleteRecord, createRecord, updateRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors'

export default function ProjectsPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProj, setEditingProj] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const projectsQuery = useMemo(() => {
    if (!db || !user) return null
    return query(
      collection(db, collections.PROJECTS), 
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
  }, [db, user])

  const { data: projects, loading: projectsLoading } = useCollection(projectsQuery)

  const handleSaveProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db) return

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const category = formData.get('category') as string || 'Project'
    
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      url: formData.get('url') as string,
      date: formData.get('date') as string,
      category: category,
      status: 'Active',
      updatedAt: new Date().toISOString()
    }

    const mutation = editingProj 
      ? updateRecord(db, collections.PROJECTS, editingProj.id, data)
      : createRecord(db, collections.PROJECTS, data, user.uid)

    mutation.catch(async (err) => {
      const permissionError = new FirestorePermissionError({
        path: editingProj ? `${collections.PROJECTS}/${editingProj.id}` : collections.PROJECTS,
        operation: editingProj ? 'update' : 'create',
        requestResourceData: data,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    })

    toast({ title: editingProj ? 'Record Updated' : 'Record Added' })
    setIsDialogOpen(false)
    setEditingProj(null)
    setLoading(false)
  }

  const handleDelete = (id: string) => {
    if (!db) return
    deleteRecord(db, collections.PROJECTS, id)
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: `${collections.PROJECTS}/${id}`,
          operation: 'delete',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
    toast({ title: 'Record Removed' })
  }

  const filteredItems = (category: string) => {
    if (!projects) return []
    return projects.filter((p: any) => (p.category || 'Project') === category)
  }

  if (!mounted || projectsLoading) {
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
        <div className="space-y-1">
          <h1 className="font-headline text-4xl font-bold tracking-tight flex items-center gap-3">
            Projects & Products <Rocket className="h-8 w-8 text-primary/40" />
          </h1>
          <p className="text-muted-foreground font-medium">Manage your professional technical projects and digital products.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingProj(null);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90" onClick={() => setEditingProj(null)}>
              <Plus className="h-4 w-4" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] bg-[#121214] text-white border-none rounded-2xl p-0 overflow-hidden">
            <DialogHeader className="p-8 pb-0">
              <DialogTitle className="text-2xl font-bold font-headline">
                {editingProj ? 'Edit Project' : 'Add Project'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Provide details, upload visuals, or attach technical documentation.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveProject} className="p-8 pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold text-white">Title</Label>
                <Input 
                  id="title" 
                  name="title" 
                  defaultValue={editingProj?.title || ''}
                  placeholder="e.g. My Awesome project" 
                  required 
                  className="bg-[#1c1c1f] border-none text-white h-12 px-4 focus:ring-1 focus:ring-primary rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-semibold text-white">Date (Optional)</Label>
                  <Input 
                    id="date" 
                    name="date" 
                    type="date" 
                    defaultValue={editingProj?.date || ''}
                    className="bg-[#1c1c1f] border-none text-white h-12 px-4 focus:ring-1 focus:ring-primary rounded-xl [color-scheme:dark]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-sm font-semibold text-white">URL (Optional)</Label>
                  <Input 
                    id="url" 
                    name="url" 
                    defaultValue={editingProj?.url || ''}
                    placeholder="https://example.com" 
                    className="bg-[#1c1c1f] border-none text-white h-12 px-4 focus:ring-1 focus:ring-primary rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-white">Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  defaultValue={editingProj?.description || ''}
                  placeholder="Describe the features and impact..." 
                  required 
                  className="bg-[#1c1c1f] border-none text-white focus:ring-1 focus:ring-primary min-h-[120px] rounded-xl resize-none p-4"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-white">Visual Cover</Label>
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-800 rounded-2xl bg-[#1c1c1f]/50 hover:bg-[#1c1c1f] transition-all cursor-pointer group">
                    <ImageIcon className="h-8 w-8 text-gray-500 mb-2 group-hover:text-primary" />
                    <span className="text-xs text-gray-400 font-medium">Upload Visual</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-white">Documentation (PDF)</Label>
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-800 rounded-2xl bg-[#1c1c1f]/50 hover:bg-[#1c1c1f] transition-all cursor-pointer group">
                    <Paperclip className="h-8 w-8 text-gray-500 mb-2 group-hover:text-primary" />
                    <span className="text-xs text-gray-400 font-medium">Attach PDF</span>
                  </div>
                </div>
              </div>

              {/* Hidden field for categorization logic */}
              <input type="hidden" name="category" value={editingProj?.category || "Project"} />

              <DialogFooter className="pt-4 gap-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsDialogOpen(false)}
                  className="bg-[#1c1c1f] hover:bg-gray-800 text-white font-bold h-12 px-8 rounded-xl"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="bg-[#7299f0] hover:bg-[#6387d9] text-white font-bold h-12 px-8 rounded-xl"
                >
                  Add to Vault
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="Project" className="space-y-8">
        <TabsList className="bg-card/30 p-1 flex h-auto w-fit rounded-2xl border border-border/50">
          <TabsTrigger 
            value="Project" 
            className="gap-2 px-8 py-2.5 rounded-xl data-[state=active]:bg-[#7299f0] data-[state=active]:text-white transition-all font-bold text-sm"
          >
            <FolderCode className="h-4 w-4" /> Projects
          </TabsTrigger>
          <TabsTrigger 
            value="Product" 
            className="gap-2 px-8 py-2.5 rounded-xl data-[state=active]:bg-[#7299f0] data-[state=active]:text-white transition-all font-bold text-sm"
          >
            <Box className="h-4 w-4" /> Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value="Project" className="mt-0">
          <ProjectGrid items={filteredItems('Project')} onDelete={handleDelete} onEdit={(p) => { setEditingProj(p); setIsDialogOpen(true); }} />
        </TabsContent>
        <TabsContent value="Product" className="mt-0">
          <ProjectGrid items={filteredItems('Product')} onDelete={handleDelete} onEdit={(p) => { setEditingProj(p); setIsDialogOpen(true); }} />
        </TabsContent>
      </Tabs>
    </CRMLayout>
  )
}

function ProjectGrid({ items, onDelete, onEdit }: { items: any[], onDelete: (id: string) => void, onEdit: (item: any) => void }) {
  if (items.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-card/10 text-muted-foreground italic">
        No entries found in this folder.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {items.map((proj: any) => (
        <Card key={proj.id} className="group overflow-hidden border-none bg-card/40 backdrop-blur-md shadow-lg hover:shadow-2xl transition-all duration-300">
          <CardContent className="p-0">
            <div className="h-36 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center border-b border-border/30 relative">
              <Rocket className="h-10 w-10 text-primary opacity-20 group-hover:scale-110 transition-transform" />
              {proj.date && (
                <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-md border border-border/50">
                  {proj.date}
                </div>
              )}
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-headline text-2xl font-bold group-hover:text-[#7299f0] transition-colors">{proj.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{proj.description}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-primary h-8 w-8" 
                    onClick={() => onEdit(proj)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-destructive h-8 w-8" 
                    onClick={() => onDelete(proj.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-border/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {proj.url && (
                    <Button variant="outline" size="sm" className="gap-2 text-[11px] h-8 font-bold border-border/50 bg-card/50 rounded-lg" asChild>
                      <a href={proj.url} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-3.5 w-3.5 text-primary" /> Live Link
                      </a>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="gap-2 text-[11px] text-muted-foreground h-8 font-bold rounded-lg">
                    <ExternalLink className="h-3.5 w-3.5" /> Details
                  </Button>
                </div>
                <div className="text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest">
                  {proj.category}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
