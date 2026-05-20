"use client"

import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, ArrowRight, Loader2, Zap, MessageSquare, Phone, Mail } from 'lucide-react'
import { getNextBestActionSuggestions, type NextBestActionSuggestionsOutput } from '@/ai/flows/next-best-action-suggestions'
import { Badge } from '@/components/ui/badge'

interface NextActionProps {
  leadId: string
  leadName: string
  company: string
  status: string
  historySummary: string
}

export function NextAction({ leadId, leadName, company, status, historySummary }: NextActionProps) {
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<NextBestActionSuggestionsOutput | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const result = await getNextBestActionSuggestions({
        leadDetails: `Name: ${leadName}, Company: ${company}, LeadID: ${leadId}`,
        interactionHistory: historySummary,
        pipelineStatus: status,
        lastInteractionDate: new Date().toISOString(),
        nextFollowUpDate: null
      })
      setSuggestion(result)
    } catch (error) {
      console.error("AI Generation failed:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-primary/20 bg-primary/5 backdrop-blur-md shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Sparkles className="h-12 w-12 text-primary" />
      </div>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-accent fill-accent" />
          <CardTitle className="font-headline text-lg tracking-tight">AI Strategy Advisor</CardTitle>
        </div>
        <CardDescription>Leveraging intelligence to close your next deal faster.</CardDescription>
      </CardHeader>
      <CardContent>
        {suggestion ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-2">
              <Badge className={cn(
                "uppercase tracking-tighter text-[10px]",
                suggestion.priority === 'High' ? "bg-red-500 text-white" : "bg-primary text-white"
              )}>
                {suggestion.priority} Priority
              </Badge>
              <Badge variant="outline" className="text-[10px] uppercase border-accent text-accent">
                Via {suggestion.followUpType}
              </Badge>
            </div>
            
            <div className="rounded-lg bg-background/50 p-4 border border-border/50">
              <h4 className="text-sm font-bold text-primary mb-1">{suggestion.suggestedAction}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{suggestion.reasoning}</p>
            </div>

            {suggestion.details && (
              <div className="rounded-lg bg-card p-3 border border-dashed border-border/50">
                <p className="text-[11px] font-mono text-muted-foreground leading-tight italic">
                  "{suggestion.details}"
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
            <div className="p-3 rounded-full bg-primary/10">
              <MessageSquare className="h-8 w-8 text-primary opacity-50" />
            </div>
            <p className="text-sm text-muted-foreground max-w-[200px]">Analyze lead history to unlock the next breakthrough action.</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleGenerate} 
          disabled={loading} 
          className="w-full gap-2 shadow-lg shadow-primary/30"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {suggestion ? 'Regenerate Strategy' : 'Suggest Next Step'}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}