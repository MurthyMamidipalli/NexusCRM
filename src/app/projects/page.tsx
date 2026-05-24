
"use client"

import React, { useMemo, useState, useEffect, useRef } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Rocket, 
  Loader2, 
  Trash2, 
  Globe, 
  Image as ImageIcon, 
  Paperclip, 
  FolderCode, 
  Box,
  Pencil,
  FileText,
  CheckCircle2,
  X,
  Calendar
} from 'lucide-react'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import { collections, deleteRecord, createRecord, updateRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { uploadToSupabaseStorage, validateFile } from '@/lib/storage-service'
import { getSignedUrlAction } from '@/app/actions/storage-actions'

export default function ProjectsPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProj, setEditingProj] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('Project')

  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<File | null>(null)
  
  const imageInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null)

  useEffect(() => { setMounted(true) }, [])

  const projectsQuery = useMemo(() => {
    if (!db || !user) return null
    return query(collection(db, collections.PROJECTS), where('ownerId', '==', user.uid))
  }, [db, user])

  const { data: rawProjects, loading: projectsLoading } = useCollection(projectsQuery)

  const projects = useMemo(() => {
    if (!rawProjects) return []
    return [...rawProjects].sort((a: any, b: any) => {
      const getVal = (doc: any) => {
        if (doc.updatedAt?.toMillis) return doc.updatedAt.toMillis();
        if (doc.updatedAt?.seconds) return doc.updatedAt.seconds * 1000;
        return Date.now() + 10000;
      }
      return getVal(b) - getVal(a);
    })
  }, [rawProjects])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'pdf') => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      validateFile(file);
      if (type === 'image') setSelectedImage(file)
      else setSelectedDoc(file)
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'File Error', description: err.message })
    }
  }

  const handleSaveProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db) return
    setLoading(true)
    setUploadProgress(0)

    const formData = new FormData(e.currentTarget)
    try {
      let imageUrl = editingProj?.imageUrl || ''
      let imagePath = editingProj?.imagePath || ''
      let documentUrl = editingProj?.documentUrl || ''
      let documentPath = editingProj?.documentPath || ''
      let documentName = editingProj?.documentName || ''

      if (selectedImage) {
        const uploadResult = await uploadToSupabaseStorage(
          selectedImage, 
          `projects/${user.uid}/images`,
          (p) => setUploadProgress((p * 0.5))
        );
        imageUrl = uploadResult.downloadURL;
        imagePath = uploadResult.storagePath;
      }

      if (selectedDoc) {
        const uploadResult = await uploadToSupabaseStorage(
          selectedDoc, 
          `projects/${user.uid}/docs`,
          (p) => setUploadProgress(50 + (p * 0.5))
        );
        documentUrl = uploadResult.downloadURL;
        documentPath = uploadResult.storagePath;
        documentName = selectedDoc.name;
      }

      const data = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        url: formData.get('url') as string,
        date: formData.get('date') as string,
        category: activeTab,
        imageUrl,
        imagePath,
        documentUrl,
        documentPath,
        documentName: documentName || formData.get('title'),
        ownerId: user.uid
      }

      const mutation = editingProj
        ? updateRecord(db, collections.PROJECTS, editingProj.id, data)
        : createRecord(db, collections.PROJECTS, data, user.uid);

      toast({ title: editingProj ? 'Updated' : 'Created' })
      setIsDialogOpen(false)
      resetForm()

      mutation.catch(async (err: any) => {
        const permissionError = new FirestorePermissionError({
          path: editingProj ? `${collections.PROJECTS}/${editingProj.id}` : collections.PROJECTS,
          operation: 'write',
          requestResourceData: data,
          originalError: err
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: err.message });
    } finally {
      setLoading(false)
    }
  }

  const handlePreviewFile = async (proj: any) => {
    if (!proj.documentPath) {
      toast({ variant: 'destructive', title: 'Error', description: 'Documentation path not found in record.' });
      return;
    }

    setViewingId(proj.id);
    try {
      const { signedUrl } = await getSignedUrlAction(proj.documentPath);
      setPreviewDoc({ url: signedUrl, name: proj.documentName || proj.title });
    } catch (err: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Access Denied', 
        description: err.message || 'Could not generate secure access link.' 
      });
    } finally {
      setViewingId(null);
    }
  };

  const resetForm = () => { 
    setEditingProj(null); 
    setSelectedImage(null); 
    setSelectedDoc(null); 
    setUploadProgress(0);
  }

  const handleDelete = async (proj: any) => {
    if (!db) return
    deleteRecord(db, collections.PROJECTS, proj.id).catch(console.error)
    toast({ title: 'Removed' })
  }

  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-headline text-4xl font-bold tracking-tight flex items-center gap-3">Projects & Products <Rocket className="h-8 w-8 text-primary/40" /></h1>
        <Dialog open={isDialogOpen} onOpenChange={(o) => { if(!loading) setIsDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"><Plus className="h-4 w-4" /> Add {activeTab}</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] bg-[#121214] text-white border-none rounded-2xl p-0 overflow-hidden">
            <DialogHeader className="p-8 pb-0">
              <DialogTitle className="text-2xl font-bold font-headline">{editingProj ? `Edit ${activeTab}` : `Add ${activeTab}`}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveProject} className="p-8 pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" defaultValue={editingProj?.title || ''} required className="bg-[#1c1c1f] border-none text-white h-12 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2"><Label htmlFor="date">Date</Label><Input id="date" name="date" type="date" defaultValue={editingProj?.date || ''} className="bg-[#1c1c1f] border-none [color-scheme:dark] rounded-xl" /></div>
                <div className="space-y-2"><Label htmlFor="url">URL</Label><Input id="url" name="url" defaultValue={editingProj?.url || ''} placeholder="https://..." className="bg-[#1c1c1f] border-none rounded-xl" /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" defaultValue={editingProj?.description || ''} required className="bg-[#1c1c1f] border-none min-h-[120px] rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Visual Cover</Label>
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-800 rounded-2xl bg-[#1c1c1f]/50 cursor-pointer" onClick={() => !loading && imageInputRef.current?.click()}>
                    <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'image')} />
                    {selectedImage ? <CheckCircle2 className="text-primary" /> : <ImageIcon className="text-gray-500" />}
                    <span className="text-[10px] text-gray-500 mt-2">{selectedImage?.name || 'Change Image'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Documentation (PDF)</Label>
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-800 rounded-2xl bg-[#1c1c1f]/50 cursor-pointer" onClick={() => !loading && docInputRef.current?.click()}>
                    <input type="file" ref={docInputRef} className="hidden" accept=".pdf" onChange={(e) => handleFileChange(e, 'pdf')} />
                    {selectedDoc ? <FileText className="text-primary" /> : <Paperclip className="text-gray-500" />}
                    <span className="text-[10px] text-gray-500 mt-2">{selectedDoc?.name || 'Change PDF'}</span>
                  </div>
                </div>
              </div>
              
              {loading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-primary">
                    <span>Syncing with Supabase...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-1 bg-gray-800" />
                </div>
              )}

              <DialogFooter><Button type="submit" disabled={loading} className="bg-[#7299f0] hover:bg-[#6387d9] h-12 px-8 rounded-xl">{loading && <Loader2 className="animate-spin mr-2" />}{editingProj ? 'Update' : 'Add'}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-card/30 p-1 rounded-2xl border border-border/50"><TabsTrigger value="Project" className="px-8 py-2.5 rounded-xl font-bold"><FolderCode className="mr-2" /> Projects</TabsTrigger><TabsTrigger value="Product" className="px-8 py-2.5 rounded-xl font-bold"><Box className="mr-2" /> Products</TabsTrigger></TabsList>
        <TabsContent value="Project"><ProjectGrid items={projects.filter(p => p.category === 'Project')} onDelete={handleDelete} onEdit={(p) => { setEditingProj(p); setIsDialogOpen(true); }} onPreview={handlePreviewFile} viewingId={viewingId} /></TabsContent>
        <TabsContent value="Product"><ProjectGrid items={projects.filter(p => p.category === 'Product')} onDelete={handleDelete} onEdit={(p) => { setEditingProj(p); setIsDialogOpen(true); }} onPreview={handlePreviewFile} viewingId={viewingId} /></TabsContent>
      </Tabs>

      <Dialog open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)}><DialogContent className="sm:max-w-[90vw] h-[90vh] p-0 bg-[#0f1115] text-white border-none rounded-2xl overflow-hidden flex flex-col"><div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#1a1c21]"><div className="flex items-center gap-3"><FileText className="text-primary" /><DialogTitle className="truncate max-w-md">{previewDoc?.name}</DialogTitle></div><Button variant="ghost" onClick={() => setPreviewDoc(null)}><X /></Button></div><div className="flex-1">{previewDoc?.url && <iframe src={previewDoc.url} className="w-full h-full border-none" />}</div></DialogContent></Dialog>
    </CRMLayout>
  )
}

function ProjectGrid({ items, onDelete, onEdit, onPreview, viewingId }: { items: any[], onDelete: (proj: any) => void, onEdit: (item: any) => void, onPreview: (item: any) => void, viewingId: string | null }) {
  if (items.length === 0) return <div className="flex h-64 items-center justify-center border-2 border-dashed border-border/50 rounded-2xl italic text-muted-foreground">No entries found.</div>
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {items.map((proj: any) => {
        const isLoading = viewingId === proj.id;
        return (
          <Card key={proj.id} className="group overflow-hidden border-none bg-[#121214] text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-[24px]">
            <div className="relative aspect-[16/10] overflow-hidden bg-[#1c1c1f]">
              {proj.imageUrl ? <img src={proj.imageUrl} alt={proj.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center opacity-10"><Rocket className="h-16 w-16" /></div>}
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><Button variant="secondary" size="icon" onClick={() => onEdit(proj)} className="bg-black/60"><Pencil className="h-4 w-4" /></Button><Button variant="secondary" size="icon" onClick={() => onDelete(proj)} className="bg-black/60 hover:bg-destructive"><Trash2 className="h-4 w-4" /></Button></div>
            </div>
            <div className="p-8 space-y-4">
              <div className="space-y-2"><h3 className="font-headline text-2xl font-bold">{proj.title}</h3>{proj.date && <div className="flex items-center gap-2 text-sm text-gray-500 font-medium"><Calendar className="h-4 w-4" />{new Date(proj.date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</div>}</div>
              <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">{proj.description}</p>
              <div className="pt-4 flex gap-3">
                {proj.url && <Button variant="outline" className="bg-[#1c1c1f] border-none text-white text-[11px] font-bold h-10 px-4 rounded-xl gap-2 hover:bg-primary" asChild><a href={proj.url} target="_blank" rel="noopener noreferrer"><Globe className="h-3.5 w-3.5" /> Live Link</a></Button>}
                {proj.documentPath && (
                  <Button 
                    variant="outline" 
                    className="bg-[#1c1c1f] border-none text-white text-[11px] font-bold h-10 px-4 rounded-xl gap-2 hover:bg-accent" 
                    onClick={() => onPreview(proj)}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />} Docs
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  )
}
