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
  Files,
  FileCheck,
  CloudOff,
  AlertCircle
} from 'lucide-react'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import { collections, createRecord, deleteRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ResumePage() {
  const db = useFirestore()
  const { user } = useUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('PDF')
  
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedDocType, setSelectedDocType] = useState<string>("Resume")
  const [selectedVisibility, setSelectedVisibility] = useState<string>("Private")

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
        if (!doc.createdAt) return Date.now();
        if (typeof doc.createdAt.toMillis === 'function') return doc.createdAt.toMillis();
        if (doc.createdAt.seconds) return doc.createdAt.seconds * 1000;
        return Date.now();
      }
      return getVal(b) - getVal(a);
    })
  }, [rawResumes])

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setPendingFiles(prev => [...prev, ...files])
  }

  const handleFinalSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db || isSaving) return
    
    const formData = new FormData(e.currentTarget)
    const baseName = formData.get('name') as string
    const uid = user.uid

    setIsSaving(true)

    try {
      if (activeTab === 'PDF') {
        for (const file of pendingFiles) {
          const data: any = {
            name: pendingFiles.length > 1 ? `${baseName} - ${file.name}` : baseName,
            type: 'file',
            docType: selectedDocType,
            visibility: selectedVisibility,
            isPublic: selectedVisibility === 'Public',
            ownerId: uid,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            storageStatus: 'Metadata Only'
          }
          await createRecord(db, collections.RESUMES, data, uid)
        }
      } else {
        const data: any = {
          name: baseName,
          type: 'link',
          visibility: selectedVisibility,
          isPublic: selectedVisibility === 'Public',
          ownerId: uid,
          url: formData.get('url') as string
        }
        await createRecord(db, collections.RESUMES, data, uid)
      }

      toast({ title: 'Record Saved', description: 'Your intelligence vault has been updated.' })
      setIsDialogOpen(false)
      setPendingFiles([])
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (resume: any) => {
    if (!db) return
    await deleteRecord(db, collections.RESUMES, resume.id)
    toast({ title: 'Removed' })
  }

  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">📜 Resume & Links Vault</h1>
          <p className="text-muted-foreground">Secure metadata-only tracking for your Resumes, CV'S and Links.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(o) => { if(!isSaving) setIsDialogOpen(o); if(!o) setPendingFiles([]); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white">
              <Plus className="h-4 w-4" /> {activeTab === 'PDF' ? 'Add Resumes & CV\'S' : 'Add Link'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-[#121214] text-white border-none rounded-2xl p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold font-headline">
                {activeTab === 'PDF' ? 'Secure Metadata' : 'Add Link'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Record document information. Note: Binary storage is disabled.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleFinalSave} className="space-y-6">
              {activeTab === 'PDF' && (
                <Alert variant="default" className="bg-orange-500/10 border-orange-500/20 text-orange-400">
                  <CloudOff className="h-4 w-4" />
                  <AlertDescription className="text-[10px] font-bold uppercase tracking-tight ml-2">
                    File storage requires Firebase Storage to be enabled.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Record Name / Folder Label</Label>
                <Input name="name" required disabled={isSaving} className="bg-[#1c1c1f] border-none text-white h-12 rounded-xl" placeholder="e.g. Senior Software Engineer CV" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <Select value={selectedDocType} onValueChange={setSelectedDocType} disabled={isSaving}>
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
                  <Select value={selectedVisibility} onValueChange={setSelectedVisibility} disabled={isSaving}>
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
                  onClick={() => !isSaving && fileInputRef.current?.click()}
                >
                  <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx" multiple onChange={handleFileSelection} disabled={isSaving} />
                  {pendingFiles.length > 0 ? (
                    <div className="text-primary text-center">
                      <Files className="mx-auto mb-2 h-10 w-10" />
                      <span className="text-sm font-bold">{pendingFiles.length} Records Identified</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="text-gray-500 mx-auto mb-2 h-10 w-10" />
                      <span className="text-xs text-gray-500">Select Files for Metadata</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Link URL</Label>
                  <Input name="url" required disabled={isSaving} className="bg-[#1c1c1f] border-none text-white h-12 rounded-xl" placeholder="https://linkedin.com/in/username" />
                </div>
              )}
              
              <DialogFooter>
                <Button type="submit" disabled={isSaving || (activeTab === 'PDF' && pendingFiles.length === 0)} className="w-full bg-primary h-12 rounded-xl font-bold">
                  {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                  {isSaving ? 'Saving...' : 'Secure in Vault'}
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
              <ResumeCard key={r.id} resume={r} onDelete={handleDelete} />
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
              <ResumeCard key={r.id} resume={r} onDelete={handleDelete} />
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
    </CRMLayout>
  )
}

function ResumeCard({ resume, onDelete }: { resume: any, onDelete: any }) {
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
              {resume.type === 'file' ? 'METADATA RECORD' : 'EXTERNAL LINK'}
            </p>
          </div>
          
          {resume.type === 'file' ? (
            <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-center gap-2 text-orange-400">
              <AlertCircle className="h-3 w-3" />
              <span className="text-[9px] font-bold uppercase tracking-tight leading-tight">File storage requires Firebase Storage.</span>
            </div>
          ) : (
            <Button className="w-full bg-primary border-none h-12 rounded-xl text-xs font-bold gap-2" asChild>
              <a href={resume.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" /> Visit Link
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
