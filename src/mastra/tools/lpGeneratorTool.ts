
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';

// Define the schema for a single section of the LP
const sectionSchema = z.object({
  type: z.enum(['hero', 'features', 'testimonials', 'cta', 'faq', 'footer']),
  prompt: z.string().describe('A detailed prompt for the AI to generate this specific section.'),
});

// Define the schema for the overall LP structure
const lpStructureSchema = z.object({
  sections: z.array(sectionSchema).describe('An array of sections that make up the landing page.'),
});

// Define the schema for the generated HTML of a single section
const sectionHtmlSchema = z.object({
  html: z.string().describe('The HTML content for the section, styled with Tailwind CSS.'),
});

type LPSection = z.infer<typeof sectionSchema>;

/**
 * Generates the overall structure (outline) of the landing page as a JSON object.
 */
async function generateLPStructure(topic: string) {
  const { object: structure } = await generateObject({
    model: createAnthropic()('claude-3-5-sonnet-20240620'),
    schema: lpStructureSchema,
    prompt: `Create a logical and effective landing page structure (outline) for the topic: "${topic}". For each section, provide a detailed prompt that an AI can use to generate the HTML for that specific part. Include common sections like a hero, features, testimonials, and a call-to-action.`,
  });
  return structure;
}

/**
 * Generates the HTML for a single section based on its definition.
 */
async function generateSectionHtml(section: LPSection) {
  const { object } = await generateObject({
    model: createAnthropic()('claude-3-5-sonnet-20240620'),
    schema: sectionHtmlSchema,
    prompt: `Generate the HTML for a landing page section based on the following prompt. Use Tailwind CSS for styling. Make it visually appealing and responsive. Do not include <html>, <head>, or <body> tags. Only generate the content for this specific section.\n\nPrompt: ${section.prompt}`,
  });
  return object.html;
}

export async function generateUnifiedLP({ topic }: { topic: string }) {

    console.log(`Generating LP for topic: ${topic}`);

    // Step 1: Generate the structure
    console.log('Step 1: Generating LP structure...');
    const structure = await generateLPStructure(topic);
    console.log('LP Structure generated:', structure);

    // Step 2: Generate HTML for each section in parallel
    console.log('Step 2: Generating HTML for each section...');
    const sectionHtmlPromises = structure.sections.map(section => generateSectionHtml(section));
    const sectionHtmls = await Promise.all(sectionHtmlPromises);
    console.log('All sections HTML generated.');

    // Step 3: Combine all HTML parts
    console.log('Step 3: Combining all HTML sections...');
    const fullHtmlContent = sectionHtmls.join('\n');

    // Return the final object
    return {
      htmlContent: fullHtmlContent,
      cssContent: '', // Kept for compatibility
      structure,
    };
}