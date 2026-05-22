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
  Lock,
  Files,
  FileCheck
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
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [mounted, setMounted] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [activeTab, setActiveTab] = useState('PDF')
  const [visibility, setVisibility] = useState<string>("Private")
  const [docType, setDocType] = useState<string>("Resume")
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
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        console.warn(`File ${file.name} ignored: exceeds 500MB limit.`)
        return false
      }
      return true
    })
    setSelectedFiles(validFiles)
  }

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db || !storage) return
    
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const type = activeTab === 'PDF' ? 'file' : 'link'
    const baseName = formData.get('name') as string

    try {
      if (type === 'file') {
        if (selectedFiles.length === 0) { setLoading(false); return; }
        
        for (const file of selectedFiles) {
          const fileId = `${Date.now()}_${file.name}`
          const path = `resumes/${user.uid}/${fileId}`
          const storageRef = ref(storage, path)
          const uploadTask = uploadBytesResumable(storageRef, file)

          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              setUploadProgress(prev => ({ ...prev, [file.name]: progress }))
            },
            (error) => {
              console.error(`Upload failed for ${file.name}:`, error)
            },
            async () => {
              const fileUrl = await getDownloadURL(uploadTask.snapshot.ref)
              const data: any = {
                name: selectedFiles.length > 1 ? `${baseName} - ${file.name}` : baseName,
                type: 'file',
                docType: docType, // Added document sub-type (Resume/CV)
                visibility,
                isPublic: visibility === 'Public',
                ownerId: user.uid,
                fileUrl,
                fileName: file.name,
                filePath: path,
                fileSize: file.size,
                fileType: file.type,
                url: null
              }

              createRecord(db, collections.RESUMES, data, user.uid).catch(err => {
                const permissionError = new FirestorePermissionError({
                  path: collections.RESUMES,
                  operation: 'create',
                  requestResourceData: data,
                  originalError: err
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
              })
            }
          )
        }
      } else {
        const data: any = {
          name: baseName,
          type: 'link',
          visibility,
          isPublic: visibility === 'Public',
          ownerId: user.uid,
          fileUrl: null,
          fileName: null,
          filePath: null,
          url: formData.get('url') as string
        }

        createRecord(db, collections.RESUMES, data, user.uid)
      }

      toast({ title: 'Syncing to Vault', description: 'Your records are being secured in the background.' })
      setIsDialogOpen(false)
      setSelectedFiles([])
      setUploadProgress({})
    } catch (err: any) {
      console.error('Vault process failed:', err)
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

  const totalProgress = Object.values(uploadProgress).reduce((acc, curr) => acc + curr, 0) / (selectedFiles.length || 1)

  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">📜 Resume & Links Vault</h1>
          <p className="text-muted-foreground">Manage your Resumes & CV'S and Links in a secure environment.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(o) => setIsDialogOpen(o)}>
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
                Securely store files up to 500MB.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <Label>Record Name / Folder Label</Label>
                <Input id="name" name="name" required className="bg-[#1c1c1f] border-none text-white h-12 rounded-xl" placeholder="e.g. Senior Software Engineer CV" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <Select value={docType} onValueChange={setDocType}>
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
                  <Select value={visibility} onValueChange={setVisibility}>
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
                  onClick={() => !loading && fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".pdf,.doc,.docx" 
                    multiple 
                    onChange={handleFileChange} 
                  />
                  {selectedFiles.length > 0 ? (
                    <div className="text-primary text-center">
                      <Files className="mx-auto mb-2 h-10 w-10" />
                      <span className="text-xs font-bold">{selectedFiles.length} Files Selected</span>
                      <p className="text-[10px] text-muted-foreground mt-1 truncate max-w-[200px]">
                        {selectedFiles.map(f => f.name).join(', ')}
                      </p>
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
              
              {loading && activeTab === 'PDF' && selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-primary">
                    <span>Securing Vault...</span>
                    <span>{Math.round(totalProgress)}%</span>
                  </div>
                  <Progress value={totalProgress} className="h-1 bg-gray-800" />
                </div>
              )}

              <DialogFooter>
                <Button type="submit" disabled={loading} className="w-full bg-primary h-12 rounded-xl font-bold">
                  {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : 'Secure in Vault'}
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
            {resumes.filter(r => r.type === 'file').length === 0 && (
              <div className="col-span-full flex h-64 flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-3xl text-muted-foreground">
                <FileText className="h-10 w-10 opacity-20 mb-4" />
                <p className="italic">Resumes folder is empty.</p>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="Link">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resumes.filter(r => r.type === 'link').map(r => (
              <ResumeCard key={r.id} resume={r} onDelete={handleDelete} onPreview={setPreviewFile} />
            ))}
            {resumes.filter(r => r.type === 'link').length === 0 && (
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
