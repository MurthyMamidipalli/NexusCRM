
"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trophy, Loader2, Trash2, Award, Calendar, ShieldCheck } from 'lucide-react'
import { useFirestore, useCollection } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'
import { collections, deleteRecord, createRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function CertificationsPage() {
  const db = useFirestore()
  const [mounted, setMounted] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const certQuery = useMemo(() => query(collection(db, collections.CERTIFICATIONS), orderBy('createdAt', 'desc')), [db])
  const { data: certifications, loading: certLoading } = useCollection(certQuery)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleAddCert = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get('title'),
      issuer: formData.get('issuer'),
      date: formData.get('date'),
      credentialId: formData.get('credentialId'),
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

  if (!mounted || certLoading) {
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
          <p className="text-muted-foreground">Validating your professional skills and industry recognized credentials.</p>
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

      {certifications && certifications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certifications.map((cert: any) => (
            <Card key={cert.id} className="group border-none bg-card/50 backdrop-blur-md shadow-md hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(cert.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-4 space-y-1">
                  <h3 className="font-headline font-bold text-lg">{cert.title}</h3>
                  <p className="text-sm font-semibold text-primary">{cert.issuer}</p>
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
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/30 text-muted-foreground italic">
          No certifications listed yet.
        </div>
      )}
    </CRMLayout>
  )
}
