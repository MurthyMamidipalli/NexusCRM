import React from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Filter, Download, UserCheck } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

const customers = [
  { id: '1', name: 'Alicia Keys', company: 'Sonic Labs', industry: 'Software', revenue: '$15k', since: '2023' },
  { id: '2', name: 'Marcus Aurelius', company: 'Empire Holdings', industry: 'Finance', revenue: '$120k', since: '2022' },
  { id: '3', name: 'Zoe Kravitz', company: 'Vogue Tech', industry: 'Media', revenue: '$45k', since: '2023' },
  { id: '4', name: 'Elon Tusk', company: 'SpaceY', industry: 'Aerospace', revenue: '$250k', since: '2021' },
]

export default function CustomersPage() {
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {customers.map((customer) => (
          <Card key={customer.id} className="group border-none bg-card/50 backdrop-blur-md shadow-lg hover:shadow-2xl transition-all duration-300">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <Avatar className="h-12 w-12 border-2 border-primary/20 group-hover:border-primary/50 transition-colors">
                <AvatarImage src={`https://picsum.photos/seed/${customer.name}/48/48`} />
                <AvatarFallback>{customer.name[0]}</AvatarFallback>
              </Avatar>
              <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] uppercase">{customer.industry}</Badge>
            </CardHeader>
            <CardContent>
              <h3 className="font-headline text-lg font-bold group-hover:text-primary transition-colors">{customer.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{customer.company}</p>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Life Value</p>
                  <p className="text-sm font-bold text-foreground">{customer.revenue}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Partner Since</p>
                  <p className="text-sm font-bold text-foreground">{customer.since}</p>
                </div>
              </div>
              
              <Button variant="ghost" className="w-full mt-6 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </CRMLayout>
  )
}