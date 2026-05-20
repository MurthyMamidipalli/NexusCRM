
"use client"

import React, { useMemo } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, Filter, Download, UserCheck, Loader2, Building2, Mail, ExternalLink } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useFirestore, useCollection } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'
import { collections } from '@/lib/firestore-service'
import { Input } from '@/components/ui/input'

export default function CustomersPage() {
  const db = useFirestore()
  const customersQuery = useMemo(() => query(collection(db, collections.CUSTOMERS), orderBy('createdAt', 'desc')), [db])
  const { data: customers, loading } = useCollection(customersQuery)

  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">Client Hub</h1>
          <p className="text-muted-foreground">Manage long-term relationships and track customer success.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 border-border/50 bg-card hover:bg-muted">
            <Download className="h-4 w-4" />
            Export CRM
          </Button>
          <Button className="gap-2 shadow-lg shadow-primary/20">
            <UserCheck className="h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10 bg-card/50 border-border/50 focus:ring-primary/50" placeholder="Search customers..." />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : customers && customers.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {customers.map((customer: any) => (
            <Card key={customer.id} className="group border-none bg-card/50 backdrop-blur-md shadow-lg hover:shadow-2xl transition-all duration-300">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <Avatar className="h-12 w-12 border-2 border-primary/20 group-hover:border-primary/50 transition-colors">
                  <AvatarImage src={`https://picsum.photos/seed/${customer.id}/48/48`} />
                  <AvatarFallback>{customer.name?.[0] || 'C'}</AvatarFallback>
                </Avatar>
                <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] uppercase">
                  {customer.industry || 'Enterprise'}
                </Badge>
              </CardHeader>
              <CardContent>
                <h3 className="font-headline text-lg font-bold group-hover:text-primary transition-colors">{customer.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                  <Building2 className="h-3 w-3" />
                  {customer.company}
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Revenue</p>
                    <p className="text-sm font-bold text-foreground">${customer.revenue?.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Partner Since</p>
                    <p className="text-sm font-bold text-foreground">{customer.since || '2024'}</p>
                  </div>
                </div>
                
                <Button variant="ghost" className="w-full mt-6 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/30">
          <Building2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No converted customers yet. Win some deals to see them here!</p>
        </div>
      )}
    </CRMLayout>
  )
}
