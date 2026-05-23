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
  Lock,
  FolderLock,
  Database,
  Globe,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import { collections, createRecord, deleteRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { uploadWithProgress, supabase } from '@/lib/supabase'

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
  const { user } = useUser()
  const [mounted, setMounted] = useState(false)
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        const matchesSearch = (doc.title || doc.file_name || '').toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = categoryFilter === 'All' || doc.category === categoryFilter
        return matchesSearch && matchesCategory
      })
      .sort((a: any, b: any) => {
        const getVal = (doc: any) => {
          if (doc.createdAt?.seconds) return doc.createdAt.seconds * 1000;
          if (doc.created_at) return new Date(doc.created_at).getTime();
          return Date.now();
        };
        return getVal(b) - getVal(a);
      })
  }, [rawDocs, searchTerm, categoryFilter])

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setPendingFiles(prev => [...prev, ...files])
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const handleFinalSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('[Vault] handleFinalSave triggered');
    
    if (!user || !db || isSaving) return

    if (!supabase) {
      console.error('[Vault] Supabase client missing');
      toast({ 
        variant: 'destructive', 
        title: 'Integration Inactive', 
        description: 'Please check your environment variables for Supabase keys.' 
      })
      return
    }

    if (pendingFiles.length === 0) {
      toast({ variant: 'destructive', title: 'No Files Selected', description: 'Please select at least one file to upload.' })
      return
    }

    const formData = new FormData(e.currentTarget)
    const baseTitle = (formData.get('title') as string) || 'Untitled Document'
    const uid = user.uid

    setIsSaving(true)
    console.log(`[Vault] Processing ${pendingFiles.length} files...`);

    try {
      for (const file of pendingFiles) {
        const timestamp = Date.now()
        const storagePath = `${uid}/${timestamp}_${file.name.replace(/\s+/g, '_')}`
        
        console.log(`[Vault] Uploading: ${file.name} -> ${storagePath}`);
        
        const fileUrl = await uploadWithProgress(
          'documents',
          storagePath,
          file,
          (percent) => {
            setUploadProgress(prev => ({ ...prev, [file.name]: percent }))
          }
        )

        console.log('[Vault] Upload complete, creating Firestore record...');

        const recordData = {
          title: pendingFiles.length > 1 ? file.name : baseTitle,
          file_name: file.name,
          category: selectedCategory,
          status: selectedStatus,
          visibility: selectedVisibility,
          isPublic: selectedVisibility === 'Public',
          file_url: fileUrl,
          fileUrl: fileUrl,
          fileSize: file.size,
          fileType: file.type,
          filePath: storagePath,
          ownerId: uid,
          created_at: new Date().toISOString(),
          storageProvider: 'Supabase'
        }

        await createRecord(db, collections.DOCUMENTS, recordData, uid);
        console.log('[Vault] Firestore record saved successfully');
      }

      toast({ title: 'Record Secured', description: 'Your files have been saved successfully.' })
      setIsDialogOpen(false)
      setPendingFiles([])
      setUploadProgress({})
    } catch (err: any) {
      console.error('[Vault] Critical Save Failure:', err)
      toast({ 
        variant: 'destructive', 
        title: 'Save Failed', 
        description: err.message || 'An unexpected error occurred. Check browser console.' 
      });
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (doc: any) => {
    if (!db) return
    try {
      await deleteRecord(db, collections.DOCUMENTS, doc.id)
      if (doc.filePath && supabase) {
        await supabase.storage.from('documents').remove([doc.filePath])
      }
      toast({ title: 'Record Removed' })
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: err.message })
    }
  }

  const totalProgress = useMemo(() => {
    if (pendingFiles.length === 0) return 0
    const sum = Object.values(uploadProgress).reduce((a, b) => a + b, 0)
    return Math.round(sum / pendingFiles.length)
  }, [uploadProgress, pendingFiles])

  if (!mounted) return null

  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight flex items-center gap-3">
            📂 Document Vault <Database className="h-6 w-6 text-primary/40" />
          </h1>
          <p className="text-muted-foreground">Secure high-performance storage powered by Supabase Cloud.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(o) => { if (!isSaving) setIsDialogOpen(o); if (!o) { setPendingFiles([]); setUploadProgress({}); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-emerald-500/20 bg-[#10b981] hover:bg-[#0da372] text-white font-bold h-12 px-6 rounded-xl">
              <Plus className="h-5 w-5" /> Add New Record
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px] bg-[#121214] text-white border-none rounded-3xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
            <DialogHeader className="p-8 pb-4">
              <DialogTitle className="text-3xl font-bold font-headline">Secure Document</DialogTitle>
              <DialogDescription className="text-gray-400 text-sm mt-2">
                Your files are encrypted and stored in your private bucket.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-8 pb-8">
              {!supabase && (
                <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex gap-3 text-destructive">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold">Integration Inactive</p>
                    <p className="text-[10px] opacity-80 italic">Configure NEXT_PUBLIC_SUPABASE variables in your settings.</p>
                  </div>
                </div>
              )}

              <form id="vault-form" onSubmit={handleFinalSave} className="space-y-6">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <Label className="text-sm font-semibold text-white">Visibility</Label>
                  <Select value={selectedVisibility} onValueChange={setSelectedVisibility} disabled={isSaving}>
                    <SelectTrigger className="bg-[#1c1c1f] border-none h-14 rounded-2xl focus:ring-0">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-emerald-400" />
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
                  className="group relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-800 p-10 bg-[#1c1c1f]/50 transition-colors cursor-pointer hover:border-[#10b981]/50" 
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
                      <CheckCircle2 className="mx-auto mb-2 h-12 w-12" />
                      <span className="text-sm font-bold">{pendingFiles.length} Files Selected</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="text-gray-600 mx-auto mb-3 h-12 w-12" />
                      <p className="text-sm text-gray-500 font-medium">Select Documents for Upload</p>
                    </div>
                  )}
                </div>

                {isSaving && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                      <span>Synchronizing...</span>
                      <span>{totalProgress}%</span>
                    </div>
                    <Progress value={totalProgress} className="h-1 bg-gray-800" />
                  </div>
                )}
              </form>
            </div>

            <DialogFooter className="p-8 pt-4 border-t border-white/5 bg-[#121214]">
              <Button 
                type="submit" 
                form="vault-form"
                disabled={isSaving} 
                className="w-full bg-[#10b981] hover:bg-[#0da372] h-14 rounded-2xl text-lg font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
              >
                {isSaving ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
                {isSaving ? 'Uploading...' : 'Save Record'}
              </Button>
            </DialogFooter>
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
                  <div className="flex items-center gap-1">
                    {doc.fileUrl || doc.file_url ? (
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" asChild>
                        <a href={doc.file_url || doc.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                    ) : null}
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(doc)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-headline font-bold text-xl truncate">{doc.title || doc.file_name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-[#10b981]/5 text-[#10b981] border-[#10b981]/20 text-[9px] uppercase font-bold tracking-widest px-2 py-0.5">
                      {doc.category}
                    </Badge>
                    {doc.isPublic ? <Badge className="bg-emerald-500 text-white text-[8px]">PUBLIC</Badge> : <Badge className="bg-orange-500/10 text-orange-400 text-[8px] border-orange-400/20">PRIVATE</Badge>}
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 border-t border-border/50 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Secured At</span>
                    <span className="text-xs font-bold">{doc.createdAt?.seconds ? new Date(doc.createdAt.seconds * 1000).toLocaleDateString() : 'Just Now'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-2 text-emerald-400">
                    <Globe className="h-3 w-3" />
                    <span className="text-[9px] font-bold uppercase tracking-tight">Hosted on Supabase Cloud</span>
                  </div>
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
            <p className="text-xs italic">Encrypted storage ready.</p>
          </div>
        </div>
      )}
    </CRMLayout>
  )
}
