
"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Quote, Loader2, Trash2, User, Pencil } from 'lucide-react'
import { useFirestore, useCollection, useUser } from '@/firebase'
import { collection, query, orderBy, where } from 'firebase/firestore'
import { collections, deleteRecord, createRecord, updateRecord } from '@/lib/firestore-service'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function TestimonialsPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [mounted, setMounted] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTest, setEditingTest] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testQuery = useMemo(() => {
    if (!db || !user) return null
    return query(
      collection(db, collections.TESTIMONIALS), 
      where('ownerId', '==', user.uid),
      orderBy('date', 'desc')
    )
  }, [db, user])

  const { data: testimonials, loading: testLoading } = useCollection(testQuery)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSaveTest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      author: formData.get('author'),
      role: formData.get('role'),
      company: formData.get('company'),
      content: formData.get('content'),
      date: editingTest?.date || new Date().toISOString().split('T')[0],
    }

    try {
      if (editingTest) {
        await updateRecord(db, collections.TESTIMONIALS, editingTest.id, data)
        toast({ title: 'Endorsement Updated' })
      } else {
        await createRecord(db, collections.TESTIMONIALS, data, user.uid)
        toast({ title: 'Endorsement Added' })
      }
      setIsDialogOpen(false)
      setEditingTest(null)
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord(db, collections.TESTIMONIALS, id)
      toast({ title: 'Testimonial Removed' })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    }
  }

  if (!mounted || testLoading) {
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
          <h1 className="font-headline text-4xl font-bold tracking-tight">🌟 Testimonials</h1>
          <p className="text-muted-foreground">What your peers and managers say about your work.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingTest(null);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => setEditingTest(null)}>
              <Plus className="h-4 w-4" />
              Add Testimonial
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTest ? 'Edit Endorsement' : 'Add New Endorsement'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveTest} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="author">Author Name</Label>
                <Input id="author" name="author" defaultValue={editingTest?.author || ''} placeholder="Jane Cooper" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" name="role" defaultValue={editingTest?.role || ''} placeholder="CTO" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" name="company" defaultValue={editingTest?.company || ''} placeholder="Acme Inc." required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Testimonial Content</Label>
                <Textarea id="content" name="content" defaultValue={editingTest?.content || ''} placeholder="Share the feedback..." className="min-h-[120px]" required />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Endorsement
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {testimonials && testimonials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((test: any) => (
            <Card key={test.id} className="border-none bg-card/50 backdrop-blur-md shadow-md group">
              <CardContent className="p-6">
                <Quote className="h-8 w-8 text-primary/20 mb-4" />
                <p className="text-sm italic leading-relaxed text-foreground mb-6">
                  "{test.content}"
                </p>
                <div className="flex items-center justify-between border-t border-border/50 pt-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-primary/10">
                      <AvatarImage src={`https://picsum.photos/seed/${test.author}/40/40`} />
                      <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{test.author}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                        {test.role} @ {test.company}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-primary" 
                      onClick={() => {
                        setEditingTest(test);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive" 
                      onClick={() => handleDelete(test.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/30 text-muted-foreground italic">
          No testimonials recorded yet.
        </div>
      )}
    </CRMLayout>
  )
}
