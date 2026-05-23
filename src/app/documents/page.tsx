
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
  FileCheck, 
  FolderLock, 
  Lock,
  AlertCircle
} from 'lucide-react'
import { useFirestore, useCollection, useUser, useStorage } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { collections, createRecord, deleteRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors'

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

const DOCUMENT_CATEGORIES = [
  "Aadhaar Card", 
  "PAN Card", 
  "Driving Licence", 
  "Passport", 
  "Voter ID", 
  "Property Documents", 
  "Insurance Documents", 
  "Tax Documents", 
  "Medical Records", 
  "Other Documents"
];

export default function DocumentVaultPage() {
  const db = useFirestore()
  const storage = useStorage()
  const { user } = useUser()
  const [mounted, setMounted] = useState(false)
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  
  // Selection state
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [selectedCategory, setSelectedCategory] = useState<string>(DOCUMENT_CATEGORIES[0])
  const [selectedStatus, setSelectedStatus] = useState<string>("active")
  const [selectedVisibility, setSelectedVisibility] = useState<string>("Private")

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
        const matchesSearch = (doc.title || '').toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = categoryFilter === 'All' || doc.category === categoryFilter
        return matchesSearch && matchesCategory
      })
      .sort((a: any, b: any) => {
        const getVal = (doc: any) => {
          if (!doc.createdAt) return Date.now() + 1000000;
          if (typeof doc.createdAt.toMillis === 'function') return doc.createdAt.toMillis();
          if (doc.createdAt.seconds) return doc.createdAt.seconds * 1000;
          return Date.now();
        };
        return getVal(b) - getVal(a);
      })
  }, [rawDocs, searchTerm, categoryFilter])

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const validFiles = files.filter(f => {
      if (f.size > MAX_FILE_SIZE) {
        toast({ variant: 'destructive', title: 'File Too Large', description: `${f.name} exceeds 500MB.` })
        return false
      }
      return true
    })

    setPendingFiles(prev => [...prev, ...validFiles])
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const handleFinalSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db || !storage || isSaving) return

    if (pendingFiles.length === 0) {
      toast({ variant: 'destructive', title: 'Selection Required', description: 'Please select files to upload.' })
      return
    }

    const formData = new FormData(e.currentTarget)
    const baseTitle = formData.get('title') as string
    const category = selectedCategory
    const status = selectedStatus
    const visibility = selectedVisibility
    const uid = user.uid

    setIsSaving(true)
    setUploadProgress({})

    console.group('🚀 [VAULT] Standard SDK Upload Workflow');
    console.log('Firebase App Name:', storage.app.name);
    console.log('Project ID:', storage.app.options.projectId);
    console.log('Storage Bucket:', storage.app.options.storageBucket);

    try {
      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i];
        const fileName = `${Date.now()}_${file.name}`;
        const path = `documents/${uid}/${fileName}`;
        const storageRef = ref(storage, path);

        console.log(`[VAULT] Initiating SDK Upload ${i + 1}/${pendingFiles.length}: ${path}`);

        // 1. Upload to Storage using Official SDK Only
        // Note: We use uploadBytesResumable as it is the most robust for CORS handling
        const uploadTask = uploadBytesResumable(storageRef, file);

        const downloadUrl = await new Promise<string>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / (snapshot.totalBytes || 1)) * 100;
              setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
              
              switch (snapshot.state) {
                case 'paused': console.log(`[VAULT] ${file.name} upload is paused`); break;
                case 'running': console.log(`[VAULT] ${file.name} transferring: ${Math.round(progress)}%`); break;
              }
            },
            (error) => {
              console.error(`[VAULT] SDK Error (${file.name}):`, error.code, error.message);
              reject(error);
            },
            async () => {
              console.log(`[VAULT] ${file.name} bytes transferred. Resolving URL...`);
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            }
          );
        });

        // 2. Save to Firestore
        const recordData = {
          title: pendingFiles.length > 1 ? file.name : (baseTitle || file.name),
          category: category,
          fileUrl: downloadUrl,
          filePath: path,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          status: status,
          visibility: visibility,
          isPublic: visibility === 'Public',
          ownerId: uid,
          uploadedAt: new Date().toISOString()
        }

        await createRecord(db, collections.DOCUMENTS, recordData, uid);
        console.log(`[VAULT] Firestore Commitment Complete: ${file.name}`);
      }

      toast({ title: 'Success', description: 'Record uploaded successfully.' })
      setIsDialogOpen(false)
      setPendingFiles([])
    } catch (err: any) {
      console.error(`[VAULT] Critical Failure:`, err);
      let errorMessage = "Network failure or CORS restriction.";
      
      if (err.code === 'storage/unauthorized') errorMessage = "Security Rules Access Denied.";
      if (err.code === 'storage/canceled') errorMessage = "Upload was canceled.";
      
      toast({ 
        variant: 'destructive', 
        title: 'Vault Error', 
        description: errorMessage 
      });

      const permissionError = new FirestorePermissionError({
        path: collections.DOCUMENTS,
        operation: 'create',
        originalError: err
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    } finally {
      setIsSaving(false)
      setUploadProgress({})
      console.groupEnd();
    }
  }

  const handleDelete = async (doc: any) => {
    if (!db || !storage) return
    try {
      await deleteRecord(db, collections.DOCUMENTS, doc.id)
      if (doc.filePath) {
        const storageRef = ref(storage, doc.filePath)
        await deleteObject(storageRef).catch(console.warn)
      }
      toast({ title: 'Record Removed' })
    } catch (err: any) {
      console.error("[VAULT] Delete Error:", err)
    }
  }

  const overallProgress = pendingFiles.length > 0
    ? Object.values(uploadProgress).reduce((a, b) => a + b, 0) / pendingFiles.length
    : 0

  if (!mounted) return null

  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight flex items-center gap-3">
            📂 Document Vault <Lock className="h-6 w-6 text-primary/40" />
          </h1>
          <p className="text-muted-foreground">Secure SDK-powered storage for your professional credentials.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(o) => { if (!isSaving) setIsDialogOpen(o); if (!o) setPendingFiles([]); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-emerald-500/20 bg-[#10b981] hover:bg-[#0da372] text-white font-bold h-12 px-6 rounded-xl">
              <Plus className="h-5 w-5" /> Secure New Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px] bg-[#121214] text-white border-none rounded-3xl p-0 overflow-hidden">
            <DialogHeader className="p-8 pb-4">
              <DialogTitle className="text-3xl font-bold font-headline">Upload to Vault</DialogTitle>
              <DialogDescription className="text-gray-400 text-sm mt-2">
                Standard SDK binary transfer. Supports files up to 500MB.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleFinalSave} className="p-8 pt-0 space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-white">Document Name</Label>
                <Input 
                  name="title" 
                  disabled={isSaving}
                  className="bg-[#1c1c1f] border-2 border-transparent focus:border-[#10b981] transition-all h-14 rounded-2xl text-white placeholder:text-gray-600" 
                  placeholder="e.g. Identity Record" 
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-white">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={isSaving}>
                    <SelectTrigger className="bg-[#1c1c1f] border-none h-14 rounded-2xl focus:ring-0">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1c1c1f] border-gray-800 text-white">
                      {DOCUMENT_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-white">Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus} disabled={isSaving}>
                    <SelectTrigger className="bg-[#1c1c1f] border-none h-14 rounded-2xl focus:ring-0">
                      <SelectValue placeholder="Active" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1c1c1f] border-gray-800 text-white">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-white">Visibility (Mandatory)</Label>
                <Select value={selectedVisibility} onValueChange={setSelectedVisibility} disabled={isSaving}>
                  <SelectTrigger className="bg-[#1c1c1f] border-none h-14 rounded-2xl focus:ring-0">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-orange-400" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-[#1c1c1f] border-gray-800 text-white">
                    <SelectItem value="Private">🔒 Private (Vault Only)</SelectItem>
                    <SelectItem value="Public">🌍 Public (Shared on Hub)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div 
                className={`group relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-800 p-10 bg-[#1c1c1f]/50 transition-colors ${isSaving ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-[#10b981]/50'}`} 
                onClick={() => !isSaving && fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  multiple 
                  onChange={handleFileSelection} 
                  disabled={isSaving}
                />
                {pendingFiles.length > 0 ? (
                  <div className="text-[#10b981] text-center">
                    <FileCheck className="mx-auto mb-2 h-12 w-12" />
                    <span className="text-sm font-bold">
                      {pendingFiles.length} Files Ready
                    </span>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="text-gray-600 mx-auto mb-3 h-12 w-12" />
                    <p className="text-sm text-gray-500 font-medium">Select Documents</p>
                  </div>
                )}
              </div>

              {isSaving && (
                <div className="space-y-3 animate-in fade-in zoom-in duration-300">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#10b981]">
                    <span>{overallProgress === 100 ? 'Securing Record...' : 'Uploading Bytes...'}</span>
                    <span>{Math.round(overallProgress)}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-1 bg-gray-800" />
                </div>
              )}

              <Button 
                type="submit" 
                disabled={pendingFiles.length === 0 || isSaving} 
                className="w-full bg-[#10b981] hover:bg-[#0da372] h-14 rounded-2xl text-lg font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
              >
                {isSaving ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
                {isSaving ? 'Securing...' : 'Upload Record'}
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
              {DOCUMENT_CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
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
                </div>
                <div className="mt-8 flex items-center justify-between border-t border-border/50 pt-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Size</span>
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
