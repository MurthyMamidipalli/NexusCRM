"use client"

import React, { useMemo, useState, useEffect, useRef } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ShieldCheck, 
  Upload, 
  Download, 
  Trash2, 
  Loader2,
  Lock,
  Search,
  Filter,
  Eye,
  CreditCard,
  FileText,
  FileDigit,
  Plane,
  Home,
  Briefcase,
  AlertCircle,
  X,
  Plus,
  Users,
  RefreshCw
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { useFirestore, useCollection, useUser, useStorage } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { collections, deleteRecord, createRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors'

const CATEGORIES = [
  "Aadhaar Card",
  "PAN Card",
  "Driving Licence",
  "Passport",
  "Voter ID",
  "Property Documents",
  "Insurance Documents",
  "Bank Documents",
  "Tax Documents",
  "Personal Documents",
  "Other Documents"
]

const TAG_OPTIONS = [
  "My self",
  "Family",
  "Work",
  "Other"
]

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export default function PrivateDocumentsPage() {
  const db = useFirestore()
  const storage = useStorage()
  const { user } = useUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('All')
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const [docName, setDocName] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Other Documents')
  const [selectedTag, setSelectedTag] = useState('My self')
  const [issueDate, setIssueDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [description, setDescription] = useState('')

  const docsQuery = useMemo(() => {
    if (!db || !user) return null
    return query(
      collection(db, collections.PRIVATE_DOCUMENTS), 
      where('ownerId', '==', user.uid)
    )
  }, [db, user])

  const { data: rawDocuments, loading: docsLoading } = useCollection(docsQuery)

  const documents = useMemo(() => {
    if (!rawDocuments) return []
    
    // Improved sorting to handle pending server timestamps correctly
    const sorted = [...rawDocuments].sort((a: any, b: any) => {
      const getVal = (doc: any) => {
        if (doc.createdAt?.toMillis) return doc.createdAt.toMillis();
        if (doc.createdAt?.seconds) return doc.createdAt.seconds * 1000;
        return Date.now(); // Put items being created right now at the top
      }
      return getVal(b) - getVal(a);
    });

    return sorted.filter((doc: any) => {
      const name = (doc.documentName || '').toLowerCase()
      const search = searchTerm.toLowerCase()
      const matchesSearch = name.includes(search) || (doc.tags || []).some((t: string) => t.toLowerCase().includes(search))
      const matchesCategory = filterCategory === 'All' || doc.category === filterCategory
      return matchesSearch && matchesCategory
    })
  }, [rawDocuments, searchTerm, filterCategory])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast({ variant: 'destructive', title: 'File Too Large', description: 'Limit is 500MB.' })
        return
      }
      setSelectedFile(file)
      if (!docName) setDocName(file.name.split('.')[0])
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db || !storage) return
    
    if (!selectedFile) {
      toast({ variant: 'destructive', title: 'Missing File', description: 'Please select a document to upload.' })
      return
    }

    if (!docName.trim()) {
      toast({ variant: 'destructive', title: 'Missing Name', description: 'Please provide a name for the document.' })
      return
    }

    setLoading(true)
    setUploadProgress(0)

    try {
      const filePath = `private_vault/${user.uid}/${Date.now()}_${selectedFile.name}`
      const storageRef = ref(storage, filePath)
      
      // Use Resumable Upload for better UX on large files
      const uploadTask = uploadBytesResumable(storageRef, selectedFile)

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setUploadProgress(progress)
        }, 
        (error) => {
          console.error("Upload Error:", error)
          toast({ variant: 'destructive', title: 'Upload Failed', description: error.message })
          setLoading(false)
        }, 
        async () => {
          const fileUrl = await getDownloadURL(uploadTask.snapshot.ref)

          const data = {
            documentName: docName,
            category: selectedCategory,
            description: description,
            issueDate: issueDate,
            expiryDate: expiryDate,
            tags: [selectedTag],
            fileUrl: fileUrl,
            filePath: filePath,
            ownerId: user.uid
          }

          // Save metadata
          createRecord(db, collections.PRIVATE_DOCUMENTS, data, user.uid)
            .then(() => {
              toast({ title: 'Document Secured', description: 'Your file has been encrypted and stored.' })
              setIsDialogOpen(false)
              resetForm()
            })
            .catch(async (err) => {
              const permissionError = new FirestorePermissionError({
                path: collections.PRIVATE_DOCUMENTS,
                operation: 'create',
                requestResourceData: data,
                originalError: err
              } satisfies SecurityRuleContext);
              errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => {
              setLoading(false)
            })
        }
      )
    } catch (err: any) {
      console.error(err)
      toast({ variant: 'destructive', title: 'Process Failed', description: err.message })
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setDocName('')
    setSelectedCategory('Other Documents')
    setSelectedTag("My self")
    setIssueDate('')
    setExpiryDate('')
    setDescription('')
    setLoading(false)
    setUploadProgress(0)
  }

  const handleDelete = async (doc: any) => {
    if (!db || !storage) return
    if (!window.confirm('Permanently delete this document from the secure vault?')) return
    
    try {
      if (doc.filePath) {
        const storageRef = ref(storage, doc.filePath)
        await deleteObject(storageRef).catch(console.warn)
      }
      await deleteRecord(db, collections.PRIVATE_DOCUMENTS, doc.id)
      toast({ title: 'Document Removed' })
    } catch (err: any) {
      const permissionError = new FirestorePermissionError({
        path: `${collections.PRIVATE_DOCUMENTS}/${doc.id}`,
        operation: 'delete',
        originalError: err
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Aadhaar Card': case 'PAN Card': case 'Voter ID': return <CreditCard className="h-5 w-5" />
      case 'Passport': return <Plane className="h-5 w-5" />
      case 'Driving Licence': return <FileDigit className="h-5 w-5" />
      case 'Property Documents': return <Home className="h-5 w-5" />
      case 'Bank Documents': case 'Tax Documents': return <Briefcase className="h-5 w-5" />
      default: return <FileText className="h-5 w-5" />
    }
  }

  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight flex items-center gap-3">
            <Lock className="h-8 w-8 text-primary" /> Private Vault
          </h1>
          <p className="text-muted-foreground">Secure, encrypted storage for personal identity documents (Max 500MB).</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(o) => { if(!loading) setIsDialogOpen(o); if(!o && !loading) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary shadow-lg shadow-primary/20 h-12 px-6 rounded-xl">
              <Plus className="h-4 w-4" /> Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-[#121214] text-white border-none rounded-2xl p-0 overflow-hidden">
            <DialogHeader className="p-8 pb-0">
              <DialogTitle className="text-2xl font-bold font-headline">Secure Vault Upload</DialogTitle>
              <DialogDescription className="text-gray-400">Large files are supported. Stay on this page until upload finishes.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpload} className="p-8 pt-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>Document Name</Label>
                <Input 
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  disabled={loading}
                  required 
                  className="bg-[#1c1c1f] border-none h-12 rounded-xl" 
                  placeholder="e.g. Passport 2024" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={loading}>
                    <SelectTrigger className="bg-[#1c1c1f] border-none h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1c1c1f] border-gray-800 text-white">
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tag (Owner)</Label>
                  <Select value={selectedTag} onValueChange={setSelectedTag} disabled={loading}>
                    <SelectTrigger className="bg-[#1c1c1f] border-none h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1c1c1f] border-gray-800 text-white">
                      {TAG_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Issue Date (Optional)</Label>
                  <Input 
                    type="date" 
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    disabled={loading}
                    className="bg-[#1c1c1f] border-none h-12 rounded-xl [color-scheme:dark]" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date (Optional)</Label>
                  <Input 
                    type="date" 
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    disabled={loading}
                    className="bg-[#1c1c1f] border-none h-12 rounded-xl [color-scheme:dark]" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                  className="bg-[#1c1c1f] border-none rounded-xl min-h-[80px]" 
                  placeholder="Brief context about this record..." 
                />
              </div>

              {!loading ? (
                <div 
                  className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-800 rounded-2xl bg-[#1c1c1f]/50 cursor-pointer hover:border-primary/50 transition-colors" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange} 
                  />
                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <ShieldCheck className="text-primary h-12 w-12" />
                      <span className="text-sm font-bold text-primary truncate max-w-[300px]">{selectedFile.name}</span>
                      <span className="text-[10px] text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Upload className="text-gray-500 h-12 w-12 mb-2" />
                      <span className="text-xs text-gray-500">Click to select (Up to 500MB)</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-primary">
                    <span>Uploading to Secure Storage...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              <DialogFooter className="pb-4">
                <Button 
                  type="submit" 
                  disabled={loading || !selectedFile || !docName} 
                  className="w-full h-12 bg-primary hover:bg-primary/90 font-bold rounded-xl border-none shadow-lg shadow-primary/20"
                >
                  {loading ? <RefreshCw className="animate-spin h-4 w-4 mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                  {loading ? 'Encrypting & Storing...' : 'Securely Upload Document'}
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
            placeholder="Search vault (name or tags)..." 
            className="pl-10 h-11 bg-card/50 border-none rounded-xl" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px] h-11 bg-card/50 border-none rounded-xl">
              <Filter className="mr-2 h-4 w-4 opacity-50" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="All">All Categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {docsLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-primary h-8 w-8" />
        </div>
      ) : documents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {documents.map((doc: any) => (
            <Card key={doc.id} className="group bg-card/40 border-none shadow-md hover:shadow-2xl transition-all overflow-hidden rounded-[24px] animate-in fade-in zoom-in duration-300">
              <CardContent className="p-0">
                <div className="h-32 bg-gradient-to-br from-primary/10 to-accent/5 flex items-center justify-center relative">
                  <div className="p-4 rounded-2xl bg-background/50 backdrop-blur-sm text-primary">
                    {getCategoryIcon(doc.category)}
                  </div>
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      onClick={() => handleDelete(doc)} 
                      className="bg-red-500/10 text-red-500 h-8 w-8 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="font-bold truncate text-base mb-1">{doc.documentName}</h4>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{doc.category}</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(doc.tags || []).map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-[9px] px-2 h-5 bg-primary/10 text-primary border-none font-bold">
                        <Users className="h-2.5 w-2.5 mr-1" /> {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t border-border/50">
                    <div className="space-y-0.5">
                      <span className="text-muted-foreground block uppercase tracking-tighter">Issued</span>
                      <span className="font-bold">{doc.issueDate || 'Not Set'}</span>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <span className="text-muted-foreground block uppercase tracking-tighter">Expires</span>
                      <span className={doc.expiryDate ? "font-bold text-red-400" : "font-bold"}>{doc.expiryDate || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1 h-9 text-[11px] font-bold rounded-xl gap-2 hover:bg-primary hover:text-white" onClick={() => setPreviewDoc({ url: doc.fileUrl, name: doc.documentName })}>
                      <Eye className="h-3.5 w-3.5" /> View
                    </Button>
                    <Button variant="outline" className="flex-1 h-9 text-[11px] font-bold rounded-xl gap-2 hover:bg-accent hover:text-white" asChild>
                      <a href={doc.fileUrl} download={doc.documentName} target="_blank" rel="noopener noreferrer">
                        <Download className="h-3.5 w-3.5" /> Download
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex h-96 flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-[32px] bg-card/20 text-muted-foreground gap-4">
          <div className="p-6 rounded-full bg-primary/5">
            <ShieldCheck className="h-16 w-16 opacity-20 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-headline text-xl font-bold text-foreground">Secure Vault Empty</p>
            <p className="text-sm mt-1 max-w-[250px] mx-auto">Sensitive files are stored in your encrypted cloud vault with support for files up to 500MB.</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="mt-4 gap-2 rounded-xl px-6 h-11 font-bold">
            <Plus className="h-4 w-4" /> Upload First Document
          </Button>
        </div>
      )}

      {/* Full-screen Document Preview */}
      <Dialog open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-[90vw] h-[90vh] p-0 bg-[#0f1115] text-white border-none rounded-2xl overflow-hidden flex flex-col">
          <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#1a1c21]">
            <div className="flex items-center gap-3">
              <Lock className="text-primary h-5 w-5" />
              <DialogTitle className="truncate font-bold text-sm max-w-md">{previewDoc?.name}</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setPreviewDoc(null)} className="hover:bg-white/10">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 bg-black/40">
            {previewDoc?.url && (
              <iframe 
                src={previewDoc.url} 
                className="w-full h-full border-none"
                title={previewDoc.name}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </CRMLayout>
  )
}
