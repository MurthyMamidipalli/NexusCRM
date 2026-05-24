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
  ExternalLink, 
  Pencil,
  Upload,
  CheckCircle2,
  Eye,
  X,
  FileSpreadsheet,
  Globe,
  Lock,
  AlertCircle
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
import { Progress } from '@/components/ui/progress'
import { uploadToSupabaseStorage, validateFile } from '@/lib/storage-service'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors'
import { supabase } from '@/lib/supabase'

export default function CertificationsPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCert, setEditingCert] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [activeTab, setActiveTab] = useState<string>("study")
  
  const [category, setCategory] = useState<string>("Study Certificate")
  const [visibility, setVisibility] = useState<string>("Private")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isDialogOpen && !editingCert) {
      if (activeTab === "grades") setCategory("Grade Sheet");
      else if (activeTab === "study") setCategory("Study Certificate");
      else setCategory("Course Certificate");
    }
  }, [isDialogOpen, activeTab, editingCert]);

  const certQuery = useMemo(() => {
    if (!db || !user) return null
    return query(collection(db, collections.CERTIFICATIONS), where('ownerId', '==', user.uid))
  }, [db, user])

  const { data: rawCertifications, loading: certLoading } = useCollection(certQuery)

  const certifications = useMemo(() => {
    if (!rawCertifications) return []
    return [...rawCertifications].sort((a: any, b: any) => {
      const getVal = (doc: any) => {
        if (doc.updatedAt?.toMillis) return doc.updatedAt.toMillis();
        if (doc.updatedAt?.seconds) return doc.updatedAt.seconds * 1000;
        return Date.now() + 10000;
      }
      return getVal(b) - getVal(a);
    })
  }, [rawCertifications])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      validateFile(file);
      setSelectedFile(file)
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'File Error', description: err.message })
    }
  }

  const handleSaveCert = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db) return
    setLoading(true)
    setUploadProgress(0)

    const formData = new FormData(e.currentTarget)
    try {
      let documentUrl = editingCert?.documentUrl || ''
      let filePath = editingCert?.filePath || ''

      if (selectedFile) {
        const uploadResult = await uploadToSupabaseStorage(
          selectedFile, 
          `credentials/${user.uid}`,
          (p) => setUploadProgress(p)
        );
        
        documentUrl = uploadResult.downloadURL;
        filePath = uploadResult.storagePath;
      }

      const data = {
        title: formData.get('title') as string,
        issuer: formData.get('issuer') as string,
        date: formData.get('date') as string,
        category: category,
        visibility: visibility,
        isPublic: visibility === 'Public',
        externalLink: formData.get('externalLink') as string,
        documentUrl,
        filePath,
        ownerId: user.uid
      }

      const mutation = editingCert
        ? updateRecord(db, collections.CERTIFICATIONS, editingCert.id, data)
        : createRecord(db, collections.CERTIFICATIONS, data, user.uid);

      toast({ title: editingCert ? 'Updated' : 'Saved' })
      setIsDialogOpen(false)
      resetForm()

      mutation.catch(async (err: any) => {
        const permissionError = new FirestorePermissionError({
          path: editingCert ? `${collections.CERTIFICATIONS}/${editingCert.id}` : collections.CERTIFICATIONS,
          operation: 'write',
          requestResourceData: data,
          originalError: err
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })

    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Upload Failed', description: err.message });
    } finally {
      setLoading(false)
    }
  }

  const handlePreviewFile = async (cert: any) => {
    if (!cert.filePath || !supabase) {
      toast({ variant: 'destructive', title: 'Error', description: 'File path not found or service disconnected.' });
      return;
    }

    setViewingId(cert.id);
    try {
      let cleanPath = cert.filePath;
      if (cleanPath.startsWith('documents/')) {
        cleanPath = cleanPath.replace('documents/', '');
      }

      console.group('🔍 [Credential] Signed URL Diagnostic');
      const sessionRes = await supabase.auth.getSession();
      const userRes = await supabase.auth.getUser();
      console.log('Supabase Session:', sessionRes.data.session);
      console.log('Supabase User:', userRes.data.user);
      console.log('Bucket:', 'documents');
      console.log('File Path:', cleanPath);

      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(cleanPath, 3600);

      console.log('Signed URL Data:', data);
      if (error) {
        console.error('Signed URL Error Object:', error);
        console.log('Error Message:', error.message);
        if ((error as any).status) console.log('Error Status Code:', (error as any).status);
      }
      console.groupEnd();

      if (error) throw error;
      if (data?.signedUrl) {
        setPreviewDoc({ url: data.signedUrl, name: cert.title });
      } else {
        throw new Error('Signed URL was not generated.');
      }
    } catch (err: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Access Denied', 
        description: `Could not generate access link: ${err.message}` 
      });
    } finally {
      setViewingId(null);
    }
  };

  const resetForm = () => {
    setEditingCert(null)
    setSelectedFile(null)
    setUploadProgress(0)
  }

  const handleDelete = async (cert: any) => {
    if (!db) return
    deleteRecord(db, collections.CERTIFICATIONS, cert.id).catch(console.error);
    toast({ title: 'Record Removed' })
  }

  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">🏆 Credentials & Grade Sheets</h1>
          <p className="text-muted-foreground">Secure vault for academic and professional records (Max 20MB).</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(o) => { if(!loading) setIsDialogOpen(o); if (!o && !loading) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20" onClick={resetForm}>
              <Plus className="h-4 w-4" /> Add Record
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] bg-[#121214] text-white border-none p-8 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold font-headline">
                {editingCert ? 'Edit Credential' : 'Add New Credential'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">Migrated to Supabase Secure Storage.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveCert} className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Record Type</Label>
                  <Select value={category} onValueChange={setCategory} disabled={loading}>
                    <SelectTrigger className="bg-[#1c1c1f] border-none text-white h-12 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1c1c1f] border-gray-800 text-white">
                      <SelectItem value="Study Certificate">Study Certificate</SelectItem>
                      <SelectItem value="Course Certificate">Course Certificate</SelectItem>
                      <SelectItem value="Grade Sheet">Grade Sheet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select value={visibility} onValueChange={setVisibility} disabled={loading}>
                    <SelectTrigger className="bg-[#1c1c1f] border-none text-white h-12 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1c1c1f] border-gray-800 text-white">
                      <SelectItem value="Private">🔒 Private (Vault Only)</SelectItem>
                      <SelectItem value="Public">🌍 Public (Shared on Hub)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Title / Name</Label><Input id="title" name="title" defaultValue={editingCert?.title} placeholder="e.g. MBA Grade Sheet" required className="bg-[#1c1c1f] border-none text-white h-12 rounded-xl" /></div>
              <div className="space-y-2"><Label>Issued by</Label><Input id="issuer" name="issuer" defaultValue={editingCert?.issuer} placeholder="e.g. Stanford University" required className="bg-[#1c1c1f] border-none text-white h-12 rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Date Issued</Label><Input id="date" name="date" type="date" defaultValue={editingCert?.date} required className="bg-[#1c1c1f] border-none text-white h-12 rounded-xl [color-scheme:dark]" /></div>
                <div className="space-y-2"><Label>Verification Link</Label><Input id="externalLink" name="externalLink" defaultValue={editingCert?.externalLink} placeholder="https://verify..." className="bg-[#1c1c1f] border-none text-white h-12 rounded-xl" /></div>
              </div>
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-800 rounded-2xl bg-[#1c1c1f]/50 cursor-pointer" onClick={() => !loading && fileInputRef.current?.click()}>
                <input type="file" border-none ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                {selectedFile ? (<div className="flex flex-col items-center gap-2"><CheckCircle2 className="h-10 w-10 text-primary" /><span className="text-xs font-bold text-primary truncate max-w-[200px]">{selectedFile.name}</span></div>) : editingCert?.filePath ? (<div className="flex flex-col items-center gap-2"><ShieldCheck className="h-10 w-10 text-primary/50" /><span className="text-xs font-bold text-gray-400">File stored</span></div>) : (<div className="flex flex-col items-center gap-2 text-center"><Upload className="h-10 w-10 text-gray-500 mb-2" /><span className="text-xs text-gray-500">Upload (Max 20MB)</span></div>)}
              </div>
              
              {loading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-primary">
                    <span>Uploading to Supabase...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-1 bg-gray-800" />
                </div>
              )}

              <DialogFooter><Button type="submit" disabled={loading} className="w-full bg-primary h-12 rounded-xl">{loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Save Record'}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {certLoading ? (<div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-card/30 p-1 rounded-2xl border border-border/50"><TabsTrigger value="study" className="px-8 rounded-xl font-bold">Study</TabsTrigger><TabsTrigger value="course" className="px-8 rounded-xl font-bold">Course</TabsTrigger><TabsTrigger value="grades" className="px-8 rounded-xl font-bold">Grades</TabsTrigger></TabsList>
          <TabsContent value="study"><CertGrid items={certifications.filter(c => c.category === 'Study Certificate')} onDelete={handleDelete} onEdit={(c: any) => { setEditingCert(c); setCategory(c.category); setVisibility(c.visibility || (c.isPublic ? 'Public' : 'Private')); setIsDialogOpen(true); }} onPreview={handlePreviewFile} viewingId={viewingId} /></TabsContent>
          <TabsContent value="course"><CertGrid items={certifications.filter(c => c.category === 'Course Certificate')} onDelete={handleDelete} onEdit={(c: any) => { setEditingCert(c); setCategory(c.category); setVisibility(c.visibility || (c.isPublic ? 'Public' : 'Private')); setIsDialogOpen(true); }} onPreview={handlePreviewFile} viewingId={viewingId} /></TabsContent>
          <TabsContent value="grades"><CertGrid items={certifications.filter(c => c.category === 'Grade Sheet')} onDelete={handleDelete} onEdit={(c: any) => { setEditingCert(c); setCategory(c.category); setVisibility(c.visibility || (c.isPublic ? 'Public' : 'Private')); setIsDialogOpen(true); }} onPreview={handlePreviewFile} viewingId={viewingId} /></TabsContent>
        </Tabs>
      )}
      <Dialog open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-[90vw] h-[90vh] p-0 bg-[#0f1115] text-white border-none rounded-2xl overflow-hidden flex flex-col">
          <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#1a1c21]"><div className="flex items-center gap-3"><ShieldCheck className="text-primary h-5 w-5" /><DialogTitle className="truncate font-bold text-sm max-w-md">{previewDoc?.name}</DialogTitle></div><Button variant="ghost" size="icon" onClick={() => setPreviewDoc(null)}><X className="h-5 w-5" /></Button></div>
          <div className="flex-1 bg-black/40">{previewDoc?.url && <iframe src={previewDoc.url} className="w-full h-full border-none" title={previewDoc.name} />}</div>
        </DialogContent>
      </Dialog>
    </CRMLayout>
  )
}

function CertGrid({ items, onDelete, onEdit, onPreview, viewingId }: any) {
  if (items.length === 0) return (<div className="flex h-64 flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-3xl text-muted-foreground gap-4"><AlertCircle className="h-8 w-8 opacity-20" /><p className="italic">No records found.</p></div>)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((c: any) => {
        const isLoading = viewingId === c.id;
        return (
          <Card key={c.id} className="group border-none bg-card/50 backdrop-blur-md shadow-md hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2"><div className="p-3 rounded-2xl bg-primary/10 text-primary w-fit">{c.category === 'Grade Sheet' ? <FileSpreadsheet className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}</div><Badge variant="outline" className={c.isPublic ? 'border-green-500/20 text-green-500 bg-green-500/5' : 'border-gray-500/20 text-gray-500 bg-gray-500/5'}>{c.isPublic ? <Globe className="h-3 w-3 mr-1.5" /> : <Lock className="h-3 w-3 mr-1.5" />}{c.isPublic ? 'Public' : 'Private'}</Badge></div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><Button variant="ghost" size="icon" onClick={() => onEdit(c)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => onDelete(c)}><Trash2 className="h-4 w-4" /></Button></div>
              </div>
              <div className="mt-4 space-y-1"><h3 className="font-bold text-lg leading-tight line-clamp-2 h-12">{c.title}</h3><p className="text-sm font-semibold text-primary">{c.issuer}</p><div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-bold tracking-widest pt-1"><Calendar className="h-3 w-3" />{c.date}</div></div>
              <div className="mt-6 border-t border-border/50 pt-4 grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="h-9 text-[11px] font-bold rounded-xl" asChild={!!c.externalLink} disabled={!c.externalLink}>
                  {c.externalLink ? (<a href={c.externalLink} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-1.5 h-3 w-3" /> Verify</a>) : (<span>Verify</span>)}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 text-[11px] font-bold rounded-xl" 
                  onClick={() => onPreview(c)} 
                  disabled={!c.filePath || isLoading}
                >
                  {isLoading ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Eye className="mr-1.5 h-3 w-3" />} View
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  )
}
