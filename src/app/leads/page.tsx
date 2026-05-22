"use client"

import React, { useState } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { LeadTable } from '@/components/leads/lead-table'
import { Button } from '@/components/ui/button'
import { Plus, Filter } from 'lucide-react'
import { AddLeadDialog } from '@/components/leads/add-lead-dialog'

export default function LeadsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  return (
    <CRMLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">Leads Engine</h1>
          <p className="text-muted-foreground">Manage your prospects and bridge the gap to conversion.</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" />
          Add New Lead
        </Button>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 border-border/50 bg-card hover:bg-muted">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline" className="gap-2 border-border/50 bg-card hover:bg-muted">
            Sort: Newest
          </Button>
        </div>
      </div>

      <LeadTable />
      <AddLeadDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </CRMLayout>
  )
}
