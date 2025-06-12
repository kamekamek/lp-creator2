
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
async function generateSectionHtml(section: LPSection, sectionIndex: number) {
  const { object } = await generateObject({
    model: createAnthropic()('claude-3-5-sonnet-20240620'),
    schema: sectionHtmlSchema,
    prompt: `Generate the HTML for a landing page section based on the following prompt. Use Tailwind CSS extensively for styling. Make it highly visual, professional, and responsive. 

    *** STYLING REQUIREMENTS ***
    - Use rich colors, gradients, and shadows to make it visually appealing
    - Apply proper spacing (padding, margins) using Tailwind classes
    - Ensure responsive design with sm:, md:, lg: prefixes
    - Use typography classes like text-4xl, font-bold, text-gray-800, etc.
    - Add background colors, borders, and visual elements
    - Include hover effects and transitions where appropriate

    *** IMAGE INSTRUCTION ***
    If the section requires an image, embed a relevant, high-quality image from Unsplash. Use the format 'https://source.unsplash.com/1600x900/?<KEYWORDS>', where <KEYWORDS> are 1-3 comma-separated search terms directly related to the section's content or theme. For example, if the prompt is about 'modern kitchen appliances', suitable keywords could be 'modern,kitchen,appliances'. Ensure the image is contextually appropriate.

    *** EDITABLE ELEMENT INSTRUCTION ***
    For every editable element (like headings, paragraphs, buttons, list items), add a unique 'data-editable-id' attribute. The ID should be structured as 'section-${sectionIndex}-element-ELEMENT_INDEX', where ELEMENT_INDEX starts from 0 for each section. For example: 'data-editable-id="section-${sectionIndex}-element-0"', 'data-editable-id="section-${sectionIndex}-element-1"'.

    *** EXAMPLE STYLING ***
    Hero sections should use: bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20
    Feature sections should use: bg-gray-50 py-16
    Buttons should use: bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors
    Cards should use: bg-white rounded-lg shadow-lg p-6

    Do not include <html>, <head>, or <body> tags. Only generate the content for this specific section.

    Prompt: ${section.prompt}`,
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
        const sectionHtmlPromises = structure.sections.map((section, index) => generateSectionHtml(section, index));
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