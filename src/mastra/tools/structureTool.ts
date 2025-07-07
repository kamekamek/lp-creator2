import { createAnthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';

// Define the schema for a single section of the LP
const sectionSchema = z.object({
  type: z.enum(['hero', 'features', 'testimonials', 'cta', 'faq', 'footer']).describe('The type of section'),
  title: z.string().describe('A clear, concise title for this section'),
  description: z.string().describe('A detailed description of what this section will contain'),
});

// Define the schema for the overall LP structure
const lpStructureSchema = z.object({
  title: z.string().describe('The main title/heading for the landing page'),
  sections: z.array(sectionSchema).min(3).max(8).describe('An array of sections that make up the landing page.'),
});

type LPStructure = z.infer<typeof lpStructureSchema>;

/**
 * Generates the overall structure (outline) of the landing page as a JSON object.
 */
export async function generateLPStructure(topic: string): Promise<LPStructure> {
  try {
    const { object: structure } = await generateObject({
      model: createAnthropic()('claude-opus-4-20250514'),
      schema: lpStructureSchema,
      maxTokens: 1500,
      temperature: 0.7,
      prompt: `You must create a JSON object with a "title" and "sections" array for a landing page about: "${topic}".

The structure should include:
- "title": The main page title/heading
- "sections": An array of sections

Each section must have:
- "type": one of ["hero", "features", "testimonials", "cta", "faq", "footer"]
- "title": A clear, concise title for this section (e.g., "Hero Section", "Key Features", "Customer Testimonials")
- "description": A detailed description of what this section will contain

Example structure:
{
  "title": "AI Photo Editor Pro",
  "sections": [
    {
      "type": "hero",
      "title": "Hero Section",
      "description": "Compelling headline, subheading, hero image, and primary call-to-action button to capture visitor attention"
    },
    {
      "type": "features", 
      "title": "Key Features",
      "description": "Showcase the main features and benefits of the AI photo editing capabilities with icons and descriptions"
    },
    {
      "type": "testimonials",
      "title": "Customer Testimonials", 
      "description": "Display customer reviews and success stories to build trust and credibility"
    },
    {
      "type": "cta",
      "title": "Call to Action",
      "description": "Final compelling call-to-action with pricing information and signup form"
    }
  ]
}

Create a complete landing page structure with 4-6 sections that makes sense for ${topic}. Include hero and cta sections, and choose other relevant sections.`,
    });
    
    console.log('✅ Structure generated successfully:', structure);
    return structure;
  } catch (error) {
    console.error('❌ Structure generation failed:', error);
    // Fallback structure
    return {
      title: `${topic} Landing Page`,
      sections: [
        {
          type: 'hero' as const,
          title: 'Hero Section',
          description: `Compelling hero section for ${topic} with headline, subheading, and call-to-action button`
        },
        {
          type: 'features' as const,
          title: 'Key Features',
          description: `Showcase the main features and benefits of ${topic}`
        },
        {
          type: 'cta' as const,
          title: 'Call to Action',
          description: `Encouraging call-to-action section for ${topic}`
        }
      ]
    };
  }
}