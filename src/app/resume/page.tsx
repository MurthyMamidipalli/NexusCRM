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
  X
} from 'lucide-react'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import { collections, createRecord, deleteRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors'
import { format } from 'date-fns'

const MAX_FIRESTORE_SIZE = 1048576; // 1MB

export default function ResumePage() {
  const db = useFirestore()
  const { user } = useUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileData, setFileData] = useState<string>('')
  const [activeTab, setActiveTab] = useState('PDF')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Preview State
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const resumeQuery = useMemo(() => {
    if (!db || !user) return null
    return query(
      collection(db, collections.RESUMES), 
      where('ownerId', '==', user.uid)
    )
  }, [db, user])

  const { data: rawResumes, loading: resumeLoading } = useCollection(resumeQuery)

  // In-memory sorting for index resilience
  const resumes = useMemo(() => {
    if (!rawResumes) return []
    return [...rawResumes].sort((a: any, b: any) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    })
  }, [rawResumes])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FIRESTORE_SIZE) {
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: 'Direct database storage is limited to 1MB. Please use a smaller file or a link.'
      })
      return
    }

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setFileData(reader.result as string)
      toast({ title: 'File Ready', description: `${file.name} attached.` })
    }
    reader.readAsDataURL(file)
  }

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db) return

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const type = activeTab === 'PDF' ? 'file' : 'link'
    
    const data: any = {
      name: formData.get('name') as string,
      type: type,
      ownerId: user.uid,
    }

    if (type === 'file') {
      if (!fileData) {
        toast({ variant: 'destructive', title: 'Upload Missing', description: 'Please select a PDF file.' });
        setLoading(false);
        return;
      }
      data.fileUrl = fileData;
      data.fileName = selectedFile?.name || 'resume.pdf';
    } else {
      data.url = formData.get('url') as string;
    }

    createRecord(db, collections.RESUMES, data, user.uid)
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: collections.RESUMES,
          operation: 'create',
          requestResourceData: data,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });

    toast({ 
      title: type === 'file' ? 'Resume Storing' : 'Link Added', 
      description: 'Synchronizing with your cloud vault...' 
    });
    
    setIsDialogOpen(false);
    setSelectedFile(null);
    setFileData('');
    setLoading(false);
  }

  const handleDelete = (id: string) => {
    if (!db) return
    deleteRecord(db, collections.RESUMES, id)
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: `${collections.RESUMES}/${id}`,
          operation: 'delete',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
    toast({ title: 'Record Removed' })
  }

  if (!mounted || resumeLoading) {
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
          <h1 className="font-headline text-4xl font-bold tracking-tight">📜 Resume Vault</h1>
          <p className="text-muted-foreground">Manage your CVs and live professional links.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setSelectedFile(null);
            setFileData('');
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white">
              <Plus className="h-4 w-4" /> 
              {activeTab === 'PDF' ? 'Upload Resume' : 'Add CV Link'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-[#121214] text-white border-none rounded-2xl p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold font-headline">
                {activeTab === 'PDF' ? 'Upload Resume PDF' : 'Add Resume Link'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {activeTab === 'PDF' ? 'Files under 1MB for database sync.' : 'Add a link to your online portfolio.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-white">Document Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  placeholder={activeTab === 'PDF' ? "e.g. Senior_Engineer_2024.pdf" : "e.g. My Live Portfolio"} 
                  required 
                  className="bg-[#1c1c1f] border-none text-white h-12 px-4 focus:ring-1 focus:ring-primary rounded-xl"
                />
              </div>

              {activeTab === 'PDF' ? (
                <div className="space-y-2">
                  <div 
                    className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-800 p-12 transition-all hover:border-primary/50 cursor-pointer bg-[#1c1c1f]/50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileChange} />
                    {selectedFile ? (
                      <div className="flex flex-col items-center">
                        <CheckCircle2 className="h-10 w-10 text-primary mb-2" />
                        <span className="text-sm font-bold text-white line-clamp-1">{selectedFile.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-10 w-10 text-gray-500 group-hover:text-primary transition-colors mb-2" />
                        <span className="text-sm font-semibold text-gray-400">Select PDF</span>
                        <span className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">Max 1MB</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-sm font-semibold text-white">External URL</Label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input 
                      id="url" 
                      name="url" 
                      placeholder="https://..." 
                      required 
                      className="bg-[#1c1c1f] border-none text-white h-12 pl-12 focus:ring-1 focus:ring-primary rounded-xl"
                    />
                  </div>
                </div>
              )}

              <DialogFooter className="pt-4">
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="bg-primary hover:bg-primary/90 text-white font-bold h-12 px-8 rounded-xl border-none ml-auto"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Record'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="PDF" onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-card/30 p-1 flex h-auto w-fit rounded-2xl border border-border/50">
          <TabsTrigger value="PDF" className="gap-2 px-8 py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-sm">
            <FileText className="h-4 w-4" /> PDF Vault
          </TabsTrigger>
          <TabsTrigger value="Link" className="gap-2 px-8 py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-sm">
            <LinkIcon className="h-4 w-4" /> CV Links
          </TabsTrigger>
        </TabsList>

        <TabsContent value="PDF" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resumes.filter((r: any) => r.type === 'file').map((resume: any) => (
              <Card key={resume.id} className="relative group border-none bg-[#0f1115] text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden">
                <CardContent className="p-8">
                  <button 
                    className="absolute top-6 right-6 p-2 rounded-full text-gray-500 hover:text-destructive transition-colors"
                    onClick={() => handleDelete(resume.id)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                  <div className="flex flex-col gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold tracking-tight truncate" title={resume.name}>{resume.name}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                        {resume.createdAt ? format(new Date(resume.createdAt.seconds * 1000), 'M/d/yyyy') : 'Pending'}
                      </p>
                    </div>
                    <div className="flex gap-4 mt-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 bg-[#1a1c21] border-none text-white font-bold h-12 gap-3 hover:bg-white/10 rounded-xl"
                        onClick={() => setPreviewFile({ url: resume.fileUrl, name: resume.name })}
                      >
                        <Eye className="h-4 w-4" /> View
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 bg-primary border-none text-white font-bold h-12 gap-3 hover:bg-primary/90 rounded-xl" 
                        asChild
                      >
                        <a href={resume.fileUrl} download={resume.fileName || 'resume.pdf'}><Download className="h-4 w-4" /> Download</a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="Link" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resumes.filter((r: any) => r.type === 'link').map((resume: any) => (
              <Card key={resume.id} className="relative group border-none bg-[#0f1115] text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden">
                <CardContent className="p-8">
                  <button 
                    className="absolute top-6 right-6 p-2 rounded-full text-gray-500 hover:text-destructive transition-colors"
                    onClick={() => handleDelete(resume.id)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                  <div className="flex flex-col gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                      <Globe className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold tracking-tight truncate" title={resume.name}>{resume.name}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">EXTERNAL LINK</p>
                    </div>
                    <Button variant="outline" className="w-full bg-primary border-none text-white font-bold h-12 gap-3 hover:bg-primary/90 rounded-xl" asChild>
                      <a href={resume.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /> Visit CV</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Professional File Previewer Dialog */}
      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="sm:max-w-[90vw] h-[90vh] p-0 bg-[#0f1115] text-white border-none rounded-2xl overflow-hidden flex flex-col">
          <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#1a1c21]">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <DialogTitle className="font-bold text-sm truncate max-w-[200px] md:max-w-md">
                {previewFile?.name || 'Resume Preview'}
              </DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setPreviewFile(null)} className="h-8 w-8 hover:bg-white/5">
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
          <div className="h-14 border-t border-white/5 flex items-center justify-center bg-[#1a1c21]">
            <Button variant="link" className="text-primary font-bold" asChild>
              <a href={previewFile?.url} download={previewFile?.name}>Download to Device</a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </CRMLayout>
  )
}
