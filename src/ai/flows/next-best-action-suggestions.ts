'use server';
/**
 * @fileOverview An AI-powered 'Next-Best-Action' tool that analyzes a lead's interaction history and pipeline status
 * to suggest the most effective next step.
 *
 * - getNextBestActionSuggestions - A function that generates next best action suggestions for a sales lead.
 * - NextBestActionSuggestionsInput - The input type for the getNextBestActionSuggestions function.
 * - NextBestActionSuggestionsOutput - The return type for the getNextBestActionSuggestions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NextBestActionSuggestionsInputSchema = z.object({
  leadDetails: z
    .string()
    .describe(
      'Detailed information about the lead, including name, company, contact details, and deal value.'
    ),
  interactionHistory: z
    .string()
    .describe(
      'A summary of all past interactions with the lead, including calls, emails, meetings, and notes.'
    ),
  pipelineStatus: z
    .string()
    .describe(
      'The current stage of the lead in the sales pipeline (e.g., New Lead, Contacted, Qualified, Proposal Sent, Negotiation, Won, Lost).'
    ),
  lastInteractionDate: z
    .string()
    .datetime()
    .describe('The date and time of the last interaction with the lead.'),
  nextFollowUpDate: z
    .string()
    .datetime()
    .nullable()
    .describe('The date and time of the next scheduled follow-up, if any.'),
});
export type NextBestActionSuggestionsInput = z.infer<
  typeof NextBestActionSuggestionsInputSchema
>;

const NextBestActionSuggestionsOutputSchema = z.object({
  suggestedAction: z
    .string()
    .describe(
      'A clear, concise, and actionable suggestion for the next best step to take with this lead.'
    ),
  reasoning: z
    .string()
    .describe(
      'A brief explanation of why this action is the most effective next step, based on the provided lead details, history, and status.'
    ),
  priority: z
    .enum(['High', 'Medium', 'Low'])
    .describe('The urgency level of the suggested action.'),
  followUpType: z
    .enum(['Call', 'Email', 'Meeting', 'WhatsApp', 'Other'])
    .describe('The recommended communication channel for the suggested action.'),
  details: z
    .string()
    .optional()
    .describe(
      'Any additional specific details or content that should be included in the suggested action (e.g., email draft snippets, call script points).'
    ),
});
export type NextBestActionSuggestionsOutput = z.infer<
  typeof NextBestActionSuggestionsOutputSchema
>;

export async function getNextBestActionSuggestions(
  input: NextBestActionSuggestionsInput
): Promise<NextBestActionSuggestionsOutput> {
  return nextBestActionSuggestionsFlow(input);
}

const nextBestActionSuggestionsPrompt = ai.definePrompt({
  name: 'nextBestActionSuggestionsPrompt',
  input: { schema: NextBestActionSuggestionsInputSchema },
  output: { schema: NextBestActionSuggestionsOutputSchema },
  prompt: `You are an AI-powered sales strategist specializing in identifying the next best action for sales leads.
Your goal is to analyze the provided lead information, interaction history, and current pipeline status to suggest the most effective next step to advance the deal or customer relationship.

Consider the following details:

Lead Details:
{{{leadDetails}}}

Interaction History:
{{{interactionHistory}}}

Current Pipeline Status:
{{{pipelineStatus}}}

Last Interaction Date: {{{lastInteractionDate}}}
Next Scheduled Follow-up: {{{nextFollowUpDate}}}

Based on this information, provide a single, clear, and actionable next best step.
Explain your reasoning, assign a priority, and specify the recommended communication channel.
If applicable, include specific details or content that could be used in the suggested action.`,
});

const nextBestActionSuggestionsFlow = ai.defineFlow(
  {
    name: 'nextBestActionSuggestionsFlow',
    inputSchema: NextBestActionSuggestionsInputSchema,
    outputSchema: NextBestActionSuggestionsOutputSchema,
  },
  async (input) => {
    const { output } = await nextBestActionSuggestionsPrompt(input);
    return output!;
  }
);
