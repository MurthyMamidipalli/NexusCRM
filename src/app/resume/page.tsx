
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
  ExternalLink
} from 'lucide-react'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, orderBy, where } from 'firebase/firestore'
import { collections, createRecord, deleteRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors'
import { format } from 'date-fns'

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

  useEffect(() => {
    setMounted(true)
  }, [])

  const resumeQuery = useMemo(() => {
    if (!db || !user) return null
    return query(
      collection(db, collections.RESUMES), 
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
  }, [db, user])

  const { data: resumes, loading: resumeLoading } = useCollection(resumeQuery)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSize = 1024 * 1024 * 1024 // 1GB
    if (file.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: 'Document must be less than 1GB.'
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
    
    let data: any = {
      name: formData.get('name') as string,
      type: type,
      ownerId: user.uid,
    }

    if (type === 'file') {
      const isTooLargeForFirestore = fileData.length > 1048576; 
      data = {
        ...data,
        fileUrl: isTooLargeForFirestore ? '' : fileData,
        fileName: selectedFile?.name || '',
        isMetadataOnly: isTooLargeForFirestore
      }
    } else {
      data = {
        ...data,
        url: formData.get('url') as string
      }
    }

    // Optimistic UI close
    setIsDialogOpen(false)

    createRecord(db, collections.RESUMES, data, user.uid)
      .then(() => {
        toast({ title: type === 'file' ? 'Resume Uploaded' : 'Link Added' })
      })
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: collections.RESUMES,
          operation: 'create',
          requestResourceData: data,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setLoading(false)
        setSelectedFile(null)
        setFileData('')
      })
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

  const filteredItems = (type: string) => {
    if (!resumes) return []
    return resumes.filter((r: any) => (r.type || 'file') === type)
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
          <p className="text-muted-foreground">Manage multiple versions of your CVs and live professional links.</p>
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
                {activeTab === 'PDF' ? 'Your file will be safely stored in your cloud vault.' : 'Add a link to your online portfolio or CV builder.'}
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
                  className="bg-[#7299f0] hover:bg-[#6387d9] text-white font-bold h-12 px-8 rounded-xl border-none ml-auto"
                >
                  {activeTab === 'PDF' ? 'Store in Vault' : 'Save Link'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="PDF" onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-card/30 p-1 flex h-auto w-fit rounded-2xl border border-border/50">
          <TabsTrigger 
            value="PDF" 
            className="gap-2 px-8 py-2.5 rounded-xl data-[state=active]:bg-[#7299f0] data-[state=active]:text-white transition-all font-bold text-sm"
          >
            <FileText className="h-4 w-4" /> PDF Vault
          </TabsTrigger>
          <TabsTrigger 
            value="Link" 
            className="gap-2 px-8 py-2.5 rounded-xl data-[state=active]:bg-[#7299f0] data-[state=active]:text-white transition-all font-bold text-sm"
          >
            <LinkIcon className="h-4 w-4" /> CV Links
          </TabsTrigger>
        </TabsList>

        <TabsContent value="PDF" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems('file').length > 0 ? (
              filteredItems('file').map((resume: any) => (
                <Card key={resume.id} className="relative group border-none bg-[#0f1115] text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden">
                  <CardContent className="p-8">
                    <button 
                      className="absolute top-6 right-6 p-2 rounded-full text-gray-500 hover:text-destructive hover:bg-destructive/10 transition-colors"
                      onClick={() => handleDelete(resume.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>

                    <div className="flex flex-col gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                        <FileText className="h-8 w-8 text-primary" />
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold tracking-tight truncate" title={resume.name}>
                          {resume.name}
                        </h3>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                          UPLOADED {resume.createdAt ? format(new Date(resume.createdAt.seconds * 1000), 'M/d/yyyy') : format(new Date(), 'M/d/yyyy')}
                        </p>
                      </div>

                      <div className="flex gap-4 mt-2">
                        <Button 
                          variant="outline" 
                          className="flex-1 bg-[#1a1c21] border-none text-white font-bold h-12 gap-3 hover:bg-white/10 rounded-xl"
                          disabled={!resume.fileUrl}
                          asChild={!!resume.fileUrl}
                        >
                          {resume.fileUrl ? (
                            <a href={resume.fileUrl} download={resume.fileName || 'resume'}>
                              <Download className="h-4 w-4" /> Download
                            </a>
                          ) : (
                            <span><Download className="h-4 w-4" /> Download</span>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1 bg-[#1a1c21] border-none text-white font-bold h-12 gap-3 hover:bg-white/10 rounded-xl"
                          disabled={!resume.fileUrl}
                          asChild={!!resume.fileUrl}
                        >
                          {resume.fileUrl ? (
                            <a href={resume.fileUrl} target="_blank">
                              <Eye className="h-4 w-4" /> View
                            </a>
                          ) : (
                            <span><Eye className="h-4 w-4" /> View</span>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <EmptyState icon={FileText} message="No resumes stored in your vault yet." />
            )}
          </div>
        </TabsContent>

        <TabsContent value="Link" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems('link').length > 0 ? (
              filteredItems('link').map((resume: any) => (
                <Card key={resume.id} className="relative group border-none bg-[#0f1115] text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden">
                  <CardContent className="p-8">
                    <button 
                      className="absolute top-6 right-6 p-2 rounded-full text-gray-500 hover:text-destructive hover:bg-destructive/10 transition-colors"
                      onClick={() => handleDelete(resume.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>

                    <div className="flex flex-col gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-[#7299f0]/20 flex items-center justify-center">
                        <Globe className="h-8 w-8 text-[#7299f0]" />
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold tracking-tight truncate" title={resume.name}>
                          {resume.name}
                        </h3>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                          LINKED {resume.createdAt ? format(new Date(resume.createdAt.seconds * 1000), 'M/d/yyyy') : format(new Date(), 'M/d/yyyy')}
                        </p>
                      </div>

                      <div className="mt-2">
                        <Button 
                          variant="outline" 
                          className="w-full bg-[#1a1c21] border-none text-white font-bold h-12 gap-3 hover:bg-[#7299f0] rounded-xl transition-all" 
                          asChild
                        >
                          <a href={resume.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" /> Visit Live CV
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <EmptyState icon={LinkIcon} message="No professional links added yet." />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </CRMLayout>
  )
}

function EmptyState({ icon: Icon, message }: { icon: any, message: string }) {
  return (
    <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-card/10 text-muted-foreground italic">
      <Icon className="h-12 w-12 opacity-10 mb-4" />
      {message}
    </div>
  )
}
