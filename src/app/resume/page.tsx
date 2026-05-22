"use client"

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Download, 
  Eye, 
  Loader2, 
  Plus, 
  Trash2, 
  Upload,
  CheckCircle2,
  Link as LinkIcon,
  Globe,
  ExternalLink,
  X,
  Lock
} from 'lucide-react'
import { useFirestore, useCollection, useUser, useStorage } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { collections, createRecord, deleteRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors'

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export default function ResumePage() {
  const db = useFirestore()
  const storage = useStorage()
  const { user } = useUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState('PDF')
  const [visibility, setVisibility] = useState<string>("Private")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null)

  useEffect(() => { setMounted(true) }, [])

  const resumeQuery = useMemo(() => {
    if (!db || !user) return null
    return query(collection(db, collections.RESUMES), where('ownerId', '==', user.uid))
  }, [db, user])

  const { data: rawResumes, loading: resumeLoading } = useCollection(resumeQuery)

  const resumes = useMemo(() => {
    if (!rawResumes) return []
    return [...rawResumes].sort((a: any, b: any) => {
      const getVal = (doc: any) => {
        if (doc.updatedAt?.toMillis) return doc.updatedAt.toMillis();
        if (doc.updatedAt?.seconds) return doc.updatedAt.seconds * 1000;
        return Date.now() + 10000;
      }
      return getVal(b) - getVal(a);
    })
  }, [rawResumes])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      toast({ variant: 'destructive', title: 'File Too Large', description: 'Max 500MB allowed.' })
      return
    }
    setSelectedFile(file)
  }

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db || !storage) return
    setLoading(true)
    setUploadProgress(0)

    const formData = new FormData(e.currentTarget)
    const type = activeTab === 'PDF' ? 'file' : 'link'
    const name = formData.get('name') as string

    try {
      let fileUrl = ''
      let fileName = 'resume.pdf'
      let filePath = ''

      if (type === 'file') {
        if (!selectedFile) { setLoading(false); return; }
        const path = `resumes/${user.uid}/${Date.now()}_${selectedFile.name}`
        const storageRef = ref(storage, path)
        const uploadTask = uploadBytesResumable(storageRef, selectedFile)

        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              setUploadProgress(progress)
            },
            (error) => reject(error),
            () => resolve(null)
          )
        })
        
        fileUrl = await getDownloadURL(uploadTask.snapshot.ref)
        fileName = selectedFile.name
        filePath = path
      }

      const data: any = {
        name,
        type,
        visibility,
        isPublic: visibility === 'Public',
        ownerId: user.uid,
        fileUrl: type === 'file' ? fileUrl : null,
        fileName: type === 'file' ? fileName : null,
        filePath: type === 'file' ? filePath : null,
        url: type === 'link' ? formData.get('url') as string : null
      }

      const mutation = createRecord(db, collections.RESUMES, data, user.uid)
      toast({ title: 'Resume Stored' })
      setIsDialogOpen(false)
      setSelectedFile(null)

      mutation.catch(async (err: any) => {
        const permissionError = new FirestorePermissionError({
          path: collections.RESUMES,
          operation: 'create',
          requestResourceData: data,
          originalError: err
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (resume: any) => {
    if (!db || !storage) return
    deleteRecord(db, collections.RESUMES, resume.id).catch(console.error)
    if (resume.filePath) {
      const storageRef = ref(storage, resume.filePath)
      deleteObject(storageRef).catch(console.warn)
    }
    toast({ title: 'Removed' })
  }

  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="font-headline text-4xl font-bold tracking-tight">📜 Resume Vault</h1><p className="text-muted-foreground">Manage your CVs and live links (Max 500MB).</p></div>
        <Dialog open={isDialogOpen} onOpenChange={(o) => setIsDialogOpen(o)}><DialogTrigger asChild><Button className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white"><Plus className="h-4 w-4" /> {activeTab === 'PDF' ? 'Upload Resume' : 'Add Link'}</Button></DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-[#121214] text-white border-none rounded-2xl p-8">
            <DialogHeader className="mb-6"><DialogTitle className="text-2xl font-bold font-headline">{activeTab === 'PDF' ? 'Upload PDF' : 'Add CV Link'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2"><Label>Document Name</Label><Input id="name" name="name" required className="bg-[#1c1c1f] border-none text-white h-12 rounded-xl" /></div>
              <div className="space-y-2"><Label>Visibility (Mandatory)</Label><Select value={visibility} onValueChange={setVisibility}><SelectTrigger className="bg-[#1c1c1f] border-none h-12 rounded-xl"><SelectValue /></SelectTrigger><SelectContent className="bg-[#1c1c1f] border-gray-800 text-white"><SelectItem value="Private">🔒 Private (Vault Only)</SelectItem><SelectItem value="Public">🌍 Public (Shared on Hub)</SelectItem></SelectContent></Select></div>
              {activeTab === 'PDF' ? (
                <div className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-800 p-12 bg-[#1c1c1f]/50 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileChange} />
                  {selectedFile ? <div className="text-primary text-center"><CheckCircle2 className="mx-auto mb-2" /> {selectedFile.name}</div> : <Upload className="text-gray-500" />}
                </div>
              ) : (
                <div className="space-y-2"><Label>URL</Label><Input name="url" required className="bg-[#1c1c1f] border-none h-12 rounded-xl" /></div>
              )}
              
              {loading && activeTab === 'PDF' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-primary">
                    <span>Uploading...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-1 bg-gray-800" />
                </div>
              )}

              <DialogFooter><Button type="submit" disabled={loading} className="bg-primary h-12 px-8 rounded-xl">{loading ? <Loader2 className="animate-spin" /> : 'Save Record'}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="PDF" onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-card/30 p-1 rounded-2xl border border-border/50"><TabsTrigger value="PDF" className="px-8 py-2.5 rounded-xl font-bold"><FileText className="mr-2 h-4 w-4" /> PDF Vault</TabsTrigger><TabsTrigger value="Link" className="px-8 py-2.5 rounded-xl font-bold"><LinkIcon className="mr-2 h-4 w-4" /> CV Links</TabsTrigger></TabsList>
        <TabsContent value="PDF"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{resumes.filter(r => r.type === 'file').map(r => <ResumeCard key={r.id} resume={r} onDelete={handleDelete} onPreview={setPreviewFile} />)}</div></TabsContent>
        <TabsContent value="Link"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{resumes.filter(r => r.type === 'link').map(r => <ResumeCard key={r.id} resume={r} onDelete={handleDelete} onPreview={setPreviewFile} />)}</div></TabsContent>
      </Tabs>

      <Dialog open={!!previewFile} onOpenChange={(o) => !o && setPreviewFile(null)}><DialogContent className="sm:max-w-[90vw] h-[90vh] p-0 bg-[#0f1115] text-white border-none rounded-2xl overflow-hidden flex flex-col"><div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#1a1c21]"><div className="flex items-center gap-3"><FileText className="text-primary" /><DialogTitle className="truncate">{previewFile?.name}</DialogTitle></div><Button variant="ghost" onClick={() => setPreviewFile(null)}><X /></Button></div><div className="flex-1">{previewFile?.url && <iframe src={previewFile.url} className="w-full h-full border-none" />}</div></DialogContent></Dialog>
    </CRMLayout>
  )
}

function ResumeCard({ resume, onDelete, onPreview }: { resume: any, onDelete: any, onPreview: any }) {
  return (
    <Card className="relative group border-none bg-[#0f1115] text-white shadow-xl rounded-3xl overflow-hidden">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-4"><Badge variant="outline" className={resume.isPublic ? 'border-green-500/20 text-green-500' : 'border-gray-500/20 text-gray-500'}>{resume.isPublic ? <Globe className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}{resume.visibility || (resume.isPublic ? 'Public' : 'Private')}</Badge><button onClick={() => onDelete(resume)} className="text-gray-500 hover:text-destructive"><Trash2 className="h-5 w-5" /></button></div>
        <div className="flex flex-col gap-6"><div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">{resume.type === 'file' ? <FileText className="text-primary" /> : <Globe className="text-primary" />}</div><div className="space-y-2"><h3 className="text-2xl font-bold truncate">{resume.name}</h3><p className="text-[10px] uppercase font-bold text-gray-500">{resume.type === 'file' ? 'PDF DOCUMENT' : 'EXTERNAL LINK'}</p></div><div className="flex gap-4">{resume.type === 'file' ? <><Button variant="outline" className="flex-1 bg-[#1a1c21] border-none h-12 rounded-xl" onClick={() => onPreview({ url: resume.fileUrl, name: resume.name })}><Eye className="mr-2 h-4 w-4" /> View</Button><Button className="flex-1 bg-primary border-none h-12 rounded-xl" asChild><a href={resume.fileUrl} download={resume.fileName} target="_blank" rel="noopener noreferrer"><Download className="mr-2 h-4 w-4" /> Get</a></Button></> : <Button className="w-full bg-primary h-12 rounded-xl" asChild><a href={resume.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Visit CV</a></Button>}</div></div>
      </CardContent>
    </Card>
  )
}
