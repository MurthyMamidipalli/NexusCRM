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
  Calendar,
  Tag,
  CreditCard,
  FileText,
  FileDigit,
  Plane,
  Home,
  Briefcase,
  AlertCircle,
  X,
  Plus
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useFirestore, useCollection, useUser, useStorage } from '@/firebase'
import { collection, query, where, orderBy } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { collections, deleteRecord, createRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

export default function PrivateDocumentsPage() {
  const db = useFirestore()
  const storage = useStorage()
  const { user } = useUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('All')
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const docsQuery = useMemo(() => {
    if (!db || !user) return null
    return query(
      collection(db, collections.PRIVATE_DOCUMENTS), 
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
  }, [db, user])

  const { data: rawDocuments, loading: docsLoading } = useCollection(docsQuery)

  const documents = useMemo(() => {
    if (!rawDocuments) return []
    return rawDocuments.filter((doc: any) => {
      const matchesSearch = doc.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.tags?.some((t: string) => t.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCategory = filterCategory === 'All' || doc.category === filterCategory
      return matchesSearch && matchesCategory
    })
  }, [rawDocuments, searchTerm, filterCategory])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db || !storage || !selectedFile) return
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const fileName = formData.get('documentName') as string
    const category = formData.get('category') as string
    
    try {
      // 1. Upload to Firebase Storage
      const filePath = `private_vault/${user.uid}/${Date.now()}_${selectedFile.name}`
      const storageRef = ref(storage, filePath)
      const uploadResult = await uploadBytes(storageRef, selectedFile)
      const fileUrl = await getDownloadURL(uploadResult.ref)

      // 2. Create Firestore Record
      const data = {
        documentName: fileName,
        category: category,
        description: formData.get('description') as string,
        issueDate: formData.get('issueDate') as string,
        expiryDate: formData.get('expiryDate') as string,
        tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(t => t),
        fileUrl: fileUrl,
        filePath: filePath,
        ownerId: user.uid
      }

      await createRecord(db, collections.PRIVATE_DOCUMENTS, data, user.uid)
      
      toast({ title: 'Document Secured', description: 'Your file has been encrypted and stored in the vault.' })
      setIsDialogOpen(false)
      setSelectedFile(null)
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Upload Failed', description: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (doc: any) => {
    if (!db || !storage || !confirm('Are you sure you want to permanently delete this document?')) return
    
    try {
      // Delete from Storage
      const storageRef = ref(storage, doc.filePath)
      await deleteObject(storageRef).catch(e => console.warn("Storage deletion error (might not exist):", e))
      
      // Delete from Firestore
      await deleteRecord(db, collections.PRIVATE_DOCUMENTS, doc.id)
      toast({ title: 'Document Removed', description: 'The record has been purged from the vault.' })
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Deletion Failed', description: err.message })
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
          <p className="text-muted-foreground">Secure, encrypted storage for your most sensitive documents.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(o) => { setIsDialogOpen(o); if(!o) setSelectedFile(null); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary shadow-lg shadow-primary/20 h-12 px-6 rounded-xl">
              <Upload className="h-4 w-4" /> Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-[#121214] text-white border-none rounded-2xl p-0 overflow-hidden">
            <DialogHeader className="p-8 pb-0">
              <DialogTitle className="text-2xl font-bold font-headline">Secure Upload</DialogTitle>
              <DialogDescription className="text-gray-400">Items in this vault are never visible to the public.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpload} className="p-8 pt-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>Document Name</Label>
                <Input name="documentName" required className="bg-[#1c1c1f] border-none h-12 rounded-xl" placeholder="e.g. Passport 2024" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select name="category" defaultValue="Other Documents">
                    <SelectTrigger className="bg-[#1c1c1f] border-none h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1c1c1f] border-gray-800 text-white">
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Issue Date (Optional)</Label>
                  <Input name="issueDate" type="date" className="bg-[#1c1c1f] border-none h-12 rounded-xl [color-scheme:dark]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expiry Date (Optional)</Label>
                  <Input name="expiryDate" type="date" className="bg-[#1c1c1f] border-none h-12 rounded-xl [color-scheme:dark]" />
                </div>
                <div className="space-y-2">
                  <Label>Tags (Comma separated)</Label>
                  <Input name="tags" placeholder="important, personal" className="bg-[#1c1c1f] border-none h-12 rounded-xl" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea name="description" className="bg-[#1c1c1f] border-none rounded-xl min-h-[80px]" placeholder="Brief context about this document..." />
              </div>

              <div 
                className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-800 rounded-2xl bg-[#1c1c1f]/50 cursor-pointer hover:border-primary/50 transition-colors" 
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} required />
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <ShieldCheck className="text-primary h-12 w-12" />
                    <span className="text-sm font-bold text-primary truncate max-w-[300px]">{selectedFile.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Upload className="text-gray-500 h-12 w-12 mb-2" />
                    <span className="text-xs text-gray-500">Click to Select File</span>
                  </div>
                )}
              </div>

              <DialogFooter className="pb-4">
                <Button type="submit" disabled={loading} className="w-full h-12 bg-primary hover:bg-primary/90 font-bold rounded-xl border-none">
                  {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Securely Upload'}
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
            placeholder="Search vault by name or tags..." 
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
            <SelectContent>
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
            <Card key={doc.id} className="group bg-card/40 border-none shadow-md hover:shadow-2xl transition-all overflow-hidden rounded-[24px]">
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
                      className="bg-red-500/10 text-red-500 h-8 w-8 rounded-lg hover:bg-red-500 hover:text-white"
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
                    {doc.tags?.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 h-4 bg-primary/5 text-primary border-none">
                        <Tag className="h-2 w-2 mr-1" /> {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t border-border/50">
                    <div className="space-y-0.5">
                      <span className="text-muted-foreground block uppercase tracking-tighter">Issued</span>
                      <span className="font-bold">{doc.issueDate || '-'}</span>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <span className="text-muted-foreground block uppercase tracking-tighter">Expires</span>
                      <span className={doc.expiryDate ? "font-bold text-red-400" : "font-bold"}>{doc.expiryDate || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1 h-9 text-[11px] font-bold rounded-xl gap-2" onClick={() => setPreviewDoc({ url: doc.fileUrl, name: doc.documentName })}>
                      <Eye className="h-3.5 w-3.5" /> View
                    </Button>
                    <Button variant="outline" className="flex-1 h-9 text-[11px] font-bold rounded-xl gap-2" asChild>
                      <a href={doc.fileUrl} download={doc.documentName}>
                        <Download className="h-3.5 w-3.5" /> Get
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
            <p className="font-headline text-xl font-bold text-foreground">Vault is Empty</p>
            <p className="text-sm mt-1 max-w-[250px] mx-auto">Start securing your identity and property documents today.</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="mt-4 gap-2 rounded-xl">
            <Plus className="h-4 w-4" /> Upload First Item
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
            <Button variant="ghost" size="icon" onClick={() => setPreviewDoc(null)}>
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
