
"use client"

import React, { useMemo, useState, useEffect } from 'react'
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
  LayoutGrid,
  List,
  Pencil,
  Eye
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, orderBy, where } from 'firebase/firestore'
import { collections, deleteRecord, createRecord, updateRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function DocumentsPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const docsQuery = useMemo(() => {
    if (!db || !user) return null
    return query(
      collection(db, collections.DOCUMENTS), 
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
  }, [db, user])

  const { data: documents, loading: docsLoading } = useCollection(docsQuery)

  const handleSaveDoc = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db) return

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      category: formData.get('category'),
      size: formData.get('size') || '1.2 MB',
      status: formData.get('status') || 'Active',
      url: editingDoc?.url || '#'
    }

    try {
      if (editingDoc) {
        await updateRecord(db, collections.DOCUMENTS, editingDoc.id, data)
        toast({ title: 'Document Updated' })
      } else {
        await createRecord(db, collections.DOCUMENTS, data, user.uid)
        toast({ title: 'Document Added to Vault' })
      }
      setIsDialogOpen(false)
      setEditingDoc(null)
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Persistence Error', description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!db) return
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

  if (!mounted) return null

  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">📁 Document Vault</h1>
          <p className="text-muted-foreground">Secure storage for your enterprise assets and legal paperwork.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted p-1 rounded-lg mr-2">
            <Button 
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingDoc(null);
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => setEditingDoc(null)}>
                <Upload className="h-4 w-4" />
                Upload File
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingDoc ? 'Edit Metadata' : 'Upload to Vault'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSaveDoc} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Document Name</Label>
                  <Input id="name" name="name" defaultValue={editingDoc?.name || ''} placeholder="e.g. Annual Contract 2024" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select name="category" defaultValue={editingDoc?.category || "Contracts"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
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
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue={editingDoc?.status || "Active"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Signed">Signed</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">File Size (Mock)</Label>
                  <Input id="size" name="size" defaultValue={editingDoc?.size || ''} placeholder="e.g. 2.5 MB" />
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none bg-card/50 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Quick Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {['All Documents', 'Contracts', 'Invoices', 'Quotations', 'Legal'].map(cat => (
                <Button 
                  key={cat} 
                  variant="ghost" 
                  onClick={() => setSearchQuery(cat === 'All Documents' ? '' : cat)}
                  className={cn(
                    "w-full justify-start text-sm transition-all",
                    searchQuery === (cat === 'All Documents' ? '' : cat) ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted"
                  )}
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
            viewMode === 'grid' ? (
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
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={cn(
                            "text-[10px] uppercase px-1.5 h-5",
                            doc.status === 'Signed' ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-primary/10 text-primary border-primary/20"
                          )} variant="outline">
                            {doc.status || 'Active'}
                          </Badge>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-primary"
                              onClick={() => { setEditingDoc(doc); setIsDialogOpen(true); }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-destructive"
                              onClick={() => handleDelete(doc.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-6">
                        <Button variant="outline" size="sm" className="flex-1 text-[11px] gap-1.5 h-8 font-bold">
                          <Download className="h-3 w-3" /> Download
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 text-[11px] gap-1.5 h-8 font-bold">
                          <Eye className="h-3 w-3" /> View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 bg-card/30 overflow-hidden backdrop-blur-md shadow-lg">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Document Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocs.map((doc: any) => (
                      <TableRow key={doc.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-bold flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          {doc.name}
                        </TableCell>
                        <TableCell className="text-xs font-semibold">{doc.category}</TableCell>
                        <TableCell className="text-[10px] font-mono">{doc.size || '1.2 MB'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(
                            "text-[10px] h-5",
                            doc.status === 'Signed' ? "text-green-500" : "text-primary"
                          )}>{doc.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => { setEditingDoc(doc); setIsDialogOpen(true); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(doc.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
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
