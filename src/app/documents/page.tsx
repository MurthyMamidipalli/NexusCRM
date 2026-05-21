
"use client"

import React, { useMemo, useState } from 'react'
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
  FileBox,
  Plus
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useFirestore, useCollection } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'
import { collections, deleteRecord, createRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function DocumentsPage() {
  const db = useFirestore()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const docsQuery = useMemo(() => query(collection(db, collections.DOCUMENTS), orderBy('createdAt', 'desc')), [db])
  const { data: documents, loading: docsLoading } = useCollection(docsQuery)

  const handleAddDoc = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      category: formData.get('category'),
      size: formData.get('size') || '1.2 MB',
      status: 'Active',
      url: '#'
    }

    try {
      await createRecord(db, collections.DOCUMENTS, data)
      toast({ title: 'Document Added' })
      setIsAddOpen(false)
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord(db, collections.DOCUMENTS, id)
      toast({ title: 'Document Removed' })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    }
  }

  const filteredDocs = useMemo(() => {
    if (!documents) return []
    return documents.filter((doc: any) => 
      doc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [documents, searchQuery])

  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">📁 Document Vault</h1>
          <p className="text-muted-foreground">Secure storage for your enterprise assets and legal paperwork.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20">
              <Upload className="h-4 w-4" />
              Upload Files
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload to Vault</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddDoc} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Document Name</Label>
                <Input id="name" name="name" placeholder="e.g. Annual Contract 2024" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select name="category" defaultValue="Contracts">
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Contracts">Contracts</SelectItem>
                    <SelectItem value="Invoices">Invoices</SelectItem>
                    <SelectItem value="Quotations">Quotations</SelectItem>
                    <SelectItem value="Legal">Legal</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">File Size (Mock)</Label>
                <Input id="size" name="size" placeholder="e.g. 2.5 MB" />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Record Document
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none bg-card/50 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Quick Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {['All Documents', 'Contracts', 'Invoices', 'Quotations', 'Legal'].map(cat => (
                <Button 
                  key={cat} 
                  variant="ghost" 
                  onClick={() => setSearchQuery(cat === 'All Documents' ? '' : cat)}
                  className="w-full justify-start text-sm hover:bg-primary/10 hover:text-primary transition-all"
                >
                  {cat}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5 text-primary">
            <CardHeader className="pb-2">
              <ShieldCheck className="h-8 w-8 mb-2" />
              <CardTitle className="text-md text-primary font-bold">Encrypted Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs leading-relaxed opacity-80">All files are end-to-end encrypted and stored in regional compliant buckets.</p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              className="pl-10 bg-card/50 border-border/50" 
              placeholder="Search by filename or metadata..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {docsLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredDocs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredDocs.map((doc: any) => (
                <Card key={doc.id} className="group hover:border-primary/50 transition-all shadow-md hover:shadow-xl bg-card/30 border-none backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                          <FileText className="h-8 w-8 text-primary" />
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-sm font-bold truncate max-w-[150px]">{doc.name}</h4>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                            {doc.size || 'N/A'} • {doc.category || 'General'}
                          </p>
                        </div>
                      </div>
                      <Badge className={cn(
                        "text-[10px] uppercase px-1.5",
                        doc.status === 'Signed' ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-primary/10 text-primary border-primary/20"
                      )} variant="outline">
                        {doc.status || 'Active'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-6">
                      <Button variant="outline" size="sm" className="flex-1 text-[11px] gap-1.5 h-8">
                        <Download className="h-3 w-3" /> Download
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 text-[11px] gap-1.5 h-8">
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
              <p className="text-muted-foreground">No documents found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </CRMLayout>
  )
}
