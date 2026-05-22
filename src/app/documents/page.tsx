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
  Filter,
  X,
  Globe,
  Lock
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
    return [...rawDocuments].sort((a: any, b: any) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
  }, [rawDocuments])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1048576) {
      toast({ variant: 'destructive', title: 'File Too Large', description: 'Max 1MB allowed.' })
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => setFileData(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSaveDoc = (e: React.FormEvent<HTMLFormElement>) => {
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
    
    const mutation = editingDoc 
      ? updateRecord(db, collections.DOCUMENTS, editingDoc.id, data) 
      : createRecord(db, collections.DOCUMENTS, data, user.uid)
    
    // Snappy UI Optimization
    toast({ title: 'Saved' })
    setIsDialogOpen(false)
    reset()
    setLoading(false)

    mutation.catch(async (err: any) => {
      const permissionError = new FirestorePermissionError({
        path: editingDoc ? `${collections.DOCUMENTS}/${editingDoc.id}` : collections.DOCUMENTS,
        operation: editingDoc ? 'update' : 'create',
        requestResourceData: data,
        originalError: err
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    })
  }

  const reset = () => { setEditingDoc(null); setFileData(''); setVisibility("Private"); }

  return (
    <CRMLayout>
      <div className="mb-8 flex justify-between items-center">
        <div><h1 className="font-headline text-4xl font-bold">📁 Document Vault</h1><p className="text-muted-foreground">Secure professional asset storage.</p></div>
        <Dialog open={isDialogOpen} onOpenChange={(o) => { setIsDialogOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild><Button className="gap-2 bg-primary"><Upload className="h-4 w-4" /> Upload File</Button></DialogTrigger>
          <DialogContent className="sm:max-w-[550px] bg-[#121214] text-white border-none p-8 rounded-2xl">
            <DialogHeader><DialogTitle>{editingDoc ? 'Edit Metadata' : 'Upload to Vault'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSaveDoc} className="space-y-6">
              <div className="space-y-2"><Label>Name</Label><Input name="name" defaultValue={editingDoc?.name} required className="bg-[#1c1c1f] border-none rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Category</Label><Input name="category" defaultValue={editingDoc?.category} required className="bg-[#1c1c1f] border-none rounded-xl" /></div><div className="space-y-2"><Label>Status</Label><Select name="status" defaultValue={editingDoc?.status || 'Active'}><SelectTrigger className="bg-[#1c1c1f] border-none rounded-xl"><SelectValue /></SelectTrigger><SelectContent className="bg-[#1c1c1f] border-gray-800 text-white"><SelectItem value="Active">Active</SelectItem><SelectItem value="Archived">Archived</SelectItem></SelectContent></Select></div></div>
              <div className="space-y-2"><Label>Visibility (Mandatory)</Label><Select value={visibility} onValueChange={setVisibility}><SelectTrigger className="bg-[#1c1c1f] border-none rounded-xl"><SelectValue /></SelectTrigger><SelectContent className="bg-[#1c1c1f] border-gray-800 text-white"><SelectItem value="Private">🔒 Private (Vault Only)</SelectItem><SelectItem value="Public">🌍 Public (Shared on Hub)</SelectItem></SelectContent></Select></div>
              <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-800 rounded-2xl bg-[#1c1c1f]/50 cursor-pointer" onClick={() => fileInputRef.current?.click()}><input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />{fileData ? <CheckCircle2 className="text-primary h-10 w-10" /> : <Upload className="text-gray-500 h-10 w-10" />}</div>
              <DialogFooter><Button type="submit" disabled={loading} className="w-full h-12 bg-primary">{loading ? <Loader2 className="animate-spin" /> : 'Save Record'}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {docsLoading ? <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div> : documents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {documents.map((doc: any) => (
            <Card key={doc.id} className="group overflow-hidden bg-card/40 border-none shadow-md">
              <CardContent className="p-0">
                <div className="h-32 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center relative">
                  <Badge variant="outline" className="absolute top-4 left-4 bg-black/40">{doc.isPublic ? '🌍 Public' : '🔒 Private'}</Badge>
                  <FileText className="h-12 w-12 text-primary opacity-20" />
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><Button variant="ghost" size="icon" onClick={() => { setEditingDoc(doc); setIsDialogOpen(true); setVisibility(doc.visibility || "Private"); }} className="bg-background/80"><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => {
                    deleteRecord(db, collections.DOCUMENTS, doc.id).catch(async (err: any) => {
                      const permissionError = new FirestorePermissionError({
                        path: `${collections.DOCUMENTS}/${doc.id}`,
                        operation: 'delete',
                        originalError: err
                      } satisfies SecurityRuleContext);
                      errorEmitter.emit('permission-error', permissionError);
                    })
                    toast({ title: 'Removed' })
                  }} className="bg-background/80 text-destructive"><Trash2 className="h-4 w-4" /></Button></div>
                </div>
                <div className="p-5"><h4 className="font-bold truncate">{doc.name}</h4><p className="text-[10px] text-muted-foreground uppercase mt-1">{doc.category}</p><div className="flex justify-between items-center mt-4 border-t pt-4"><Badge variant="outline">{doc.status}</Badge><div className="flex gap-2"><Button variant="outline" size="icon" className="h-7 w-7 rounded-full" asChild><a href={doc.fileUrl} download><Download className="h-3.5 w-3.5" /></a></Button><Button variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={() => setPreviewDoc({ url: doc.fileUrl, name: doc.name })}><Eye className="h-3.5 w-3.5" /></Button></div></div></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : <div className="flex h-64 items-center justify-center border-2 border-dashed rounded-3xl italic text-muted-foreground"><FileBox className="mr-2" /> Vault Empty</div>}

      <Dialog open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)}><DialogContent className="sm:max-w-[90vw] h-[90vh] p-0 bg-[#0f1115] text-white border-none rounded-2xl overflow-hidden flex flex-col"><div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#1a1c21]"><div className="flex items-center gap-3"><FileText className="text-primary" /><DialogTitle>{previewDoc?.name}</DialogTitle></div><Button variant="ghost" onClick={() => setPreviewDoc(null)}><X /></Button></div><div className="flex-1">{previewDoc?.url && <iframe src={previewDoc.url} className="w-full h-full border-none" />}</div></DialogContent></Dialog>
    </CRMLayout>
  )
}
