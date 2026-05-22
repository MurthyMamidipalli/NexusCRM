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
  Globe,
  Lock,
  AlertTriangle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import { collections, deleteRecord, createRecord, updateRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors'

// Firestore Limit: 1MB. Base64 adds ~37%. 700KB is the safe maximum.
const MAX_FILE_SIZE = 700000; 

export default function DocumentsPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [visibility, setVisibility] = useState<string>("Private")
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null)
  const [fileData, setFileData] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const docsQuery = useMemo(() => {
    if (!db || !user) return null
    return query(collection(db, collections.DOCUMENTS), where('ownerId', '==', user.uid))
  }, [db, user])

  const { data: rawDocuments, loading: docsLoading } = useCollection(docsQuery)

  const documents = useMemo(() => {
    if (!rawDocuments) return []
    // Tiebreaker sorting to handle simultaneous timestamps
    return [...rawDocuments].sort((a: any, b: any) => {
      const timeA = a.updatedAt?.seconds || 0;
      const timeB = b.updatedAt?.seconds || 0;
      if (timeA !== timeB) return timeB - timeA;
      return (b.id || '').localeCompare(a.id || '');
    })
  }, [rawDocuments])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.size > MAX_FILE_SIZE) {
      toast({ 
        variant: 'destructive', 
        title: 'File Too Large', 
        description: 'Database limit is 700KB. For larger files, please use external links.' 
      })
      e.target.value = '';
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => setFileData(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSaveDoc = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db) return
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      status: formData.get('status') as string || 'Active',
      visibility: visibility,
      isPublic: visibility === 'Public',
      fileUrl: fileData || editingDoc?.fileUrl || '',
      fileName: editingDoc?.fileName || 'document.pdf',
      ownerId: user.uid
    }
    
    // Snappy UI: Close immediately
    const wasEditing = !!editingDoc;
    const currentId = editingDoc?.id;
    
    toast({ title: wasEditing ? 'Updating Document...' : 'Saving to Vault...' })
    setIsDialogOpen(false)
    reset()
    setLoading(false)

    try {
      if (wasEditing) {
        await updateRecord(db, collections.DOCUMENTS, currentId, data)
      } else {
        await createRecord(db, collections.DOCUMENTS, data, user.uid)
      }
    } catch (err: any) {
      const permissionError = new FirestorePermissionError({
        path: wasEditing ? `${collections.DOCUMENTS}/${currentId}` : collections.DOCUMENTS,
        operation: wasEditing ? 'update' : 'create',
        requestResourceData: data,
        originalError: err
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    }
  }

  const reset = () => { 
    setEditingDoc(null); 
    setFileData(''); 
    setVisibility("Private"); 
  }

  return (
    <CRMLayout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">📁 Document Vault</h1>
          <p className="text-muted-foreground">Secure storage for multiple professional assets.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(o) => { setIsDialogOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary shadow-lg shadow-primary/20">
              <Upload className="h-4 w-4" /> Upload File
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] bg-[#121214] text-white border-none p-8 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold font-headline">
                {editingDoc ? 'Edit Metadata' : 'Upload to Vault'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Max 700KB per file. Items marked Public will appear on your Hub.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveDoc} className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label>Document Name</Label>
                <Input name="name" defaultValue={editingDoc?.name} required className="bg-[#1c1c1f] border-none rounded-xl h-12" placeholder="e.g. Portfolio PDF" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input name="category" defaultValue={editingDoc?.category} required className="bg-[#1c1c1f] border-none rounded-xl h-12" placeholder="e.g. Identity" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select name="status" defaultValue={editingDoc?.status || 'Active'}>
                    <SelectTrigger className="bg-[#1c1c1f] border-none rounded-xl h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1c1c1f] border-gray-800 text-white">
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Visibility (Mandatory)</Label>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger className="bg-[#1c1c1f] border-none rounded-xl h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1c1c1f] border-gray-800 text-white">
                    <SelectItem value="Private">🔒 Private (Vault Only)</SelectItem>
                    <SelectItem value="Public">🌍 Public (Shared on Hub)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div 
                className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-800 rounded-2xl bg-[#1c1c1f]/50 cursor-pointer hover:border-primary/50 transition-colors" 
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="application/pdf,image/*" />
                {fileData ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="text-primary h-12 w-12" />
                    <span className="text-xs font-bold text-primary">New File Ready</span>
                  </div>
                ) : editingDoc?.fileUrl ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="text-primary/50 h-12 w-12" />
                    <span className="text-xs font-bold text-gray-500">File Already Stored</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Upload className="text-gray-500 h-12 w-12 mb-2" />
                    <span className="text-xs text-gray-500">Click to Upload (Max 700KB)</span>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="submit" disabled={loading} className="w-full h-12 bg-primary hover:bg-primary/90 font-bold rounded-xl border-none">
                  {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Save Record'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
                  <Badge variant="outline" className="absolute top-4 left-4 bg-black/40 border-white/10 text-[10px] uppercase font-bold tracking-widest">
                    {doc.isPublic ? <Globe className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                    {doc.isPublic ? 'Public' : 'Private'}
                  </Badge>
                  <FileText className="h-12 w-12 text-primary opacity-20" />
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingDoc(doc); setIsDialogOpen(true); setVisibility(doc.visibility || (doc.isPublic ? 'Public' : 'Private')); }} className="bg-background/80 h-8 w-8 rounded-lg">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        deleteRecord(db, collections.DOCUMENTS, doc.id)
                        toast({ title: 'Document Removed' })
                      }} 
                      className="bg-background/80 text-destructive h-8 w-8 rounded-lg hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="font-bold truncate text-sm">{doc.name}</h4>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">{doc.category}</p>
                  <div className="flex justify-between items-center mt-4 border-t border-border/50 pt-4">
                    <Badge variant="secondary" className="text-[9px] uppercase">{doc.status}</Badge>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl" asChild>
                        <a href={doc.fileUrl} download={doc.fileName || 'document.pdf'}>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setPreviewDoc({ url: doc.fileUrl, name: doc.name })}>
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
          <p className="italic text-sm">Vault Empty. Upload your first document.</p>
        </div>
      )}

      {/* Full-screen Document Preview */}
      <Dialog open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-[90vw] h-[90vh] p-0 bg-[#0f1115] text-white border-none rounded-2xl overflow-hidden flex flex-col">
          <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#1a1c21]">
            <div className="flex items-center gap-3">
              <FileText className="text-primary h-5 w-5" />
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