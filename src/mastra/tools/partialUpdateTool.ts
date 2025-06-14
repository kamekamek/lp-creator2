import { createAnthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';

// Previously defined schemas (can be imported from lpGeneratorTool if refactored)
const sectionSchema = z.object({
  type: z.enum(['hero', 'features', 'testimonials', 'cta', 'faq', 'footer']),
  prompt: z.string().describe('A detailed prompt for the AI to generate this specific section.'),
});

const lpStructureSchema = z.object({
  sections: z.array(sectionSchema).describe('An array of sections that make up the landing page.'),
});

const sectionHtmlSchema = z.object({
  html: z.string().describe('The HTML content for the section, styled with Tailwind CSS.'),
});

/**
 * Regenerates a specific section of the landing page based on a modification prompt.
 */
async function regenerateSectionHtml(section: z.infer<typeof sectionSchema>, modificationPrompt: string, sectionIndex: number) {
  const { object } = await generateObject({
    model: createAnthropic()('claude-opus-4-20250514'),
    schema: sectionHtmlSchema,
    prompt: `You are tasked with modifying a specific section of an existing landing page. 
    The user wants to change an element within this section.

    **Original Section Prompt:**
    ${section.prompt}

    **User's Modification Request:**
    ${modificationPrompt}

    Based on the user's request, regenerate the HTML for this entire section, incorporating the change. 
    Maintain the overall structure and style of the section.
    
    *** IMPORTANT INSTRUCTION ***
    For every editable element (like headings, paragraphs, buttons, list items), add a unique 'data-editable-id' attribute. The ID should be structured as 'section-${sectionIndex}-element-ELEMENT_INDEX', where ELEMENT_INDEX starts from 0 for each section. For example: 'data-editable-id="section-${sectionIndex}-element-0"', 'data-editable-id="section-${sectionIndex}-element-1"'.

    Output only the new HTML for the modified section. Do not include <html>, <head>, or <body> tags.`,
  });
  return object.html;
}

export async function partialUpdateLP({ 
  currentLP, 
  modificationPrompt, 
  selectedElementId 
}: {
  currentLP: z.infer<typeof lpStructureSchema> & { htmlContent: string };
  modificationPrompt: string;
  selectedElementId: string;
}) {
  console.log('--- Starting Partial LP Update ---');
  console.log('Selected Element ID:', selectedElementId);

  // 1. Identify which section the selected element belongs to.
  const match = selectedElementId.match(/section-(\d+)-element-\d+/);
  if (!match || match.length < 2) { // matchがnull、または期待するキャプチャグループがない場合
    console.error('Invalid selectedElementId format:', selectedElementId);
    throw new Error(`Invalid selectedElementId format: ${selectedElementId}. Expected format like 'section-X-element-Y'.`);
  }
  // 要素IDのパース処理を継続
  const sectionIndexToUpdate = parseInt(match[1], 10);
  const sectionToUpdate = currentLP.sections[sectionIndexToUpdate];

  if (!sectionToUpdate) {
    throw new Error(`Section with index ${sectionIndexToUpdate} not found.`);
  }
  console.log(`Identified section to update: Index ${sectionIndexToUpdate}, Type: ${sectionToUpdate.type}`);

  // 2. Regenerate the HTML for only that section.
  console.log('Regenerating HTML for the section...');
  const updatedSectionHtml = await regenerateSectionHtml(sectionToUpdate, modificationPrompt, sectionIndexToUpdate);

  // 3. Reconstruct the full HTML by replacing the old section with the new one.
  console.log('Reconstructing full HTML...');
  const allSectionsHtml = await Promise.all(currentLP.sections.map(async (section, index) => {
    if (index === sectionIndexToUpdate) {
      return updatedSectionHtml;
    }
    // This is a simplification. In a real scenario, you'd re-generate or have the original HTML available.
    // For now, we assume the original `htmlContent` is a join of all sections and we can't easily split it.
    // So, we must regenerate the other sections as well to be safe.
    // A better approach would be to store each section's HTML separately.
    const { object } = await generateObject({
        model: createAnthropic()('claude-opus-4-20250514'),
        schema: sectionHtmlSchema,
        prompt: `Generate the HTML for a landing page section based on the following prompt. Use Tailwind CSS for styling. Make it visually appealing and responsive. 

    *** IMPORTANT INSTRUCTION ***
    For every editable element (like headings, paragraphs, buttons, list items), add a unique 'data-editable-id' attribute. The ID should be structured as 'section-${index}-element-ELEMENT_INDEX', where ELEMENT_INDEX starts from 0 for each section. For example: 'data-editable-id="section-${index}-element-0"', 'data-editable-id="section-${index}-element-1"'.

    Do not include <html>, <head>, or <body> tags. Only generate the content for this specific section.

    Prompt: ${section.prompt}`,
    });
    return object.html;
  }));

  const fullHtmlContent = allSectionsHtml.join('\n');

  const updatedLP = {
    ...currentLP,
    htmlContent: fullHtmlContent,
  };

  console.log('--- Partial LP Update Finished ---');
  return updatedLP;
}
