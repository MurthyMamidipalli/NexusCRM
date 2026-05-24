
"use client"

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Loader2, 
  Plus, 
  Trash2, 
  Upload,
  Link as LinkIcon,
  Globe,
  ExternalLink,
  Lock,
  FileCheck,
  CheckCircle2,
  Eye,
  X,
  Pencil
} from 'lucide-react'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import { collections, createRecord, updateRecord, deleteRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { uploadToSupabaseStorage, validateFile } from '@/lib/storage-service'
import { getSignedUrlAction } from '@/app/actions/storage-actions'

export default function ResumePage() {
  const db = useFirestore()
  const { user } = useUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingResume, setEditingResume] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('PDF')
  
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedDocType, setSelectedDocType] = useState<string>("Resume")
  const [selectedVisibility, setSelectedVisibility] = useState<string>("Private")

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (editingResume) {
      setSelectedDocType(editingResume.docType || "Resume")
      setSelectedVisibility(editingResume.visibility || (editingResume.isPublic ? "Public" : "Private"))
    } else {
      setSelectedDocType("Resume")
      setSelectedVisibility("Private")
    }
  }, [editingResume])

  const resumeQuery = useMemo(() => {
    if (!db || !user) return null
    return query(collection(db, collections.RESUMES), where('ownerId', '==', user.uid))
  }, [db, user])

  const { data: rawResumes, loading: resumeLoading } = useCollection(resumeQuery)

  const resumes = useMemo(() => {
    if (!rawResumes) return []
    return [...rawResumes].sort((a: any, b: any) => {
      const getVal = (doc: any) => {
        if (doc.createdAt?.seconds) return doc.createdAt.seconds * 1000;
        return Date.now();
      }
      return getVal(b) - getVal(a);
    })
  }, [rawResumes])

  const handleFinalSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db || isSaving) return
    
    const formData = new FormData(e.currentTarget)
    const baseName = formData.get('name') as string
    setIsSaving(true)

    try {
      if (activeTab === 'PDF') {
        if (!editingResume && pendingFiles.length === 0) throw new Error('Please select a file.');
        if (pendingFiles.length > 0) {
          for (const file of pendingFiles) {
            validateFile(file);
            const uploadResult = await uploadToSupabaseStorage(file, `resumes/${user.uid}`, (p) => setUploadProgress(p));
            const data = {
              name: pendingFiles.length > 1 ? `${baseName} - ${file.name}` : baseName,
              file_name: uploadResult.originalName,
              type: 'file',
              docType: selectedDocType,
              visibility: selectedVisibility,
              isPublic: selectedVisibility === 'Public',
              ownerId: user.uid,
              filePath: uploadResult.storagePath,
              storageProvider: 'Supabase'
            }
            if (editingResume) await updateRecord(db, collections.RESUMES, editingResume.id, data);
            else await createRecord(db, collections.RESUMES, data, user.uid);
          }
        } else if (editingResume) {
          await updateRecord(db, collections.RESUMES, editingResume.id, { name: baseName, docType: selectedDocType, visibility: selectedVisibility, isPublic: selectedVisibility === 'Public' });
        }
      } else {
        const data = { name: baseName, type: 'link', visibility: selectedVisibility, isPublic: selectedVisibility === 'Public', ownerId: user.uid, url: formData.get('url') as string };
        if (editingResume) await updateRecord(db, collections.RESUMES, editingResume.id, data);
        else await createRecord(db, collections.RESUMES, data, user.uid);
      }
      toast({ title: 'Record Saved' });
      setIsDialogOpen(false);
      resetForm();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: err.message });
    } finally {
      setIsSaving(false);
    }
  }

  const handleViewFile = async (resume: any) => {
    if (resume.type === 'link') { window.open(resume.url, '_blank'); return; }
    if (!resume.filePath) { toast({ variant: 'destructive', title: 'Error', description: 'File path missing.' }); return; }
    setViewingId(resume.id);
    try {
      const response = await getSignedUrlAction(resume.filePath);
      if (response.signedUrl) window.open(response.signedUrl, '_blank');
      else throw new Error(response.error || 'Failed to generate link.');
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Access Denied', description: err.message });
    } finally {
      setViewingId(null);
    }
  };

  const resetForm = () => { setEditingResume(null); setPendingFiles([]); setUploadProgress(0); }

  const handleDelete = async (resume: any) => {
    if (!db) return
    await deleteRecord(db, collections.RESUMES, resume.id);
    toast({ title: 'Removed' });
  }

  if (!mounted) return null

  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">📜 Resume & Links Vault</h1>
          <p className="text-muted-foreground">High-performance CV intelligence powered by Supabase Storage.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(o) => { if(!isSaving) setIsDialogOpen(o); if(!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white" onClick={() => setEditingResume(null)}>
              <Plus className="h-4 w-4" /> {activeTab === 'PDF' ? 'Add Resumes & CV\'S' : 'Add Link'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] bg-[#121214] text-white border-none rounded-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
            <DialogHeader className="p-8 pb-4 relative shrink-0 text-left">
              <DialogTitle className="text-3xl font-bold font-headline text-white">{editingResume ? 'Edit Record' : 'Secure Upload'}</DialogTitle>
              <DialogDescription className="text-gray-400">Host your professional records in the cloud vault.</DialogDescription>
              <DialogClose className="absolute right-4 top-4 text-gray-500 hover:text-white transition-colors"><X className="h-5 w-5" /></DialogClose>
            </DialogHeader>

            <form onSubmit={handleFinalSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-6">
                <div className="space-y-2">
                  <Label>Record Name</Label>
                  <Input name="name" required disabled={isSaving} defaultValue={editingResume?.name || ''} className="bg-[#1c1c1f] border-none text-white h-12 rounded-xl" placeholder="e.g. Senior CV" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Document Type</Label>
                    <Select value={selectedDocType} onValueChange={setSelectedDocType} disabled={isSaving}>
                      <SelectTrigger className="bg-[#1c1c1f] border-none h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#1c1c1f] border-gray-800 text-white"><SelectItem value="Resume">Resume</SelectItem><SelectItem value="CV">CV</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Visibility</Label>
                    <Select value={selectedVisibility} onValueChange={setSelectedVisibility} disabled={isSaving}>
                      <SelectTrigger className="bg-[#1c1c1f] border-none h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#1c1c1f] border-gray-800 text-white"><SelectItem value="Private">🔒 Private</SelectItem><SelectItem value="Public">🌍 Public</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>

                {activeTab === 'PDF' ? (
                  <div className="space-y-4">
                    <div className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-800 p-12 bg-[#1c1c1f]/50 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => !isSaving && fileInputRef.current?.click()}>
                      <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" multiple onChange={(e) => setPendingFiles(Array.from(e.target.files || []))} disabled={isSaving} />
                      {pendingFiles.length > 0 ? (
                        <div className="text-primary text-center"><CheckCircle2 className="mx-auto mb-2 h-10 w-10" /><span className="text-sm font-bold">{pendingFiles.length} Selected</span></div>
                      ) : (
                        <div className="text-center"><Upload className="text-gray-500 mx-auto mb-2 h-10 w-10" /><span className="text-xs text-gray-500">{editingResume ? 'Replace File' : 'Select Files (Max 20MB)'}</span></div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Link URL</Label>
                    <Input name="url" required disabled={isSaving} defaultValue={editingResume?.url || ''} className="bg-[#1c1c1f] border-none text-white h-12 rounded-xl" placeholder="https://..." />
                  </div>
                )}
                {isSaving && activeTab === 'PDF' && (
                  <div className="space-y-2"><Progress value={uploadProgress} className="h-1 bg-gray-800" /></div>
                )}
              </div>
              <DialogFooter className="p-8 pt-4 border-t border-white/5 bg-[#121214] shrink-0">
                <Button type="submit" disabled={isSaving} className="w-full bg-primary h-12 rounded-xl font-bold">{isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}{isSaving ? 'Synchronizing...' : 'Save Record'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="PDF" value={activeTab} onValueChange={(val) => { if(!editingResume) setActiveTab(val); }} className="space-y-8">
        <TabsList className="bg-card/30 p-1 rounded-2xl border border-border/50">
          <TabsTrigger value="PDF" className="px-8 py-2.5 rounded-xl font-bold"><FileText className="mr-2 h-4 w-4" /> Resumes & CV'S</TabsTrigger>
          <TabsTrigger value="Link" className="px-8 py-2.5 rounded-xl font-bold"><LinkIcon className="mr-2 h-4 w-4" /> Links</TabsTrigger>
        </TabsList>
        <TabsContent value="PDF" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {resumes.filter(r => r.type === 'file').map(r => <ResumeCard key={r.id} resume={r} onDelete={handleDelete} onEdit={(r) => { setEditingResume(r); setActiveTab('PDF'); setIsDialogOpen(true); }} onView={handleViewFile} viewingId={viewingId} />)}
        </TabsContent>
        <TabsContent value="Link" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {resumes.filter(r => r.type === 'link').map(r => <ResumeCard key={r.id} resume={r} onDelete={handleDelete} onEdit={(r) => { setEditingResume(r); setActiveTab('Link'); setIsDialogOpen(true); }} onView={handleViewFile} viewingId={viewingId} />)}
        </TabsContent>
      </Tabs>
    </CRMLayout>
  )
}

function ResumeCard({ resume, onDelete, onEdit, onView, viewingId }: any) {
  const isLoading = viewingId === resume.id;
  return (
    <Card className="relative group border-none bg-[#0f1115] text-white shadow-xl rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline" className={resume.isPublic ? 'border-green-500/20 text-green-500 bg-green-500/5' : 'border-gray-500/20 text-gray-500 bg-gray-500/5'}>{resume.isPublic ? <Globe className="h-3 w-3 mr-1.5" /> : <Lock className="h-3 w-3 mr-1.5" />}{resume.visibility || (resume.isPublic ? 'Public' : 'Private')}</Badge>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(resume)} className="p-2 text-gray-500 hover:text-primary transition-colors"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => onDelete(resume)} className="p-2 text-gray-500 hover:text-destructive transition-colors"><Trash2 className="h-5 w-5" /></button>
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">{resume.type === 'file' ? <FileText className="h-8 w-8" /> : <Globe className="h-8 w-8" />}</div>
          <div className="space-y-2"><h3 className="text-2xl font-bold truncate leading-tight">{resume.name}</h3><p className="text-[10px] uppercase font-bold text-gray-500 tracking-[0.2em]">{resume.storageProvider || 'CLOUD RECORD'}</p></div>
          <div className="flex gap-2">
            {resume.type === 'file' ? (
              <Button variant="outline" className="w-full bg-white/5 border-none h-12 rounded-xl text-xs font-bold gap-2 hover:bg-white/10" onClick={() => onView(resume)} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />} View Resume
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button variant="outline" className="bg-white/5 border-none h-12 rounded-xl text-xs font-bold gap-2" onClick={() => onEdit(resume)}><Pencil className="h-4 w-4" /> Edit</Button>
                <Button className="bg-primary border-none h-12 rounded-xl text-xs font-bold gap-2" asChild><a href={resume.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /> Visit</a></Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
