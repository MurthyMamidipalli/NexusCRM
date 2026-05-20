
"use client"

import React, { useMemo } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  ExternalLink,
  ShieldCheck,
  Search,
  Loader2,
  FileBox
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useFirestore, useCollection } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'
import { collections, deleteRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'

export default function DocumentsPage() {
  const db = useFirestore()
  const docsQuery = useMemo(() => query(collection(db, collections.DOCUMENTS), orderBy('createdAt', 'desc')), [db])
  const { data: documents, loading } = useCollection(docsQuery)

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord(db, collections.DOCUMENTS, id)
      toast({ title: 'Document Removed' })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    }
  }

  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">Document Vault</h1>
          <p className="text-muted-foreground">Secure storage for your enterprise assets and legal paperwork.</p>
        </div>
        <Button className="gap-2 shadow-lg shadow-primary/20">
          <Upload className="h-4 w-4" />
          Upload Files
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none bg-card/50 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {['All Documents', 'Contracts', 'Invoices', 'Quotations', 'Legal'].map(cat => (
                <Button key={cat} variant="ghost" className="w-full justify-start text-sm hover:bg-primary/10 hover:text-primary transition-all">
                  {cat}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5 text-primary">
            <CardHeader className="pb-2">
              <ShieldCheck className="h-8 w-8 mb-2" />
              <CardTitle className="text-md">Encrypted Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs leading-relaxed opacity-80">All files are end-to-end encrypted and stored in regional compliant buckets.</p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-10 bg-card/50 border-border/50" placeholder="Search by filename or metadata..." />
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : documents && documents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {documents.map((doc: any) => (
                <Card key={doc.id} className="group hover:border-primary/50 transition-all shadow-md hover:shadow-xl bg-card/30">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                          <FileText className="h-8 w-8 text-primary" />
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-sm font-bold truncate max-w-[150px]">{doc.name}</h4>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                            {doc.size || 'N/A'} • {doc.createdAt ? new Date(doc.createdAt.seconds * 1000).toLocaleDateString() : 'Today'}
                          </p>
                        </div>
                      </div>
                      <Badge className={cn(
                        "text-[10px] uppercase px-1.5",
                        doc.status === 'Signed' ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                      )} variant="outline">
                        {doc.status || 'Active'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-6">
                      <Button variant="outline" size="sm" className="flex-1 text-[11px] gap-1.5">
                        <Download className="h-3 w-3" /> Download
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 text-[11px] gap-1.5">
                        <ExternalLink className="h-3 w-3" /> View
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/30">
              <FileBox className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No documents uploaded yet. Start organizing your vault.</p>
            </div>
          )}
        </div>
      </div>
    </CRMLayout>
  )
}
