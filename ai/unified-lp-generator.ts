import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

export async function generateUnifiedLP(topic: string) {
  const { object } = await generateObject({
    model: openai('gpt-4o'),
    schema: z.object({
      htmlContent: z.string().describe('Complete HTML content for the landing page, using Tailwind CSS for styling.'),
      cssContent: z.string().optional().describe('Any additional CSS required.'),
    }),
    prompt: `Create a complete, single-page landing page about "${topic}". The page should be visually appealing, responsive, and use Tailwind CSS classes directly in the HTML. The structure should include a hero section, features, testimonials, and a call-to-action.`,
  });
  return object;
}
