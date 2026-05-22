"use client"

import React, { useMemo, useState, useEffect, useRef } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Loader2, 
  Trash2, 
  FileText, 
  Search, 
  Filter, 
  Upload, 
  Download, 
  Eye, 
  X,
  FileCheck,
  FolderLock,
  Lock,
  ShieldCheck
} from 'lucide-react'
import { useFirestore, useCollection, useUser, useStorage } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { collections, createRecord, deleteRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

interface PendingUpload {
  file: File;
  progress: number;
  url?: string;
  path?: string;
  done: boolean;
}

export default function DocumentVaultPage() {
  const db = useFirestore()
  const storage = useStorage()
  const { user } = useUser()
  const [mounted, setMounted] = useState(false)
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [loading, setLoading] = useState(false)
  
  // Track uploads immediately on selection
  const [pendingUploads, setPendingUploads] = useState<{ [key: string]: PendingUpload }>({})
  
  // Form States
  const [visibility, setVisibility] = useState('Private')
  const [status, setStatus] = useState('Active')
  const [category, setCategory] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setMounted(true) }, [])

  const docsQuery = useMemo(() => {
    if (!db || !user) return null
    return query(collection(db, collections.DOCUMENTS), where('ownerId', '==', user.uid))
  }, [db, user])

  const { data: rawDocs, loading: docsLoading } = useCollection(docsQuery)

  const filteredDocs = useMemo(() => {
    if (!rawDocs) return []
    return rawDocs
      .filter((doc: any) => {
        const matchesSearch = (doc.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (doc.description || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || doc.category === categoryFilter;
        return matchesSearch && matchesCategory;
      })
      .sort((a: any, b: any) => {
        const getVal = (doc: any) => {
          if (doc.updatedAt?.toMillis) return doc.updatedAt.toMillis();
          if (doc.updatedAt?.seconds) return doc.updatedAt.seconds * 1000;
          return Date.now() + 10000;
        };
        return getVal(b) - getVal(a);
      })
  }, [rawDocs, searchTerm, categoryFilter])

  // INSTANT UPLOAD: Starts on selection
  const handleFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length || !user || !storage) return

    console.log(`🚀 Starting high-speed eager upload for ${files.length} files...`)

    files.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast({ variant: 'destructive', title: 'File Too Large', description: `${file.name} exceeds 500MB.` })
        return
      }

      const fileName = `${Date.now()}_${file.name}`
      const path = `documents/${user.uid}/${fileName}`
      const storageRef = ref(storage, path)
      const uploadTask = uploadBytesResumable(storageRef, file)

      // Initialize pending state
      setPendingUploads(prev => ({
        ...prev,
        [file.name]: { file, progress: 0, done: false }
      }))

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / (snapshot.totalBytes || 1)) * 100
          setPendingUploads(prev => ({
            ...prev,
            [file.name]: { ...prev[file.name], progress }
          }))
        },
        (error) => {
          console.error(`❌ Upload failed for ${file.name}:`, error)
          toast({ variant: 'destructive', title: 'Upload Failed', description: error.message })
          setPendingUploads(prev => {
            const newState = { ...prev }
            delete newState[file.name]
            return newState
          })
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref)
          setPendingUploads(prev => ({
            ...prev,
            [file.name]: { ...prev[file.name], url, path, progress: 100, done: true }
          }))
          console.log(`✅ ${file.name} ready for record entry.`)
        }
      )
    })
  }

  const handleFinalSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db) return

    const uploads = Object.values(pendingUploads)
    if (uploads.length === 0) {
      toast({ variant: 'destructive', title: 'No Files', description: 'Please select a document first.' })
      return
    }

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const docTitle = formData.get('title') as string
    const docDescription = formData.get('description') as string

    // NON-BLOCKING BACKGROUND SYNC
    // We close the dialog immediately and handle the Firestore writes as files finish
    toast({ title: 'Vault Sync Started', description: 'Records are being secured in your private vault.' })
    setIsDialogOpen(false)

    uploads.forEach((upload) => {
      // If upload is already done, save immediately
      if (upload.done && upload.url) {
        saveMetadata(upload, docTitle, docDescription)
      } else {
        // If still uploading, we wait for it to finish in the background
        // The listener is still active in state, but since we closed the dialog,
        // we'll handle the completion logic by checking periodically or using the existing task handle
        // For simplicity in this flow, we notify the user that we are finalizing.
        const checkInterval = setInterval(() => {
          setPendingUploads(curr => {
            const currentUpload = curr[upload.file.name]
            if (currentUpload?.done && currentUpload.url) {
              saveMetadata(currentUpload, docTitle, docDescription)
              clearInterval(checkInterval)
              const nextPending = { ...curr }
              delete nextPending[upload.file.name]
              return nextPending
            }
            return curr
          })
        }, 500)
      }
    })

    resetForm()
  }

  const saveMetadata = (upload: PendingUpload, baseTitle: string, desc: string) => {
    if (!user || !db) return
    const data = {
      title: Object.keys(pendingUploads).length > 1 ? upload.file.name : baseTitle || upload.file.name,
      category: category || 'Other',
      description: desc || '',
      fileUrl: upload.url,
      filePath: upload.path,
      fileType: upload.file.type,
      fileSize: upload.file.size,
      status: status.toLowerCase(),
      isPublic: visibility === 'Public',
      ownerId: user.uid
    }
    createRecord(db, collections.DOCUMENTS, data, user.uid).catch(console.error)
  }

  const resetForm = () => {
    setPendingUploads({})
    setCategory('')
    setStatus('Active')
    setVisibility('Private')
    setLoading(false)
  }

  const handleDelete = async (doc: any) => {
    if (!db || !storage) return
    try {
      await deleteRecord(db, collections.DOCUMENTS, doc.id)
      if (doc.filePath) {
        await deleteObject(ref(storage, doc.filePath))
      }
      toast({ title: 'Record Purged' })
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Deletion Failed', description: err.message })
    }
  }

  const overallProgress = Object.values(pendingUploads).length > 0
    ? Object.values(pendingUploads).reduce((a, b) => a + b.progress, 0) / Object.values(pendingUploads).length
    : 0

  if (!mounted) return null

  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight flex items-center gap-3">
            📂 Document Vault <Lock className="h-6 w-6 text-primary/40" />
          </h1>
          <p className="text-muted-foreground">Manage identification and records with high-speed private sync.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(o) => { if(!loading) setIsDialogOpen(o); if(!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-emerald-500/20 bg-[#10b981] hover:bg-[#0da372] text-white font-bold h-12 px-6 rounded-xl">
              <Plus className="h-5 w-5" /> Secure New Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px] bg-[#121214] text-white border-none rounded-3xl p-0 overflow-hidden">
            <DialogHeader className="p-8 pb-4">
              <DialogTitle className="text-3xl font-bold font-headline">Upload to Vault</DialogTitle>
              <DialogDescription className="text-gray-400 text-sm mt-2">
                Files start uploading immediately. Support for records up to 500MB.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleFinalSave} className="p-8 pt-0 space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-white">Document Name</Label>
                <Input 
                  name="title" 
                  className="bg-[#1c1c1f] border-2 border-transparent focus:border-[#10b981] transition-all h-14 rounded-2xl text-white placeholder:text-gray-600" 
                  placeholder="e.g. Identity Record" 
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-white">Category</Label>
                  <Input 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-[#1c1c1f] border-2 border-transparent focus:border-[#10b981] transition-all h-14 rounded-2xl text-white placeholder:text-gray-600" 
                    placeholder="e.g. Identity" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-white">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="bg-[#1c1c1f] border-none h-14 rounded-2xl focus:ring-0">
                      <SelectValue placeholder="Active" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1c1c1f] border-gray-800 text-white">
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Archived">Archived</SelectItem>
                      <SelectItem value="Expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-white">Visibility (Mandatory)</Label>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger className="bg-[#1c1c1f] border-none h-14 rounded-2xl focus:ring-0">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-orange-400" />
                      <SelectValue placeholder="Private (Vault Only)" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-[#1c1c1f] border-gray-800 text-white">
                    <SelectItem value="Private">🔒 Private (Vault Only)</SelectItem>
                    <SelectItem value="Public">🌍 Public (Shared on Hub)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div 
                className="group relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-800 p-10 bg-[#1c1c1f]/50 cursor-pointer hover:border-[#10b981]/50 transition-colors" 
                onClick={() => !loading && fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  multiple 
                  onChange={handleFileSelection} 
                />
                {Object.keys(pendingUploads).length > 0 ? (
                  <div className="text-[#10b981] text-center">
                    <FileCheck className="mx-auto mb-2 h-12 w-12" />
                    <span className="text-sm font-bold">
                      {Object.keys(pendingUploads).length} Files Selected
                    </span>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="text-gray-600 mx-auto mb-3 h-12 w-12" />
                    <p className="text-sm text-gray-500 font-medium">Select Files (Max 500MB)</p>
                  </div>
                )}
              </div>

              {Object.keys(pendingUploads).length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#10b981]">
                    <span>Uploading...</span>
                    <span>{Math.round(overallProgress)}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-1 bg-gray-800" />
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loading || Object.keys(pendingUploads).length === 0} 
                className="w-full bg-[#10b981] hover:bg-[#0da372] h-14 rounded-2xl text-lg font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : 'Save Record'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search records..." 
            className="pl-10 bg-card/50 border-none h-11 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="pl-10 bg-card/50 border-none h-11 rounded-xl">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-[#1c1c1f] border-gray-800 text-white">
              <SelectItem value="All">All Categories</SelectItem>
              <SelectItem value="Identity">Identity</SelectItem>
              <SelectItem value="Tax">Tax</SelectItem>
              <SelectItem value="Medical">Medical</SelectItem>
              <SelectItem value="Legal">Legal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {docsLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : filteredDocs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc: any) => (
            <Card key={doc.id} className="group border-none bg-card/50 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-300 rounded-[24px] overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 rounded-2xl bg-[#10b981]/10 text-[#10b981]">
                    <FileText className="h-8 w-8" />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-[#10b981]" onClick={() => window.open(doc.fileUrl, '_blank')}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(doc)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-headline font-bold text-xl truncate">{doc.title}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-[#10b981]/5 text-[#10b981] border-[#10b981]/20 text-[9px] uppercase font-bold tracking-widest px-2 py-0.5">
                      {doc.category}
                    </Badge>
                    {doc.isPublic ? <Badge className="bg-emerald-500 text-white text-[8px]">PUBLIC</Badge> : <Badge className="bg-orange-500/10 text-orange-400 text-[8px] border-orange-400/20">PRIVATE</Badge>}
                  </div>
                  {doc.description && <p className="text-xs text-muted-foreground line-clamp-2 pt-2 leading-relaxed">{doc.description}</p>}
                </div>
                <div className="mt-8 flex items-center justify-between border-t border-border/50 pt-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">File Size</span>
                    <span className="text-xs font-bold">{((doc.fileSize || 0) / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl text-[11px] font-bold gap-2" asChild>
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" download>
                      <Download className="h-3.5 w-3.5" /> Download
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-border/50 bg-card/30 text-muted-foreground gap-4">
          <FolderLock className="h-12 w-12 opacity-10" />
          <div className="text-center">
            <p className="font-bold">Vault Empty</p>
            <p className="text-xs italic">Secure records will appear here.</p>
          </div>
        </div>
      )}
    </CRMLayout>
  )
}
