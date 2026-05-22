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
  X
} from 'lucide-react'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import { collections, deleteRecord, createRecord, updateRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogTrigger,
  DialogDescription 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors'

export default function CertificationsPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCert, setEditingCert] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // Preview State
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null)

  // Form State
  const [category, setCategory] = useState<string>("Course Certificate")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentData, setDocumentData] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const certQuery = useMemo(() => {
    if (!db || !user) return null
    return query(
      collection(db, collections.CERTIFICATIONS), 
      where('ownerId', '==', user.uid)
    )
  }, [db, user])

  const { data: rawCertifications, loading: certLoading } = useCollection(certQuery)

  const certifications = useMemo(() => {
    if (!rawCertifications) return []
    return [...rawCertifications].sort((a: any, b: any) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    })
  }, [rawCertifications])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setDocumentData(reader.result as string)
      toast({ title: 'File Attached', description: `${file.name} is ready.` })
    }
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
      credentialId: formData.get('credentialId') as string,
      category: category,
      externalLink: formData.get('externalLink') as string,
      documentUrl: documentData || editingCert?.documentUrl || '',
      fileName: selectedFile?.name || editingCert?.fileName || '',
      ownerId: user.uid
    }

    const mutation = editingCert 
      ? updateRecord(db, collections.CERTIFICATIONS, editingCert.id, data)
      : createRecord(db, collections.CERTIFICATIONS, data, user.uid)

    mutation.catch(async (err) => {
      const permissionError = new FirestorePermissionError({
        path: editingCert ? `${collections.CERTIFICATIONS}/${editingCert.id}` : collections.CERTIFICATIONS,
        operation: editingCert ? 'update' : 'create',
        requestResourceData: data,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    });

    toast({ title: editingCert ? 'Record Updated' : 'Record Added' })
    setIsDialogOpen(false)
    setEditingCert(null)
    setLoading(false)
  }

  const handleDelete = (id: string) => {
    if (!db) return
    deleteRecord(db, collections.CERTIFICATIONS, id)
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: `${collections.CERTIFICATIONS}/${id}`,
          operation: 'delete',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
    toast({ title: 'Record Removed' })
  }

  const filterCerts = (cat: string) => {
    if (!certifications) return []
    return certifications.filter((c: any) => c.category === cat)
  }

  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">🏆 Credentials & Grade Sheets</h1>
          <p className="text-muted-foreground">Secure document vault for academic records and certifications.</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingCert(null);
              setSelectedFile(null);
              setDocumentData('');
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => setEditingCert(null)}>
                <Plus className="h-4 w-4" />
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold font-headline">
                  {editingCert ? 'Edit Credential' : 'Add New Credential'}
                </DialogTitle>
                <DialogDescription>
                  Upload documents and enter verification details.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveCert} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Record Type</Label>
                    <Select defaultValue={editingCert?.category || "Course Certificate"} onValueChange={setCategory}>
                      <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Study Certificate">Study Certificate</SelectItem>
                        <SelectItem value="Course Certificate">Course Certificate</SelectItem>
                        <SelectItem value="Grade Sheet">Grade Sheet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title / Course Name</Label>
                    <Input id="title" name="title" defaultValue={editingCert?.title || ''} placeholder="AWS Solutions Architect" required />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="issuer">Issuing Organization</Label>
                  <Input id="issuer" name="issuer" defaultValue={editingCert?.issuer || ''} placeholder="University or Provider Name" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Completion Date</Label>
                    <Input id="date" name="date" type="date" defaultValue={editingCert?.date || ''} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credentialId">Credential ID / ID</Label>
                    <Input id="credentialId" name="credentialId" defaultValue={editingCert?.credentialId || ''} placeholder="ABC-123" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="externalLink">Verification Link</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="externalLink" name="externalLink" className="pl-10" defaultValue={editingCert?.externalLink || ''} placeholder="https://verify.cert.com" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Document Upload</Label>
                  <div 
                    className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 transition-all hover:border-primary/50 cursor-pointer bg-muted/30"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                    {selectedFile || editingCert?.fileName ? (
                      <div className="flex flex-col items-center">
                        <CheckCircle2 className="h-8 w-8 text-primary mb-2" />
                        <span className="text-sm font-bold text-foreground line-clamp-1 text-center px-2">
                          {selectedFile?.name || editingCert?.fileName}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                        <span className="text-sm font-semibold">Click to upload document</span>
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Record
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!mounted || certLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="study" className="space-y-8">
          <TabsList className="bg-muted/50 p-1 flex-wrap h-auto">
            <TabsTrigger value="study" className="gap-2"><Folder className="h-3 w-3" /> Study Certificates</TabsTrigger>
            <TabsTrigger value="course" className="gap-2"><Folder className="h-3 w-3" /> Course Certificates</TabsTrigger>
            <TabsTrigger value="grades" className="gap-2"><FileSpreadsheet className="h-3 w-3" /> Grade Sheets</TabsTrigger>
          </TabsList>

          <TabsContent value="study" className="mt-0">
            <CertGrid items={filterCerts('Study Certificate')} onDelete={handleDelete} onEdit={(c) => { setEditingCert(c); setIsDialogOpen(true); setCategory(c.category); }} onPreview={(url, name) => setPreviewDoc({ url, name })} />
          </TabsContent>
          <TabsContent value="course" className="mt-0">
            <CertGrid items={filterCerts('Course Certificate')} onDelete={handleDelete} onEdit={(c) => { setEditingCert(c); setIsDialogOpen(true); setCategory(c.category); }} onPreview={(url, name) => setPreviewDoc({ url, name })} />
          </TabsContent>
          <TabsContent value="grades" className="mt-0">
            <CertGrid items={filterCerts('Grade Sheet')} onDelete={handleDelete} onEdit={(c) => { setEditingCert(c); setIsDialogOpen(true); setCategory(c.category); }} onPreview={(url, name) => setPreviewDoc({ url, name })} />
          </TabsContent>
        </Tabs>
      )}

      {/* Full Screen File Previewer */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-[90vw] h-[90vh] p-0 bg-[#0f1115] text-white border-none rounded-2xl overflow-hidden flex flex-col">
          <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#1a1c21]">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <DialogTitle className="font-bold text-sm truncate max-w-[200px] md:max-w-md">
                {previewDoc?.name || 'Document Preview'}
              </DialogTitle>
            </div>
            <DialogDescription className="sr-only">
              Full screen credential document preview.
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

function CertGrid({ items, onDelete, onEdit, onPreview }: { items: any[], onDelete: (id: string) => void, onEdit: (cert: any) => void, onPreview: (url: string, name: string) => void }) {
  if (items.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/30 text-muted-foreground italic">
        No records found in this category.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((cert: any) => (
        <Card key={cert.id} className="group border-none bg-card/50 backdrop-blur-md shadow-md hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                {cert.category === 'Grade Sheet' ? <FileSpreadsheet className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => onEdit(cert)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(cert.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            
            <div className="mt-4 space-y-1">
              <h3 className="font-headline font-bold text-lg leading-tight">{cert.title}</h3>
              <p className="text-sm font-semibold text-primary">{cert.issuer}</p>
            </div>
            
            <div className="mt-6 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                <Calendar className="h-3 w-3" />
                Dated {cert.date}
              </div>
              {cert.credentialId && (
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono truncate">
                  ID: {cert.credentialId}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-border/50 grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="text-[11px] gap-1.5 h-8 font-bold" disabled={!cert.externalLink} asChild={!!cert.externalLink}>
                {cert.externalLink ? (
                  <a href={cert.externalLink} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3" /> Verify</a>
                ) : (
                  <span><ExternalLink className="h-3 w-3" /> Verify</span>
                )}
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-[11px] gap-1.5 h-8 font-bold" 
                  disabled={!cert.documentUrl}
                  onClick={() => cert.documentUrl && onPreview(cert.documentUrl, cert.title)}
                >
                  <Eye className="h-3 w-3" /> View
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 w-8 p-0 font-bold disabled:opacity-30" 
                  disabled={!cert.documentUrl} 
                  asChild={!!cert.documentUrl}
                >
                  {cert.documentUrl ? (
                    <a href={cert.documentUrl} download={cert.fileName || 'certificate'}><FileText className="h-3 w-3" /></a>
                  ) : (
                    <span><FileText className="h-3 w-3" /></span>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
