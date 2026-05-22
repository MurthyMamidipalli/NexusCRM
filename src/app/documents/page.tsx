
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
  Search,
  Loader2,
  FileBox,
  LayoutGrid,
  List,
  Pencil,
  Eye,
  CheckCircle2,
  Filter,
  X
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, orderBy, where } from 'firebase/firestore'
import { collections, deleteRecord, createRecord, updateRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors'

export default function DocumentsPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All Documents')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [mounted, setMounted] = useState(false)

  // Preview State
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null)

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileData, setFileData] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const docsQuery = useMemo(() => {
    if (!db || !user) return null
    return query(
      collection(db, collections.DOCUMENTS), 
      where('ownerId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    )
  }, [db, user])

  const { data: documents, loading: docsLoading } = useCollection(docsQuery)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSize = 1024 * 1024 // 1MB for database sync
    if (file.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: 'Sync is limited to 1MB. Please compress or link the file.'
      })
      return
    }

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setFileData(reader.result as string)
      toast({ title: 'File Attached', description: `${file.name} is ready.` })
    }
    reader.readAsDataURL(file)
  }

  const handleSaveDoc = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db) return

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    let displaySize = editingDoc?.size || 'N/A'
    if (selectedFile) {
      const sizeInMB = selectedFile.size / (1024 * 1024)
      displaySize = sizeInMB < 1 ? `${(selectedFile.size / 1024).toFixed(1)} KB` : `${sizeInMB.toFixed(1)} MB`
    }

    const data = {
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      status: formData.get('status') as string || 'Active',
      size: displaySize,
      fileUrl: fileData || editingDoc?.fileUrl || '',
      fileName: selectedFile?.name || editingDoc?.fileName || '',
      ownerId: user.uid
    }

    const mutation = editingDoc 
      ? updateRecord(db, collections.DOCUMENTS, editingDoc.id, data)
      : createRecord(db, collections.DOCUMENTS, data, user.uid)

    mutation.catch(async (err) => {
      const permissionError = new FirestorePermissionError({
        path: editingDoc ? `${collections.DOCUMENTS}/${editingDoc.id}` : collections.DOCUMENTS,
        operation: editingDoc ? 'update' : 'create',
        requestResourceData: data,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    });

    toast({ title: editingDoc ? 'Updated' : 'Added to Vault' })
    setIsDialogOpen(false)
    setEditingDoc(null)
    setSelectedFile(null)
    setFileData('')
    setLoading(false)
  }

  const handleDelete = (id: string) => {
    if (!db) return
    deleteRecord(db, collections.DOCUMENTS, id)
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: `${collections.DOCUMENTS}/${id}`,
          operation: 'delete',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
    toast({ title: 'Document Removed' })
  }

  const filteredDocs = useMemo(() => {
    if (!documents) return []
    return documents.filter((doc: any) => {
      const matchesSearch = doc.name?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === 'All Documents' || doc.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [documents, searchQuery, categoryFilter])

  const categories = useMemo(() => {
    if (!documents) return []
    const set = new Set(documents.map((d: any) => d.category).filter(Boolean))
    return Array.from(set) as string[]
  }, [documents])

  if (!mounted) return null

  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">📁 Document Vault</h1>
          <p className="text-muted-foreground">Secure storage for your professional assets.</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingDoc(null);
              setSelectedFile(null);
              setFileData('');
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => setEditingDoc(null)}>
                <Upload className="h-4 w-4" />
                Upload File
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>{editingDoc ? 'Edit Metadata' : 'Upload to Vault'}</DialogTitle>
                <DialogDescription>Store your important documents securely in the cloud.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveDoc} className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Document Name</Label>
                  <Input id="name" name="name" defaultValue={editingDoc?.name || ''} placeholder="e.g. Annual Contract 2024" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input id="category" name="category" defaultValue={editingDoc?.category || ''} placeholder="e.g. Invoices" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue={editingDoc?.status || "Active"}>
                      <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Signed">Signed</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Document Attachment (Max 1MB)</Label>
                  <div 
                    className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-10 transition-all hover:border-primary/50 cursor-pointer bg-muted/30"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                    {selectedFile || editingDoc?.fileName ? (
                      <div className="flex flex-col items-center">
                        <CheckCircle2 className="h-10 w-10 text-primary mb-2" />
                        <span className="text-sm font-bold text-foreground line-clamp-1">{selectedFile?.name || editingDoc?.fileName}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                        <span className="text-sm font-semibold">Click to select file</span>
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={loading} className="w-full h-12 text-md font-bold">
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Save Record'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-card/30 p-4 rounded-2xl border border-border/50 backdrop-blur-md shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              className="pl-10 bg-background/50 border-border/50 h-11 focus:ring-primary/20" 
              placeholder="Search documents..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-64">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-11 bg-background/50 border-border/50">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Category" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Documents">All Documents</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {docsLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredDocs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredDocs.map((doc: any) => (
              <Card key={doc.id} className="group hover:border-primary/50 transition-all shadow-md bg-card/40 border-none backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="h-32 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center border-b border-border/30 relative">
                    <FileText className="h-12 w-12 text-primary opacity-20" />
                    <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary bg-background/80" onClick={() => { setEditingDoc(doc); setIsDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive bg-background/80" onClick={() => handleDelete(doc.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div className="p-5">
                    <h4 className="text-sm font-bold truncate" title={doc.name}>{doc.name}</h4>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">{doc.size || 'N/A'} • {doc.category || 'General'}</p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                      <Badge variant="outline" className="text-[9px] uppercase">{doc.status || 'Active'}</Badge>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-full" disabled={!doc.fileUrl} asChild><a href={doc.fileUrl} download={doc.fileName || 'document'}><Download className="h-3.5 w-3.5" /></a></Button>
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-full" disabled={!doc.fileUrl} onClick={() => setPreviewDoc({ url: doc.fileUrl, name: doc.name })}><Eye className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 rounded-3xl border-2 border-dashed border-border/50 bg-card/10">
            <FileBox className="h-16 w-16 text-muted-foreground/30 mb-6" />
            <h3 className="text-2xl font-bold font-headline mb-2 text-foreground/80">Vault Empty</h3>
            <p className="text-muted-foreground text-center max-w-sm px-4">Upload contracts, invoices, or legal paperwork to your cloud vault.</p>
          </div>
        )}
      </div>

      {/* Professional File Previewer Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-[90vw] h-[90vh] p-0 bg-[#0f1115] text-white border-none rounded-2xl overflow-hidden flex flex-col">
          <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#1a1c21]">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <DialogTitle className="font-bold text-sm truncate max-w-[200px] md:max-w-md">
                {previewDoc?.name || 'Document Preview'}
              </DialogTitle>
            </div>
            <DialogDescription className="sr-only">
              Securely previewing document in full screen mode.
            </DialogDescription>
            <Button variant="ghost" size="icon" onClick={() => setPreviewDoc(null)} className="h-8 w-8 hover:bg-white/5">
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
