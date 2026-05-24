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
  Upload, 
  Lock,
  Database,
  Globe,
  Eye,
  CheckCircle2,
  X,
  AlertCircle
} from 'lucide-react'
import { useFirestore, useCollection, useUser, useStorage } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import { collections, createRecord, deleteRecord } from '@/lib/firestore-service'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { uploadToFirebaseStorage, validateFile } from '@/lib/storage-service'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors'

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
  const { user, loading: authLoading } = useUser()
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedCategory, setSelectedCategory] = useState<string>(DOCUMENT_CATEGORIES[0])
  const [selectedVisibility, setSelectedVisibility] = useState<string>("Private")

  useEffect(() => { setMounted(true) }, [])

  const docsQuery = useMemo(() => {
    if (!db || !user) return null
    return query(collection(db, collections.DOCUMENTS), where('ownerId', '==', user.uid))
  }, [db, user])

  const { data: rawDocs, loading: docsLoading } = useCollection(docsQuery)

  const filteredDocs = useMemo(() => {
    if (!rawDocs) return []
    return rawDocs.filter((doc: any) => {
      const title = (doc.title || doc.file_name || '').toLowerCase()
      const matchesSearch = title.includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === 'All' || doc.category === categoryFilter
      return matchesSearch && matchesCategory
    }).sort((a: any, b: any) => {
      const getVal = (doc: any) => {
        if (doc.updatedAt?.toMillis) return doc.updatedAt.toMillis();
        if (doc.updatedAt?.seconds) return doc.updatedAt.seconds * 1000;
        return Date.now() + 10000;
      }
      return getVal(b) - getVal(a);
    })
  }, [rawDocs, searchTerm, categoryFilter])

  const handleFinalSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!user || !db || !storage) {
      toast({ variant: 'destructive', title: 'System Error', description: 'Services not initialized.' });
      return;
    }

    if (pendingFiles.length === 0) {
      toast({ variant: 'destructive', title: 'File Missing', description: 'Please select a document to upload.' });
      return
    }

    const formData = new FormData(e.currentTarget)
    const baseTitle = formData.get('title') as string
    const description = formData.get('description') as string
    
    setIsSaving(true)
    setUploadProgress(0)

    try {
      for (const file of pendingFiles) {
        // Validate each file
        try {
          validateFile(file);
        } catch (vErr: any) {
          toast({ variant: 'destructive', title: 'Validation Error', description: vErr.message });
          throw vErr;
        }

        // Centralized Resilient Upload
        const uploadResult = await uploadToFirebaseStorage(
          storage, 
          file, 
          `documents/${user.uid}`,
          (progress) => setUploadProgress(progress)
        );

        const recordData = {
          title: pendingFiles.length > 1 ? file.name : (baseTitle || file.name),
          file_name: uploadResult.originalName,
          category: selectedCategory,
          description: description || '',
          isPublic: selectedVisibility === 'Public',
          fileUrl: uploadResult.downloadURL,
          fileSize: uploadResult.fileSize,
          filePath: uploadResult.storagePath,
          ownerId: user.uid,
          status: 'active'
        }

        await createRecord(db, collections.DOCUMENTS, recordData, user.uid);
      }

      toast({ title: 'Record Secured', description: 'Your documents have been synchronized to the cloud vault.' })
      setIsDialogOpen(false)
      setPendingFiles([])
    } catch (err: any) {
      console.error('[Vault] Save Execution Failed:', err);
      toast({ 
        variant: 'destructive', 
        title: 'Sync Failed', 
        description: err.message || 'An unexpected error occurred during cloud synchronization.'
      });
    } finally {
      setIsSaving(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = (doc: any) => {
    if (!db) return
    deleteRecord(db, collections.DOCUMENTS, doc.id)
      .catch(async (err: any) => {
        const permissionError = new FirestorePermissionError({
          path: `${collections.DOCUMENTS}/${doc.id}`,
          operation: 'delete',
          originalError: err
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
    toast({ title: 'Record Removed' })
  }

  if (!mounted) return null

  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground">📂 Document Vault</h1>
          <p className="text-muted-foreground">Secure cloud storage for sensitive professional records.</p>
        </div>
        <Button 
          className="gap-2 shadow-lg shadow-emerald-500/20 bg-[#10b981] hover:bg-[#0da372] text-white font-bold h-12 px-6 rounded-xl" 
          onClick={() => setIsDialogOpen(true)}
          disabled={!user || isSaving}
        >
          {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : <Plus className="h-5 w-5" />}
          {isSaving ? 'Synchronizing...' : 'Add Record'}
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(o) => { if(!isSaving) setIsDialogOpen(o); if(!o) setPendingFiles([]); }}>
        <DialogContent className="sm:max-w-[550px] bg-[#121214] text-white border-none rounded-3xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="p-8 pb-4 border-b border-white/5 relative shrink-0 text-left">
            <DialogTitle className="text-3xl font-bold font-headline text-white">Secure Document</DialogTitle>
            <DialogDescription className="text-gray-400">Files are encrypted and stored in your private cloud vault.</DialogDescription>
            <DialogClose className="absolute right-4 top-4 text-gray-500 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </DialogClose>
          </DialogHeader>

          <form onSubmit={handleFinalSave} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-white">Document Name</Label>
                <Input name="title" disabled={isSaving} required className="bg-[#1c1c1f] border-none h-14 rounded-2xl text-white focus:ring-1 focus:ring-[#10b981]" placeholder="e.g. Identity Record" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-sm font-semibold text-white">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={isSaving}>
                    <SelectTrigger className="bg-[#1c1c1f] border-none h-14 rounded-2xl text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1c1c1f] border-gray-800 text-white">{DOCUMENT_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label className="text-sm font-semibold text-white">Visibility</Label>
                  <Select value={selectedVisibility} onValueChange={setSelectedVisibility} disabled={isSaving}>
                    <SelectTrigger className="bg-[#1c1c1f] border-none h-14 rounded-2xl text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1c1c1f] border-gray-800 text-white"><SelectItem value="Private">🔒 Private</SelectItem><SelectItem value="Public">🌍 Public</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-white">Internal Description (Optional)</Label>
                <Textarea name="description" disabled={isSaving} className="bg-[#1c1c1f] border-none min-h-[80px] rounded-2xl text-white" placeholder="Add details for your own reference..." />
              </div>

              <div className="group flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-800 p-10 bg-[#1c1c1f]/50 cursor-pointer hover:border-[#10b981]/50 transition-colors" onClick={() => !isSaving && fileInputRef.current?.click()}>
                <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => setPendingFiles(Array.from(e.target.files || []))} disabled={isSaving} />
                {pendingFiles.length > 0 ? (
                  <div className="text-[#10b981] text-center">
                    <CheckCircle2 className="mx-auto mb-2 h-12 w-12" />
                    <span className="text-sm font-bold">{pendingFiles.length} Selected</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="text-gray-600 mx-auto mb-3 h-12 w-12" />
                    <p className="text-sm text-gray-500 font-medium">Click to select files (Max 20MB)</p>
                  </div>
                )}
              </div>

              {isSaving && (
                <div className="space-y-2 animate-in fade-in">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#10b981]">
                    <span>Uploading to Vault...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-1 bg-gray-800" />
                </div>
              )}
            </div>
            <DialogFooter className="p-8 pt-4 border-t border-white/5 bg-[#121214] shrink-0">
              <Button type="submit" disabled={isSaving} className="w-full bg-[#10b981] hover:bg-[#0da372] h-14 rounded-2xl text-lg font-bold shadow-lg shadow-emerald-500/20">
                {isSaving ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
                Save Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search document titles..." className="pl-10 bg-card/50 border-none h-11 rounded-xl focus:ring-1 focus:ring-primary" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="md:col-span-2 flex justify-end">
           <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] bg-card/50 border-none rounded-xl h-11">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="All">All Categories</SelectItem>
                {DOCUMENT_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
           </Select>
        </div>
      </div>

      {!user && !authLoading && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-bold flex items-center gap-2">
           <AlertCircle className="h-4 w-4" /> Sign-in required to enable upload feature.
        </div>
      )}

      {docsLoading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
      ) : filteredDocs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc: any) => (
            <Card key={doc.id} className="group border-none bg-card/50 backdrop-blur-md shadow-xl rounded-[24px] overflow-hidden hover:shadow-2xl transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 rounded-2xl bg-[#10b981]/10 text-[#10b981]"><FileText className="h-8 w-8" /></div>
                  <div className="flex items-center gap-1">
                    {doc.fileUrl && <Button variant="ghost" size="icon" asChild className="rounded-full"><a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"><Eye className="h-4 w-4" /></a></Button>}
                    <Button variant="ghost" size="icon" className="hover:text-destructive rounded-full" onClick={() => handleDelete(doc)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <h3 className="font-headline font-bold text-xl truncate mb-2">{doc.title || doc.file_name}</h3>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className="bg-[#10b981]/5 text-[#10b981] border-[#10b981]/20 text-[9px] uppercase font-bold tracking-widest">{doc.category}</Badge>
                  {doc.isPublic ? <Globe className="h-3 w-3 text-muted-foreground" /> : <Lock className="h-3 w-3 text-muted-foreground" />}
                </div>
                {doc.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 italic">{doc.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-border/50 bg-card/30 text-muted-foreground italic">
          <Database className="h-12 w-12 opacity-10 mb-4" />
          Vault Empty
        </div>
      )}
    </CRMLayout>
  )
}
