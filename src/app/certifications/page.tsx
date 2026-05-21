
"use client"

import React, { useMemo, useState } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Loader2, Trash2, Calendar, ShieldCheck, Folder } from 'lucide-react'
import { useFirestore, useCollection } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'
import { collections, deleteRecord, createRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function CertificationsPage() {
  const db = useFirestore()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const certQuery = useMemo(() => query(collection(db, collections.CERTIFICATIONS), orderBy('createdAt', 'desc')), [db])
  const { data: certifications, loading: certLoading } = useCollection(certQuery)

  const handleAddCert = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get('title'),
      issuer: formData.get('issuer'),
      date: formData.get('date'),
      credentialId: formData.get('credentialId'),
      category: formData.get('category') || 'Course Certificate',
    }

    try {
      await createRecord(db, collections.CERTIFICATIONS, data)
      toast({ title: 'Certification Added' })
      setIsAddOpen(false)
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord(db, collections.CERTIFICATIONS, id)
      toast({ title: 'Certification Removed' })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    }
  }

  const filterCerts = (category: string | null) => {
    if (!certifications) return []
    if (!category) return certifications
    return certifications.filter((c: any) => c.category === category)
  }

  if (certLoading) {
    return (
      <CRMLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CRMLayout>
    )
  }

  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">🏆 Certifications</h1>
          <p className="text-muted-foreground">Manage your Study and Course credentials in organized folders.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" />
              Add Certification
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Credential</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddCert} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category">Certificate Type (Folder)</Label>
                <Select name="category" defaultValue="Course Certificate">
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Study Certificate">Study Certificate</SelectItem>
                    <SelectItem value="Course Certificate">Course Certificate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Certification Title</Label>
                <Input id="title" name="title" placeholder="AWS Certified Cloud Practitioner" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issuer">Issuing Organization</Label>
                <Input id="issuer" name="issuer" placeholder="Amazon Web Services" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Issue Date</Label>
                  <Input id="date" name="date" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credentialId">Credential ID</Label>
                  <Input id="credentialId" name="credentialId" placeholder="e.g. ABC-123-XYZ" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Certification
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="space-y-8">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="all" className="gap-2">All Records</TabsTrigger>
          <TabsTrigger value="study" className="gap-2"><Folder className="h-3 w-3" /> Study Certificates</TabsTrigger>
          <TabsTrigger value="course" className="gap-2"><Folder className="h-3 w-3" /> Course Certificates</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <CertGrid items={filterCerts(null)} onDelete={handleDelete} />
        </TabsContent>
        <TabsContent value="study" className="mt-0">
          <CertGrid items={filterCerts('Study Certificate')} onDelete={handleDelete} />
        </TabsContent>
        <TabsContent value="course" className="mt-0">
          <CertGrid items={filterCerts('Course Certificate')} onDelete={handleDelete} />
        </TabsContent>
      </Tabs>
    </CRMLayout>
  )
}

function CertGrid({ items, onDelete }: { items: any[], onDelete: (id: string) => void }) {
  if (items.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/30 text-muted-foreground italic">
        This folder is empty.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((cert: any) => (
        <Card key={cert.id} className="group border-none bg-card/50 backdrop-blur-md shadow-md hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => onDelete(cert.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-4 space-y-1">
              <h3 className="font-headline font-bold text-lg">{cert.title}</h3>
              <p className="text-sm font-semibold text-primary">{cert.issuer}</p>
              <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest pt-1 flex items-center gap-1">
                <Folder className="h-3 w-3" />
                {cert.category}
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-border/50 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                <Calendar className="h-3 w-3" />
                Issued {cert.date}
              </div>
              {cert.credentialId && (
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono truncate">
                  ID: {cert.credentialId}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
