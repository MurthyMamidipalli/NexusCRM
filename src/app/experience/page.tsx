"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Briefcase, Loader2, Trash2, Calendar, MapPin, Pencil, ExternalLink, Link as LinkIcon, X } from 'lucide-react'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import { collections, deleteRecord, createRecord, updateRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription, DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors'

export default function ExperiencePage() {
  const db = useFirestore()
  const { user } = useUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingExp, setEditingExp] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Project links state for the dialog
  const [projectLinks, setProjectLinks] = useState<{ name: string; url: string }[]>([])
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectUrl, setNewProjectUrl] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  const expQuery = useMemo(() => {
    if (!db || !user) return null
    return query(
      collection(db, collections.EXPERIENCE), 
      where('ownerId', '==', user.uid)
    )
  }, [db, user])

  const { data: rawExperience, loading: expLoading } = useCollection(expQuery)

  // In-memory sorting for index resilience
  const experience = useMemo(() => {
    if (!rawExperience) return []
    return [...rawExperience].sort((a: any, b: any) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateB - dateA;
    })
  }, [rawExperience])

  const handleAddProjectLink = () => {
    if (!newProjectName || !newProjectUrl) {
      toast({ variant: 'destructive', title: 'Invalid Link', description: 'Please provide both a name and a URL.' })
      return
    }
    setProjectLinks([...projectLinks, { name: newProjectName, url: newProjectUrl }])
    setNewProjectName('')
    setNewProjectUrl('')
  }

  const handleRemoveProjectLink = (index: number) => {
    setProjectLinks(projectLinks.filter((_, i) => i !== index))
  }

  const handleSaveExp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db) return

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      role: formData.get('role') as string,
      company: formData.get('company') as string,
      location: formData.get('location') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      description: formData.get('description') as string,
      projectLinks: projectLinks,
    }

    const mutation = editingExp 
      ? updateRecord(db, collections.EXPERIENCE, editingExp.id, data)
      : createRecord(db, collections.EXPERIENCE, data, user.uid)

    // Snappy UI: Optimistic immediate closure
    toast({ title: editingExp ? 'Experience Updated' : 'Experience Added' })
    setIsDialogOpen(false)
    setEditingExp(null)
    setProjectLinks([])
    setLoading(false)

    mutation
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: editingExp ? `${collections.EXPERIENCE}/${editingExp.id}` : collections.EXPERIENCE,
          operation: editingExp ? 'update' : 'create',
          requestResourceData: data,
          originalError: err
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
  }

  const handleDelete = (id: string) => {
    if (!db) return
    deleteRecord(db, collections.EXPERIENCE, id)
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: `${collections.EXPERIENCE}/${id}`,
          operation: 'delete',
          originalError: err
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
    toast({ title: 'Experience Removed' })
  }

  if (!mounted || expLoading) {
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
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground">💼 Experience</h1>
          <p className="text-muted-foreground">Your professional journey and career highlights.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingExp(null);
            setProjectLinks([]);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => {
              setEditingExp(null);
              setProjectLinks([]);
            }}>
              <Plus className="h-4 w-4" />
              Add Experience
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] bg-[#121214] text-white border-none rounded-3xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
            <DialogHeader className="p-8 pb-4 border-b border-white/5 relative shrink-0 text-left">
              <DialogTitle className="text-3xl font-bold font-headline text-white">
                {editingExp ? 'Edit Work Experience' : 'Add Work Experience'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Enter the details of your role and add links to projects.
              </DialogDescription>
              <DialogClose className="absolute right-4 top-4 text-gray-500 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </DialogClose>
            </DialogHeader>

            <form onSubmit={handleSaveExp} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-sm font-semibold text-white">Company Name</Label>
                    <Input id="company" name="company" defaultValue={editingExp?.company || ''} placeholder="Acme Corp" required className="bg-[#1c1c1f] border-none text-white h-14 rounded-2xl focus:ring-1 focus:ring-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-semibold text-white">Job Title</Label>
                    <Input id="role" name="role" defaultValue={editingExp?.role || ''} placeholder="Senior Engineer" required className="bg-[#1c1c1f] border-none text-white h-14 rounded-2xl focus:ring-1 focus:ring-primary" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-semibold text-white">Location (Optional)</Label>
                  <Input id="location" name="location" defaultValue={editingExp?.location || ''} placeholder="Remote / City" className="bg-[#1c1c1f] border-none text-white h-14 rounded-2xl focus:ring-1 focus:ring-primary" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-sm font-semibold text-white">Start Date</Label>
                    <Input id="startDate" name="startDate" type="date" defaultValue={editingExp?.startDate || ''} required className="bg-[#1c1c1f] border-none text-white h-14 rounded-2xl [color-scheme:dark] focus:ring-1 focus:ring-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-sm font-semibold text-white">End Date</Label>
                    <Input id="endDate" name="endDate" type="date" defaultValue={editingExp?.endDate || ''} className="bg-[#1c1c1f] border-none text-white h-14 rounded-2xl [color-scheme:dark] focus:ring-1 focus:ring-primary" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-white">Responsibilities & Impact</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    defaultValue={editingExp?.description || ''} 
                    placeholder="Describe your core contributions..." 
                    className="bg-[#1c1c1f] border-none min-h-[120px] rounded-2xl focus:ring-1 focus:ring-primary" 
                  />
                </div>

                <Separator className="bg-white/5" />

                <div className="space-y-4">
                  <h3 className="text-lg font-bold font-headline text-white">Project Links</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-400 uppercase font-bold">Link Label</Label>
                      <Input placeholder="GitHub Repo" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} className="bg-[#1c1c1f] border-none text-white h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-400 uppercase font-bold">Link URL</Label>
                      <div className="flex gap-2">
                        <Input placeholder="https://..." value={newProjectUrl} onChange={(e) => setNewProjectUrl(e.target.value)} className="bg-[#1c1c1f] border-none text-white h-12 rounded-xl" />
                        <Button type="button" onClick={handleAddProjectLink} className="h-12 w-12 bg-primary/20 text-primary border-none hover:bg-primary/30 rounded-xl shrink-0">
                          <Plus className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {projectLinks.length > 0 && (
                    <div className="space-y-2 pt-2">
                      {projectLinks.map((link, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                          <div className="flex items-center gap-3 min-w-0">
                            <LinkIcon className="h-4 w-4 text-primary shrink-0" />
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-white truncate">{link.name}</span>
                              <span className="text-[10px] text-muted-foreground truncate">{link.url}</span>
                            </div>
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0" onClick={() => handleRemoveProjectLink(idx)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="p-8 pt-4 border-t border-white/5 bg-[#121214] shrink-0">
                <Button type="submit" disabled={loading} className="w-full bg-[#10b981] hover:bg-[#0da372] text-white font-bold h-14 rounded-2xl shadow-lg shadow-emerald-500/20 text-lg">
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  Save Experience
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {experience && experience.length > 0 ? (
        <div className="space-y-6">
          {experience.map((exp: any) => (
            <Card key={exp.id} className="group border-none bg-card/50 backdrop-blur-md shadow-md hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary h-fit">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-headline text-xl font-bold">{exp.role}</h3>
                      <p className="text-primary font-bold">{exp.company}</p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {exp.startDate} — {exp.endDate || 'Present'}
                        </span>
                        {exp.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {exp.location}
                          </span>
                        )}
                      </div>
                      
                      {exp.description && (
                        <p className="text-sm mt-4 text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {exp.description}
                        </p>
                      )}

                      {exp.projectLinks && exp.projectLinks.length > 0 && (
                        <div className="mt-6 flex flex-wrap gap-2">
                          {exp.projectLinks.map((link: any, idx: number) => (
                            <Button key={idx} variant="outline" size="sm" className="h-7 text-[10px] gap-1.5 font-bold" asChild>
                              <a href={link.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3" />
                                {link.name}
                              </a>
                            </Button>
                          ))}
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
                        setEditingExp(exp);
                        setProjectLinks(exp.projectLinks || []);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive" 
                      onClick={() => handleDelete(exp.id)}
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
          No experience records found.
        </div>
      )}
    </CRMLayout>
  )
}
