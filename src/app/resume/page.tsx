
"use client"

import React, { useState, useMemo } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, Eye, ExternalLink, Loader2, FileUp, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useFirestore, useCollection } from '@/firebase'
import { collection, query, orderBy, limit } from 'firebase/firestore'
import { collections, createRecord, deleteRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export default function ResumePage() {
  const db = useFirestore()
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const resumeQuery = useMemo(() => query(collection(db, 'resumes'), orderBy('createdAt', 'desc'), limit(1)), [db])
  const { data: resumes, loading: resumeLoading } = useCollection(resumeQuery)
  const activeResume = resumes?.[0]

  const handleUploadResume = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      version: formData.get('version') || '1.0',
      createdAt: new Date().toISOString()
    }

    try {
      await createRecord(db, 'resumes', data)
      toast({ title: 'Resume Updated', description: 'Your new CV has been recorded.' })
      setIsUploadOpen(false)
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord(db, 'resumes', id)
      toast({ title: 'Resume Deleted' })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    }
  }

  if (resumeLoading) {
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
          <h1 className="font-headline text-4xl font-bold tracking-tight">📜 Resume / CV</h1>
          <p className="text-muted-foreground">Manage and share your master professional document.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" disabled={!activeResume}>
            <Eye className="h-4 w-4" /> Preview
          </Button>
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/20">
                <FileUp className="h-4 w-4" /> 
                {activeResume ? 'Update CV' : 'Upload CV'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record New Resume Version</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUploadResume} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">File Name</Label>
                  <Input id="name" name="name" placeholder="John_Doe_CV_2024.pdf" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="version">Version Tag</Label>
                  <Input id="version" name="version" placeholder="e.g. v2.4" />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Version
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none bg-card/50 backdrop-blur-md min-h-[600px] flex items-center justify-center">
             {activeResume ? (
               <div className="text-center space-y-6 p-8">
                 <div className="p-8 rounded-3xl bg-primary/10 mx-auto w-fit">
                   <FileText className="h-24 w-24 text-primary" />
                 </div>
                 <div className="space-y-2">
                   <h3 className="text-2xl font-bold font-headline">{activeResume.name}</h3>
                   <p className="text-muted-foreground">Version {activeResume.version} • Recorded {new Date(activeResume.createdAt).toLocaleDateString()}</p>
                 </div>
                 <div className="flex justify-center gap-4">
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4" /> Download
                    </Button>
                    <Button variant="ghost" className="text-destructive hover:bg-destructive/10 gap-2" onClick={() => handleDelete(activeResume.id)}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                 </div>
               </div>
             ) : (
               <div className="text-center space-y-4">
                 <div className="p-6 rounded-full bg-primary/10 mx-auto w-fit">
                   <FileText className="h-16 w-16 text-primary opacity-50" />
                 </div>
                 <h3 className="text-xl font-bold">No Resume Uploaded</h3>
                 <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
                   Upload your latest CV to enable professional sharing and AI optimizations.
                 </p>
                 <Button className="mt-4" onClick={() => setIsUploadOpen(true)}>Record Resume Metadata</Button>
               </div>
             )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none bg-accent text-white shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="secondary" className="w-full justify-between group" disabled={!activeResume}>
                Download PDF <Download className="h-4 w-4 group-hover:translate-y-0.5 transition-transform" />
              </Button>
              <Button variant="secondary" className="w-full justify-between group" disabled={!activeResume}>
                Share Public Link <ExternalLink className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none bg-card/50 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Resume Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className={cn("font-bold", activeResume ? "text-green-500" : "text-yellow-500")}>
                  {activeResume ? 'Active' : 'Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Version</span>
                <span className="font-bold text-primary">{activeResume?.version || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">ATS Score</span>
                <Badge variant="secondary">{activeResume ? '88/100' : 'N/A'}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CRMLayout>
  )
}
