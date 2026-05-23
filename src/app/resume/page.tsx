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
  Link as LinkIcon,
  Globe,
  ExternalLink,
  X,
  Lock,
  Files,
  FileCheck
} from 'lucide-react'
import { useFirestore, useCollection, useUser, useStorage } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject, UploadTask } from 'firebase/storage'
import { collections, createRecord, deleteRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

interface PendingResumeUpload {
  file: File;
  progress: number;
  url?: string;
  path?: string;
  done: boolean;
  task?: UploadTask;
}

export default function ResumePage() {
  const db = useFirestore()
  const storage = useStorage()
  const { user } = useUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('PDF')
  
  // High-speed eager uploads
  const [activeUploads, setActiveUploads] = useState<{ [key: string]: PendingResumeUpload }>({})
  
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
        return Date.now();
      }
      return getVal(b) - getVal(a);
    })
  }, [rawResumes])

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length || !user || !storage) return

    files.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) return

      const fileId = `${Date.now()}_${file.name}`
      const path = `resumes/${user.uid}/${fileId}`
      const storageRef = ref(storage, path)
      const uploadTask = uploadBytesResumable(storageRef, file)

      setActiveUploads(prev => ({
        ...prev,
        [file.name]: { file, progress: 0, done: false, path, task: uploadTask }
      }))

      uploadTask.on(
        'state_changed',
        (snap) => {
          const progress = (snap.bytesTransferred / snap.totalBytes) * 100
          setActiveUploads(prev => {
            if (!prev[file.name]) return prev;
            return {
              ...prev,
              [file.name]: { ...prev[file.name], progress }
            };
          })
        },
        console.error,
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref)
          setActiveUploads(prev => {
            if (!prev[file.name]) return prev;
            return {
              ...prev,
              [file.name]: { ...prev[file.name], url, done: true, progress: 100 }
            };
          })
        }
      )
    })
  }

  const handleFinalSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db) return
    
    const formData = new FormData(e.currentTarget)
    const formConfig = {
      name: formData.get('name') as string,
      docType: formData.get('docType') as string || 'Resume',
      visibility: formData.get('visibility') as string || 'Private',
      url: formData.get('url') as string
    }

    const uploadsToProcess = Object.values(activeUploads)

    // INSTANT UI FEEDBACK
    toast({ title: 'Securing in Vault', description: 'Your records are being finalized in the background.' })
    setIsDialogOpen(false)

    if (activeTab === 'PDF') {
      uploadsToProcess.forEach(async (upload) => {
        const finalize = async (url: string, path: string, file: File) => {
          const data: any = {
            name: uploadsToProcess.length > 1 ? `${formConfig.name} - ${file.name}` : formConfig.name,
            type: 'file',
            docType: formConfig.docType,
            visibility: formConfig.visibility,
            isPublic: formConfig.visibility === 'Public',
            ownerId: user.uid,
            fileUrl: url,
            fileName: file.name,
            filePath: path,
            fileSize: file.size,
            fileType: file.type
          }
          console.log(`📡 Finalizing Resume/CV record for: ${file.name}`)
          await createRecord(db, collections.RESUMES, data, user.uid).catch(err => {
            console.error(`❌ Background resume creation failed for ${file.name}:`, err)
          })
          
          setActiveUploads(prev => {
            const next = { ...prev }
            delete next[file.name]
            return next
          })
        }

        try {
          if (upload.done && upload.url && upload.path) {
            await finalize(upload.url, upload.path, upload.file)
          } else if (upload.task) {
            await upload.task;
            const url = await getDownloadURL(upload.task.snapshot.ref);
            await finalize(url, upload.path!, upload.file);
          }
        } catch (err) {
          console.error(`❌ Critical background resume sync error:`, err);
        }
      })
    } else {
      const data: any = {
        name: formConfig.name,
        type: 'link',
        visibility: formConfig.visibility,
        isPublic: formConfig.visibility === 'Public',
        ownerId: user.uid,
        url: formConfig.url
      }
      createRecord(db, collections.RESUMES, data, user.uid).catch(console.error)
    }
  }

  const handleDelete = async (resume: any) => {
    if (!db || !storage) return
    deleteRecord(db, collections.RESUMES, resume.id).catch(console.error)
    if (resume.filePath) {
      deleteObject(ref(storage, resume.filePath)).catch(console.warn)
    }
    toast({ title: 'Removed' })
  }

  const overallProgress = Object.values(activeUploads).length > 0
    ? Object.values(activeUploads).reduce((a, b) => a + b.progress, 0) / Object.values(activeUploads).length
    : 0

  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">📜 Resume & Links Vault</h1>
          <p className="text-muted-foreground">High-speed secure storage for your Resumes, CV'S and Professional Links.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(o) => { setIsDialogOpen(o); if(!o && !Object.values(activeUploads).some(u => !u.done)) setActiveUploads({}); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white">
              <Plus className="h-4 w-4" /> {activeTab === 'PDF' ? 'Upload Resumes & CV\'S' : 'Add Link'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-[#121214] text-white border-none rounded-2xl p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold font-headline">
                {activeTab === 'PDF' ? 'Upload Resumes & CV\'S' : 'Add Link'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Securely store files up to 500MB with instant cloud sync.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleFinalSave} className="space-y-6">
              <div className="space-y-2">
                <Label>Record Name / Folder Label</Label>
                <Input name="name" required className="bg-[#1c1c1f] border-none text-white h-12 rounded-xl" placeholder="e.g. Senior Software Engineer CV" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <Select name="docType" defaultValue="Resume">
                    <SelectTrigger className="bg-[#1c1c1f] border-none h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1c1c1f] border-gray-800 text-white">
                      <SelectItem value="Resume">Resume</SelectItem>
                      <SelectItem value="CV">CV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select name="visibility" defaultValue="Private">
                    <SelectTrigger className="bg-[#1c1c1f] border-none h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1c1c1f] border-gray-800 text-white">
                      <SelectItem value="Private">🔒 Private</SelectItem>
                      <SelectItem value="Public">🌍 Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {activeTab === 'PDF' ? (
                <div 
                  className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-800 p-12 bg-[#1c1c1f]/50 cursor-pointer hover:border-primary/50 transition-colors" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".pdf,.doc,.docx" 
                    multiple 
                    onChange={handleFileSelection} 
                  />
                  {Object.keys(activeUploads).length > 0 ? (
                    <div className="text-primary text-center">
                      <Files className="mx-auto mb-2 h-10 w-10" />
                      <span className="text-sm font-bold">{Object.keys(activeUploads).length} Files Selected</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="text-gray-500 mx-auto mb-2 h-10 w-10" />
                      <span className="text-xs text-gray-500">Select Files (Max 500MB ea.)</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Link URL</Label>
                  <Input name="url" required className="bg-[#1c1c1f] border-none h-12 rounded-xl" placeholder="https://linkedin.com/in/username" />
                </div>
              )}
              
              {activeTab === 'PDF' && Object.keys(activeUploads).length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-primary">
                    <span>Securing Vault...</span>
                    <span>{Math.round(overallProgress)}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-1 bg-gray-800" />
                </div>
              )}

              <DialogFooter>
                <Button type="submit" disabled={loading || (activeTab === 'PDF' && Object.keys(activeUploads).length === 0)} className="w-full bg-primary h-12 rounded-xl font-bold">
                  Secure in Vault
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="PDF" onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-card/30 p-1 rounded-2xl border border-border/50">
          <TabsTrigger value="PDF" className="px-8 py-2.5 rounded-xl font-bold">
            <FileText className="mr-2 h-4 w-4" /> Resumes & CV'S
          </TabsTrigger>
          <TabsTrigger value="Link" className="px-8 py-2.5 rounded-xl font-bold">
            <LinkIcon className="mr-2 h-4 w-4" /> Links
          </TabsTrigger>
        </TabsList>
        <TabsContent value="PDF">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resumes.filter(r => r.type === 'file').map(r => (
              <ResumeCard key={r.id} resume={r} onDelete={handleDelete} onPreview={setPreviewFile} />
            ))}
            {resumes.filter(r => r.type === 'file').length === 0 && !resumeLoading && (
              <div className="col-span-full flex h-64 flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-3xl text-muted-foreground">
                <FileText className="h-10 w-10 opacity-20 mb-4" />
                <p className="italic">Resumes folder is empty.</p>
              </div>
            )}
            {resumeLoading && (
              <div className="col-span-full flex h-64 items-center justify-center">
                <Loader2 className="animate-spin text-primary h-10 w-10" />
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="Link">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resumes.filter(r => r.type === 'link').map(r => (
              <ResumeCard key={r.id} resume={r} onDelete={handleDelete} onPreview={setPreviewFile} />
            ))}
            {resumes.filter(r => r.type === 'link').length === 0 && !resumeLoading && (
              <div className="col-span-full flex h-64 flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-3xl text-muted-foreground">
                <LinkIcon className="h-10 w-10 opacity-20 mb-4" />
                <p className="italic">Links folder is empty.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!previewFile} onOpenChange={(o) => !o && setPreviewFile(null)}>
        <DialogContent className="sm:max-w-[90vw] h-[90vh] p-0 bg-[#0f1115] text-white border-none rounded-2xl overflow-hidden flex flex-col">
          <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#1a1c21]">
            <div className="flex items-center gap-3">
              <FileText className="text-primary h-5 w-5" />
              <DialogTitle className="truncate font-bold text-sm max-w-md">{previewFile?.name}</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setPreviewFile(null)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 bg-black/40">
            {previewFile?.url && (
              <iframe 
                src={previewFile.url} 
                className="w-full h-full border-none" 
                title={previewFile.name} 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </CRMLayout>
  )
}

function ResumeCard({ resume, onDelete, onPreview }: { resume: any, onDelete: any, onPreview: any }) {
  return (
    <Card className="relative group border-none bg-[#0f1115] text-white shadow-xl rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <Badge variant="outline" className={resume.isPublic ? 'border-green-500/20 text-green-500 bg-green-500/5' : 'border-gray-500/20 text-gray-500 bg-gray-500/5'}>
              {resume.isPublic ? <Globe className="h-3 w-3 mr-1.5" /> : <Lock className="h-3 w-3 mr-1.5" />}
              {resume.visibility || (resume.isPublic ? 'Public' : 'Private')}
            </Badge>
            {resume.docType && (
              <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">
                <FileCheck className="h-3 w-3 mr-1.5" />
                {resume.docType}
              </Badge>
            )}
          </div>
          <button onClick={() => onDelete(resume)} className="text-gray-500 hover:text-destructive transition-colors">
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col gap-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
            {resume.type === 'file' ? <FileText className="h-8 w-8" /> : <Globe className="h-8 w-8" />}
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold truncate leading-tight">{resume.name}</h3>
            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-[0.2em]">
              {resume.type === 'file' ? 'PDF DOCUMENT' : 'EXTERNAL LINK'}
            </p>
          </div>
          <div className="flex gap-4">
            {resume.type === 'file' ? (
              <>
                <Button variant="outline" className="flex-1 bg-[#1a1c21] border-none h-12 rounded-xl text-xs font-bold gap-2" onClick={() => onPreview({ url: resume.fileUrl, name: resume.name })}>
                  <Eye className="h-4 w-4" /> View
                </Button>
                <Button className="flex-1 bg-primary border-none h-12 rounded-xl text-xs font-bold gap-2" asChild>
                  <a href={resume.fileUrl} download={resume.fileName} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" /> Get
                  </a>
                </Button>
              </>
            ) : (
              <Button className="w-full bg-primary border-none h-12 rounded-xl text-xs font-bold gap-2" asChild>
                <a href={resume.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" /> Visit Link
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
