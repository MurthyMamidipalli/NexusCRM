"use client"

import React, { useMemo, useState, useRef, useEffect } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Loader2, 
  Trash2, 
  Calendar, 
  ShieldCheck, 
  Folder, 
  ExternalLink, 
  FileText, 
  Link as LinkIcon, 
  FileSpreadsheet,
  Pencil,
  Upload,
  CheckCircle2,
  Eye,
  X,
  Globe,
  Lock
} from 'lucide-react'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import { collections, deleteRecord, createRecord, updateRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

export default function CertificationsPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCert, setEditingCert] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState<string>("Course Certificate")
  const [visibility, setVisibility] = useState<string>("Private")
  const [documentData, setDocumentData] = useState<string>('')
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const certQuery = useMemo(() => {
    if (!db || !user) return null
    return query(collection(db, collections.CERTIFICATIONS), where('ownerId', '==', user.uid))
  }, [db, user])

  const { data: rawCertifications, loading: certLoading } = useCollection(certQuery)

  const certifications = useMemo(() => {
    if (!rawCertifications) return []
    return [...rawCertifications].sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''))
  }, [rawCertifications])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setDocumentData(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSaveCert = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db) return
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get('title') as string,
      issuer: formData.get('issuer') as string,
      date: formData.get('date') as string,
      category, visibility, isPublic: visibility === 'Public',
      externalLink: formData.get('externalLink') as string,
      documentUrl: documentData || editingCert?.documentUrl || '',
    }
    const mutation = editingCert ? updateRecord(db, collections.CERTIFICATIONS, editingCert.id, data) : createRecord(db, collections.CERTIFICATIONS, data, user.uid)
    mutation.then(() => { toast({ title: 'Saved' }); setIsDialogOpen(false); reset(); }).finally(() => setLoading(false))
  }

  const reset = () => { setEditingCert(null); setDocumentData(''); setVisibility("Private"); }

  return (
    <CRMLayout>
      <div className="mb-8 flex justify-between items-center">
        <div><h1 className="font-headline text-4xl font-bold">🏆 Credentials & Grade Sheets</h1><p className="text-muted-foreground">Secure vault for academic records.</p></div>
        <Dialog open={isDialogOpen} onOpenChange={(o) => { setIsDialogOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild><Button className="gap-2 shadow-lg shadow-primary/20"><Plus className="h-4 w-4" /> Add Record</Button></DialogTrigger>
          <DialogContent className="sm:max-w-[550px] bg-[#121214] text-white border-none p-8 rounded-2xl">
            <DialogHeader><DialogTitle>{editingCert ? 'Edit Credential' : 'Add New Credential'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSaveCert} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Type</Label><Select defaultValue={editingCert?.category || "Course Certificate"} onValueChange={setCategory}><SelectTrigger className="bg-[#1c1c1f] border-none"><SelectValue /></SelectTrigger><SelectContent className="bg-[#1c1c1f] text-white"><SelectItem value="Study Certificate">Study Certificate</SelectItem><SelectItem value="Course Certificate">Course Certificate</SelectItem><SelectItem value="Grade Sheet">Grade Sheet</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Visibility (Mandatory)</Label><Select value={visibility} onValueChange={setVisibility}><SelectTrigger className="bg-[#1c1c1f] border-none"><SelectValue /></SelectTrigger><SelectContent className="bg-[#1c1c1f] text-white"><SelectItem value="Private">🔒 Private</SelectItem><SelectItem value="Public">🌍 Public</SelectItem></SelectContent></Select></div></div>
              <div className="space-y-2"><Label>Title</Label><Input name="title" defaultValue={editingCert?.title} required className="bg-[#1c1c1f] border-none rounded-xl" /></div>
              <div className="space-y-2"><Label>Issuer</Label><Input name="issuer" defaultValue={editingCert?.issuer} required className="bg-[#1c1c1f] border-none rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Date</Label><Input name="date" type="date" defaultValue={editingCert?.date} required className="bg-[#1c1c1f] border-none rounded-xl [color-scheme:dark]" /></div><div className="space-y-2"><Label>Verify Link</Label><Input name="externalLink" defaultValue={editingCert?.externalLink} className="bg-[#1c1c1f] border-none rounded-xl" /></div></div>
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-800 rounded-2xl bg-[#1c1c1f]/50 cursor-pointer" onClick={() => fileInputRef.current?.click()}><input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />{documentData ? <CheckCircle2 className="text-primary" /> : <Upload className="text-gray-500" />}</div>
              <DialogFooter><Button type="submit" disabled={loading} className="w-full bg-primary h-12 rounded-xl">{loading ? <Loader2 className="animate-spin" /> : 'Save Record'}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {certLoading ? <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div> : (
        <Tabs defaultValue="study" className="space-y-8">
          <TabsList className="bg-card/30 p-1 rounded-2xl border border-border/50"><TabsTrigger value="study">Study</TabsTrigger><TabsTrigger value="course">Course</TabsTrigger><TabsTrigger value="grades">Grades</TabsTrigger></TabsList>
          <TabsContent value="study"><CertGrid items={certifications.filter(c => c.category === 'Study Certificate')} onDelete={(id) => deleteRecord(db, collections.CERTIFICATIONS, id)} onEdit={(c) => { setEditingCert(c); setIsDialogOpen(true); setCategory(c.category); setVisibility(c.visibility); }} onPreview={(u, n) => setPreviewDoc({ url: u, name: n })} /></TabsContent>
          <TabsContent value="course"><CertGrid items={certifications.filter(c => c.category === 'Course Certificate')} onDelete={(id) => deleteRecord(db, collections.CERTIFICATIONS, id)} onEdit={(c) => { setEditingCert(c); setIsDialogOpen(true); setCategory(c.category); setVisibility(c.visibility); }} onPreview={(u, n) => setPreviewDoc({ url: u, name: n })} /></TabsContent>
          <TabsContent value="grades"><CertGrid items={certifications.filter(c => c.category === 'Grade Sheet')} onDelete={(id) => deleteRecord(db, collections.CERTIFICATIONS, id)} onEdit={(c) => { setEditingCert(c); setIsDialogOpen(true); setCategory(c.category); setVisibility(c.visibility); }} onPreview={(u, n) => setPreviewDoc({ url: u, name: n })} /></TabsContent>
        </Tabs>
      )}

      <Dialog open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)}><DialogContent className="sm:max-w-[90vw] h-[90vh] p-0 bg-[#0f1115] border-none rounded-2xl overflow-hidden flex flex-col"><div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#1a1c21]"><div className="flex items-center gap-3"><ShieldCheck className="text-primary" /><DialogTitle className="truncate">{previewDoc?.name}</DialogTitle></div><Button variant="ghost" onClick={() => setPreviewDoc(null)}><X /></Button></div><div className="flex-1">{previewDoc?.url && <iframe src={previewDoc.url} className="w-full h-full border-none" />}</div></DialogContent></Dialog>
    </CRMLayout>
  )
}

function CertGrid({ items, onDelete, onEdit, onPreview }: any) {
  if (items.length === 0) return <div className="flex h-64 items-center justify-center border-2 border-dashed rounded-xl italic text-muted-foreground">No records found.</div>
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((c: any) => (
        <Card key={c.id} className="group border-none bg-card/50 backdrop-blur-md shadow-md hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex justify-between items-start"><div className="space-y-2"><div className="p-3 rounded-2xl bg-primary/10 text-primary w-fit">{c.category === 'Grade Sheet' ? <FileSpreadsheet /> : <ShieldCheck />}</div><Badge variant="outline">{c.isPublic ? '🌍 Public' : '🔒 Private'}</Badge></div><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><Button variant="ghost" size="icon" onClick={() => onEdit(c)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => onDelete(c.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button></div></div>
            <div className="mt-4"><h3 className="font-bold text-lg">{c.title}</h3><p className="text-sm font-semibold text-primary">{c.issuer}</p></div>
            <div className="mt-6 border-t pt-4 grid grid-cols-2 gap-2"><Button variant="outline" size="sm" className="h-8 text-[11px] font-bold" asChild={!!c.externalLink} disabled={!c.externalLink}>{c.externalLink ? <a href={c.externalLink} target="_blank"><ExternalLink className="mr-1 h-3 w-3" /> Verify</a> : <span>Verify</span>}</Button><Button variant="outline" size="sm" className="h-8 text-[11px] font-bold" onClick={() => c.documentUrl && onPreview(c.documentUrl, c.title)} disabled={!c.documentUrl}><Eye className="mr-1 h-3 w-3" /> View</Button></div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}