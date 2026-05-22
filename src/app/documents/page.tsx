"use client"

import React, { useMemo, useState, useEffect, useRef } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Loader2,
  FileBox,
  Pencil,
  Eye,
  CheckCircle2,
  X,
  Search,
  Filter,
  ShieldCheck,
  AlertCircle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { useFirestore, useCollection, useUser, useStorage } from '@/firebase'
import { collection, query, where, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject, UploadTask } from 'firebase/storage'
import { collections, deleteRecord, createRecord, updateRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

export default function DocumentsPage() {
  const db = useFirestore()
  const storage = useStorage()
  const { user } = useUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // High-speed upload tracking
  const [activeUploadTask, setActiveUploadTask] = useState<UploadTask | null>(null)
  const [isUploadComplete, setIsUploadComplete] = useState(false)
  const [pendingFileUrl, setPendingFileUrl] = useState<string | null>(null)
  const [pendingFilePath, setPendingFilePath] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setFilter] = useState('All')

  const docsQuery = useMemo(() => {
    if (!db || !user) return null
    return query(collection(db, collections.DOCUMENTS), where('ownerId', '==', user.uid))
  }, [db, user])

  const { data: rawDocuments, loading: docsLoading } = useCollection(docsQuery)

  const documents = useMemo(() => {
    if (!rawDocuments) return []
    let filtered = [...rawDocuments]
    
    if (categoryFilter !== 'All') {
      filtered = filtered.filter(d => d.category === categoryFilter)
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(d => 
        d.title?.toLowerCase().includes(q) || 
        d.description?.toLowerCase().includes(q)
      )
    }

    return filtered.sort((a: any, b: any) => {
      const getVal = (doc: any) => {
        if (doc.updatedAt?.toMillis) return doc.updatedAt.toMillis();
        if (doc.updatedAt?.seconds) return doc.updatedAt.seconds * 1000;
        return Date.now() + 10000;
      }
      return getVal(b) - getVal(a);
    })
  }, [rawDocuments, searchQuery, categoryFilter])

  // Optimize: Start upload immediately on selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !storage) return

    if (file.size > MAX_FILE_SIZE) {
      toast({ variant: 'destructive', title: 'File Too Large', description: 'Maximum limit is 500MB.' })
      return
    }

    console.log("File selected for upload:", file.name)
    setSelectedFile(file)
    setIsUploadComplete(false)
    setUploadProgress(0)
    setPendingFileUrl(null)
    setPendingFilePath(null)

    const storagePath = `documents/${user.uid}/${Date.now()}_${file.name}`
    const storageRef = ref(storage, storagePath)
    
    console.log("Initializing Cloud Storage transfer...")
    const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type })
    setActiveUploadTask(uploadTask)

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        setUploadProgress(progress)
      },
      (error) => {
        console.error("Storage upload failed:", error)
        toast({ variant: 'destructive', title: 'Upload Failed', description: error.message })
        setActiveUploadTask(null)
        setSelectedFile(null)
      },
      async () => {
        try {
          console.log("Upload completed. Resolving download URL...")
          const url = await getDownloadURL(uploadTask.snapshot.ref)
          setPendingFileUrl(url)
          setPendingFilePath(storagePath)
          setIsUploadComplete(true)
          setActiveUploadTask(null)
          console.log("Secure location verified.")
        } catch (urlError: any) {
          console.error("Failed to generate download URL:", urlError)
          toast({ variant: 'destructive', title: 'Finalization Error', description: 'Could not resolve file link.' })
        }
      }
    )
  }

  const handleSaveDoc = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db) return
    
    if (!editingDoc && !isUploadComplete && activeUploadTask) {
      toast({ title: 'Please Wait', description: 'The file is still being secured in the cloud.' })
      return
    }

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const category = formData.get('category') as string
    const description = formData.get('description') as string

    try {
      const data: any = {
        title,
        category,
        description,
        status: 'active',
        ownerId: user.uid,
        fileUrl: isUploadComplete ? pendingFileUrl : (editingDoc?.fileUrl || ''),
        filePath: isUploadComplete ? pendingFilePath : (editingDoc?.filePath || ''),
        fileType: isUploadComplete ? selectedFile?.type : (editingDoc?.fileType || ''),
        fileSize: isUploadComplete ? selectedFile?.size : (editingDoc?.fileSize || 0),
        updatedAt: serverTimestamp()
      }

      console.log(editingDoc ? "Updating existing record..." : "Creating new secure record...")
      
      const mutation = editingDoc
        ? updateRecord(db, collections.DOCUMENTS, editingDoc.id, data)
        : createRecord(db, collections.DOCUMENTS, data, user.uid);

      toast({ title: editingDoc ? 'Changes Saved' : 'Document Secured' })
      setIsDialogOpen(false)
      
      // Handle background sync resolution
      mutation
        .then(() => console.log("Metadata synchronized to Vault."))
        .catch(async (err: any) => {
          console.error("Firestore sync failed:", err)
          const permissionError = new FirestorePermissionError({
            path: editingDoc ? `${collections.DOCUMENTS}/${editingDoc.id}` : collections.DOCUMENTS,
            operation: 'write',
            requestResourceData: data,
            originalError: err
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
        })

    } catch (err: any) {
      console.error("Save failed:", err)
      toast({ variant: 'destructive', title: 'Action Failed', description: err.message });
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (docItem: any) => {
    if (!db || !storage) return
    deleteRecord(db, collections.DOCUMENTS, docItem.id).catch(console.error)
    if (docItem.filePath) {
      const storageRef = ref(storage, docItem.filePath)
      deleteObject(storageRef).catch(console.warn)
    }
    toast({ title: 'Document Removed' })
  }

  const reset = () => { 
    setEditingDoc(null); 
    setSelectedFile(null); 
    setUploadProgress(0);
    setActiveUploadTask(null);
    setIsUploadComplete(false);
    setPendingFileUrl(null);
    setPendingFilePath(null);
  }

  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground">📁 Document Vault</h1>
          <p className="text-muted-foreground">High-speed secure storage for critical personal records.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(o) => { if(!loading) setIsDialogOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary shadow-lg shadow-primary/20 h-11 px-6">
              <Upload className="h-4 w-4" /> Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] bg-[#121214] text-white border-none p-8 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold font-headline flex items-center gap-2">
                <FileBox className="text-primary h-6 w-6" />
                {editingDoc ? 'Edit Document' : 'Upload Document'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Direct cloud upload (Max 500MB). Files are owner-private.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveDoc} className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label>Document Title</Label>
                <Input name="title" defaultValue={editingDoc?.title} required className="bg-[#1c1c1f] border-none rounded-xl h-12" placeholder="e.g. My Passport" />
              </div>
              
              <div className="space-y-2">
                <Label>Category</Label>
                <Select name="category" defaultValue={editingDoc?.category || DOCUMENT_CATEGORIES[0]}>
                  <SelectTrigger className="bg-[#1c1c1f] border-none rounded-xl h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1c1c1f] border-gray-800 text-white">
                    {DOCUMENT_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Textarea name="description" defaultValue={editingDoc?.description} className="bg-[#1c1c1f] border-none rounded-xl min-h-[80px]" placeholder="Brief notes about this file..." />
              </div>

              {!editingDoc && (
                <div 
                  className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-800 rounded-2xl bg-[#1c1c1f]/50 cursor-pointer hover:border-primary/50 transition-colors" 
                  onClick={() => !loading && fileInputRef.current?.click()}
                >
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-2">
                      {isUploadComplete ? <CheckCircle2 className="text-primary h-12 w-12" /> : <Loader2 className="text-primary h-12 w-12 animate-spin" />}
                      <span className="text-xs font-bold text-primary truncate max-w-[300px]">
                        {isUploadComplete ? 'Ready to Secure' : `Uploading... ${Math.round(uploadProgress)}%`}
                      </span>
                      <span className="text-[10px] text-gray-500">{selectedFile.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Upload className="text-gray-500 h-12 w-12 mb-2" />
                      <span className="text-xs text-gray-500">Click to Select File</span>
                    </div>
                  )}
                </div>
              )}

              {(activeUploadTask || isUploadComplete) && !editingDoc && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-primary">
                    <span>{isUploadComplete ? 'Upload Complete' : 'Synchronizing...'}</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-1 bg-gray-800" />
                </div>
              )}

              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={loading || (!editingDoc && !isUploadComplete)} 
                  className="w-full h-12 bg-primary hover:bg-primary/90 font-bold rounded-xl border-none"
                >
                  {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : editingDoc ? 'Save Changes' : 'Complete Upload'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by title or description..." 
            className="pl-10 bg-card/50 border-none h-11"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 bg-card/50 px-3 rounded-md min-w-[200px]">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={categoryFilter} onValueChange={setFilter}>
            <SelectTrigger className="border-none bg-transparent h-11 shadow-none focus:ring-0">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
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
          <Loader2 className="animate-spin text-primary h-8 w-8" />
        </div>
      ) : documents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {documents.map((doc: any) => (
            <Card key={doc.id} className="group overflow-hidden bg-card/40 border-none shadow-md hover:shadow-xl transition-all">
              <CardContent className="p-0">
                <div className="h-32 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center relative">
                  <Badge variant="outline" className="absolute top-4 left-4 bg-black/40 border-white/10 text-[9px] uppercase font-bold tracking-widest text-primary">
                    Secure
                  </Badge>
                  <FileText className="h-12 w-12 text-primary opacity-20" />
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingDoc(doc); setIsDialogOpen(true); }} className="bg-background/80 h-8 w-8 rounded-lg">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(doc)} 
                      className="bg-background/80 text-destructive h-8 w-8 rounded-lg hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="font-bold truncate text-sm">{doc.title}</h4>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">{doc.category}</p>
                  
                  {doc.description && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-2 italic">
                      {doc.description}
                    </p>
                  )}

                  <div className="flex justify-between items-center mt-4 border-t border-border/50 pt-4">
                    <span className="text-[9px] font-mono text-muted-foreground">
                      {doc.fileSize ? `${(doc.fileSize / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl" asChild>
                        <a href={doc.fileUrl} download={doc.title} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setPreviewDoc({ url: doc.fileUrl, title: doc.title })}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-3xl text-muted-foreground gap-3">
          <FileBox className="h-10 w-10 opacity-20" />
          <p className="italic text-sm">Vault is empty.</p>
        </div>
      )}

      <Dialog open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-[90vw] h-[90vh] p-0 bg-[#0f1115] text-white border-none rounded-2xl overflow-hidden flex flex-col">
          <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#1a1c21]">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-primary h-5 w-5" />
              <DialogTitle className="truncate font-bold text-sm max-w-md">{previewDoc?.title}</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setPreviewDoc(null)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 bg-black/40">
            {previewDoc?.url && (
              <iframe 
                src={previewDoc.url} 
                className="w-full h-full border-none"
                title={previewDoc.title}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </CRMLayout>
  )
}
