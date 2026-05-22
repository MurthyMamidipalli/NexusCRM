
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
  AlertCircle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, orderBy, limit, where } from 'firebase/firestore'
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
      collection(db, 'resumes'), 
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc'), 
      limit(1)
    )
  }, [db, user])

  const { data: resumes, loading: resumeLoading } = useCollection(resumeQuery)
  const activeResume = resumes?.[0]

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
    const data = {
      name: formData.get('name') as string,
      version: (formData.get('version') as string) || '1.0',
      fileUrl: fileData || activeResume?.fileUrl || '',
      fileName: selectedFile?.name || activeResume?.fileName || '',
      ownerId: user.uid
    }

    // Optimistic close
    setIsUploadOpen(false)

    const mutation = activeResume 
      ? updateRecord(db, 'resumes', activeResume.id, data)
      : createRecord(db, 'resumes', data, user.uid)

    mutation
      .then(() => {
        toast({ title: activeResume ? 'Resume Updated' : 'Resume Uploaded' })
      })
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: activeResume ? `resumes/${activeResume.id}` : 'resumes',
          operation: activeResume ? 'update' : 'create',
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
    deleteRecord(db, 'resumes', id)
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: `resumes/${id}`,
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
          <h1 className="font-headline text-4xl font-bold tracking-tight">📜 Resume / CV</h1>
          <p className="text-muted-foreground">Manage and share your master professional document.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" disabled={!activeResume}>
            <Eye className="h-4 w-4" /> Preview
          </Button>
          <Dialog open={isUploadOpen} onOpenChange={(open) => {
            setIsUploadOpen(open);
            if (!open) {
              setSelectedFile(null);
              setFileData('');
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/20">
                <FileUp className="h-4 w-4" /> 
                {activeResume ? 'Update CV' : 'Upload CV'}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Record New Resume Version</DialogTitle>
                <DialogDescription>
                  Upload your CV (Max 1GB). Metadata and file will be stored in your secure vault.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUploadResume} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input id="name" name="name" defaultValue={activeResume?.name || ''} placeholder="John_Doe_CV_2024.pdf" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="version">Version Tag</Label>
                  <Input id="version" name="version" defaultValue={activeResume?.version || ''} placeholder="e.g. v2.4" />
                </div>

                <div className="space-y-2">
                  <Label>Document Upload (Max 1GB)</Label>
                  <div 
                    className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-8 transition-all hover:border-primary/50 cursor-pointer bg-muted/30"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                    {selectedFile || activeResume?.fileName ? (
                      <div className="flex flex-col items-center">
                        <CheckCircle2 className="h-10 w-10 text-primary mb-2" />
                        <span className="text-sm font-bold text-foreground line-clamp-1 text-center px-2">
                          {selectedFile?.name || activeResume?.fileName}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">
                          Click to Replace
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                        <span className="text-sm font-semibold">Click to upload CV</span>
                        <span className="text-[10px] text-muted-foreground mt-1 text-center">PDF, JPG, PNG up to 1GB</span>
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Version
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none bg-card/50 backdrop-blur-md min-h-[600px] flex items-center justify-center relative overflow-hidden">
             {activeResume ? (
               <div className="text-center space-y-6 p-8 relative z-10 animate-in fade-in zoom-in duration-500">
                 <div className="p-8 rounded-3xl bg-primary/10 mx-auto w-fit shadow-inner">
                   <FileText className="h-24 w-24 text-primary" />
                 </div>
                 <div className="space-y-2">
                   <h3 className="text-3xl font-bold font-headline">{activeResume.name}</h3>
                   <div className="flex flex-wrap justify-center items-center gap-3">
                     <Badge variant="secondary" className="px-3">Version {activeResume.version}</Badge>
                     <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                       Recorded {new Date(activeResume.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}
                     </span>
                   </div>
                 </div>
                 <div className="flex justify-center gap-4 pt-4">
                    <Button variant="outline" className="gap-2 min-w-[140px]" asChild={!!activeResume.fileUrl}>
                      {activeResume.fileUrl ? (
                        <a href={activeResume.fileUrl} download={activeResume.fileName || 'resume'}>
                          <Download className="h-4 w-4" /> Download
                        </a>
                      ) : (
                        <span><Download className="h-4 w-4" /> Download</span>
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="text-destructive hover:bg-destructive/10 gap-2 min-w-[140px]" 
                      onClick={() => handleDelete(activeResume.id)}
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                 </div>
               </div>
             ) : (
               <div className="text-center space-y-4 p-8">
                 <div className="p-6 rounded-full bg-primary/10 mx-auto w-fit">
                   <FileText className="h-16 w-16 text-primary opacity-50" />
                 </div>
                 <h3 className="text-xl font-bold font-headline">No Resume Uploaded</h3>
                 <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
                   Upload your latest CV to enable professional sharing and ATS optimization.
                 </p>
                 <Button className="mt-4 shadow-lg shadow-primary/20" onClick={() => setIsUploadOpen(true)}>Record Resume Metadata</Button>
               </div>
             )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none bg-accent text-white shadow-xl overflow-hidden group">
            <CardHeader className="pb-2">
              <CardTitle className="font-headline text-lg flex items-center gap-2">
                <Plus className="h-5 w-5" /> Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="secondary" className="w-full justify-between group h-11" disabled={!activeResume}>
                Download PDF <Download className="h-4 w-4 group-hover:translate-y-0.5 transition-transform" />
              </Button>
              <Button variant="secondary" className="w-full justify-between group h-11" disabled={!activeResume}>
                Public Link <ExternalLink className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none bg-card/50 backdrop-blur-md shadow-lg border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Document Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Status</span>
                <span className={cn("font-bold flex items-center gap-1.5", activeResume ? "text-green-500" : "text-yellow-500")}>
                  {activeResume ? (
                    <><CheckCircle2 className="h-3 w-3" /> Active</>
                  ) : (
                    <><AlertCircle className="h-3 w-3" /> Missing</>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">File Name</span>
                <span className="font-bold text-foreground truncate max-w-[120px]">{activeResume?.fileName || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">ATS Score</span>
                <Badge variant="secondary" className="font-bold">88/100</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CRMLayout>
  )
}
