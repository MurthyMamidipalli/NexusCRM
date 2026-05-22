
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
import { useFirestore, useCollection, useUser, useStorage } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
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
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Search & Filter State
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
      const timeA = a.updatedAt?.seconds || 0;
      const timeB = b.updatedAt?.seconds || 0;
      return timeB - timeA;
    })
  }, [rawDocuments, searchQuery, categoryFilter])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      toast({ 
        variant: 'destructive', 
        title: 'File Too Large', 
        description: 'Maximum limit is 500MB.' 
      })
      e.target.value = '';
      return
    }
    setSelectedFile(file)
  }

  const handleSaveDoc = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db || !storage) return
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const category = formData.get('category') as string
    const description = formData.get('description') as string

    try {
      let fileUrl = editingDoc?.fileUrl || ''
      let filePath = editingDoc?.filePath || ''
      let fileType = editingDoc?.fileType || ''
      let fileSize = editingDoc?.fileSize || 0

      if (selectedFile) {
        // Path: documents/{uid}/{filename}
        const storagePath = `documents/${user.uid}/${Date.now()}_${selectedFile.name}`
        const storageRef = ref(storage, storagePath)
        
        console.log("Upload started for:", selectedFile.name);
        const uploadResult = await uploadBytes(storageRef, selectedFile)
        console.log("Upload successful");
        
        fileUrl = await getDownloadURL(uploadResult.ref)
        filePath = storagePath
        fileType = selectedFile.type
        fileSize = selectedFile.size
        console.log("Download URL generated");
      }

      const data = {
        title,
        category,
        description,
        status: 'active',
        fileUrl,
        filePath,
        fileType,
        fileSize,
        ownerId: user.uid
      }

      const mutation = editingDoc
        ? updateRecord(db, collections.DOCUMENTS, editingDoc.id, data)
        : createRecord(db, collections.DOCUMENTS, data, user.uid);

      toast({ title: editingDoc ? 'Document Updated' : 'Document Secured' })
      setIsDialogOpen(false)
      reset()

      mutation.catch(async (err: any) => {
        const permissionError = new FirestorePermissionError({
          path: editingDoc ? `${collections.DOCUMENTS}/${editingDoc.id}` : collections.DOCUMENTS,
          operation: editingDoc ? 'update' : 'create',
          requestResourceData: data,
          originalError: err
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })

    } catch (err: any) {
      console.error("Storage/Sync failure:", err);
      toast({ variant: 'destructive', title: 'Upload Failed', description: err.message });
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (docItem: any) => {
    if (!db || !storage) return
    try {
      if (docItem.filePath) {
        const storageRef = ref(storage, docItem.filePath)
        await deleteObject(storageRef).catch(console.warn)
      }
      await deleteRecord(db, collections.DOCUMENTS, docItem.id)
      toast({ title: 'Document Removed' })
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete record.' })
    }
  }

  const reset = () => { 
    setEditingDoc(null); 
    setSelectedFile(null); 
  }

  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">🔐 Secure Vault</h1>
          <p className="text-muted-foreground">Private storage for personal identification and critical assets.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(o) => { if(!loading) setIsDialogOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary shadow-lg shadow-primary/20 h-11 px-6">
              <Upload className="h-4 w-4" /> Securely Upload
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] bg-[#121214] text-white border-none p-8 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold font-headline flex items-center gap-2">
                <ShieldCheck className="text-primary h-6 w-6" />
                {editingDoc ? 'Edit Metadata' : 'Add Secure Document'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Documents are strictly private and encrypted-at-rest. (Max 500MB)
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveDoc} className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label>Document Title</Label>
                <Input name="title" defaultValue={editingDoc?.title || editingDoc?.name} required className="bg-[#1c1c1f] border-none rounded-xl h-12" placeholder="e.g. My Aadhaar Card" />
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
                <Textarea name="description" defaultValue={editingDoc?.description} className="bg-[#1c1c1f] border-none rounded-xl min-h-[80px]" placeholder="Briefly describe this document..." />
              </div>

              <div 
                className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-800 rounded-2xl bg-[#1c1c1f]/50 cursor-pointer hover:border-primary/50 transition-colors" 
                onClick={() => !loading && fileInputRef.current?.click()}
              >
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="text-primary h-12 w-12" />
                    <span className="text-xs font-bold text-primary truncate max-w-[300px]">{selectedFile.name}</span>
                  </div>
                ) : editingDoc?.fileUrl ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="text-primary/50 h-12 w-12" />
                    <span className="text-xs font-bold text-gray-500">Update Stored File?</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Upload className="text-gray-500 h-12 w-12 mb-2" />
                    <span className="text-xs text-gray-500">Click to Select (Max 500MB)</span>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="submit" disabled={loading} className="w-full h-12 bg-primary hover:bg-primary/90 font-bold rounded-xl border-none">
                  {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : editingDoc ? 'Update Record' : 'Upload & Encrypt'}
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
            placeholder="Search documents by title or description..." 
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
                    Private Vault
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
                  <h4 className="font-bold truncate text-sm">{doc.title || doc.name}</h4>
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
                        <a href={doc.fileUrl} download={doc.title || 'document'} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setPreviewDoc({ url: doc.fileUrl, title: doc.title || doc.name })}>
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
          <p className="italic text-sm">Vault Empty. Securely store your first document.</p>
        </div>
      )}

      {/* Full-screen Document Preview */}
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
