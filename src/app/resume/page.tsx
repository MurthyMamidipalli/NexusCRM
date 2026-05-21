
"use client"

import React, { useState, useEffect } from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, Eye, ExternalLink, Loader2, FileUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function ResumePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
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
          <Button variant="outline" className="gap-2">
            <Eye className="h-4 w-4" /> Preview
          </Button>
          <Button className="gap-2 shadow-lg shadow-primary/20">
            <FileUp className="h-4 w-4" /> Update CV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none bg-card/50 backdrop-blur-md min-h-[600px] flex items-center justify-center">
             <div className="text-center space-y-4">
               <div className="p-6 rounded-full bg-primary/10 mx-auto w-fit">
                 <FileText className="h-16 w-16 text-primary opacity-50" />
               </div>
               <h3 className="text-xl font-bold">No Resume Uploaded</h3>
               <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
                 Upload your latest CV to enable professional sharing and AI optimizations.
               </p>
               <Button className="mt-4">Upload Resume (PDF)</Button>
             </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none bg-accent text-white shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Quick Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="secondary" className="w-full justify-between group">
                Download PDF <Download className="h-4 w-4 group-hover:translate-y-0.5 transition-transform" />
              </Button>
              <Button variant="secondary" className="w-full justify-between group">
                Export to Word <ExternalLink className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none bg-card/50 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="font-bold">N/A</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Downloads</span>
                <span className="font-bold text-primary">0</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">ATS Score</span>
                <Badge variant="secondary">Not Calculated</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CRMLayout>
  )
}
