
"use client"

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Download, 
  Eye, 
  ExternalLink, 
  Loader2, 
  FileUp, 
  Plus, 
  Trash2, 
  Upload,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, orderBy, where } from 'firebase/firestore'
import { collections, createRecord, deleteRecord, updateRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors'

export default function ResumePage() {
  const db = useFirestore()
  const { user } = useUser()
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileData, setFileData] = useState<string>('')
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

  const handleUploadResume = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db) return

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    // Firestore has a 1MB limit for individual documents. 
    // If the file is larger than 1MB, we store metadata only for the prototype.
    const isTooLargeForFirestore = fileData.length > 1048576; 
    
    const data = {
      name: formData.get('name') as string,
      fileUrl: isTooLargeForFirestore ? '' : fileData,
      fileName: selectedFile?.name || '',
      ownerId: user.uid,
      isMetadataOnly: isTooLargeForFirestore
    }

    // Optimistic UI close
    setIsUploadOpen(false)

    createRecord(db, collections.RESUMES, data, user.uid)
      .then(() => {
        if (isTooLargeForFirestore) {
          toast({ 
            title: 'Metadata Saved', 
            description: 'File exceeds 1MB Firestore limit. Metadata recorded; production apps would use Firebase Storage for 1GB files.' 
          })
        } else {
          toast({ title: 'Resume Uploaded' })
        }
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
    toast({ title: 'Resume Deleted' })
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
          <p className="text-muted-foreground">Manage and store multiple versions of your professional CVs.</p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={(open) => {
          setIsUploadOpen(open);
          if (!open) {
            setSelectedFile(null);
            setFileData('');
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" /> 
              Upload Resume
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-[#121214] text-white border-none rounded-2xl p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold font-headline">Upload Resume PDF</DialogTitle>
              <DialogDescription className="text-gray-400">
                Your file will be safely stored in your cloud vault.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUploadResume} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-white">Document Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="e.g. Senior_Engineer_2024.pdf" 
                  required 
                  className="bg-[#1c1c1f] border-none text-white h-12 px-4 focus:ring-1 focus:ring-primary rounded-xl"
                />
              </div>

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

              <DialogFooter className="pt-4">
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="bg-[#7299f0] hover:bg-[#6387d9] text-white font-bold h-12 px-8 rounded-xl border-none ml-auto"
                >
                  Store in Vault
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resumes && resumes.length > 0 ? (
          resumes.map((resume: any) => (
            <Card key={resume.id} className="group border-none bg-card/50 backdrop-blur-md shadow-md hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                    <FileText className="h-8 w-8" />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive" 
                      onClick={() => handleDelete(resume.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="mt-4 space-y-1">
                  <h3 className="font-headline font-bold text-lg truncate" title={resume.name}>{resume.name}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest pt-1">
                    Uploaded {new Date(resume.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}
                  </p>
                </div>

                <div className="mt-6 flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-[11px] font-bold h-8 gap-2" 
                    disabled={!resume.fileUrl}
                    asChild={!!resume.fileUrl}
                  >
                    {resume.fileUrl ? (
                      <a href={resume.fileUrl} download={resume.fileName || 'resume'}>
                        <Download className="h-3 w-3" /> Download
                      </a>
                    ) : (
                      <span><Download className="h-3 w-3" /> Download</span>
                    )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1 text-[11px] font-bold h-8 gap-2 text-muted-foreground hover:bg-muted"
                  >
                    <Eye className="h-3 w-3" /> View
                  </Button>
                </div>
                
                {resume.isMetadataOnly && (
                  <p className="mt-3 text-[9px] text-yellow-500 font-bold uppercase tracking-widest text-center">
                    Stored as metadata (Exceeds 1MB)
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-card/30 text-muted-foreground italic">
            <FileText className="h-12 w-12 opacity-10 mb-4" />
            No resumes stored in your vault yet.
          </div>
        )}
      </div>
    </CRMLayout>
  )
}
