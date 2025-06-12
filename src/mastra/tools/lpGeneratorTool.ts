
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';

// Define the schema for a single section of the LP
const sectionSchema = z.object({
  type: z.enum(['hero', 'features', 'testimonials', 'cta', 'faq', 'footer']).describe('The type of section'),
  prompt: z.string().min(10).describe('A detailed prompt for the AI to generate this specific section.'),
});

// Define the schema for the overall LP structure
const lpStructureSchema = z.object({
  sections: z.array(sectionSchema).min(1).max(8).describe('An array of sections that make up the landing page.'),
});

// Define the schema for the generated HTML of a single section
const sectionHtmlSchema = z.object({
  html: z.string().min(50).describe('The HTML content for the section, styled with Tailwind CSS. Must be valid HTML without html, head, or body tags.'),
});

type LPSection = z.infer<typeof sectionSchema>;

/**
 * Generates the overall structure (outline) of the landing page as a JSON object.
 */
async function generateLPStructure(topic: string) {
  try {
    const { object: structure } = await generateObject({
      model: createAnthropic()('claude-3-5-sonnet-20241022'),
      schema: lpStructureSchema,
      maxTokens: 1200,
      temperature: 0.7,
      prompt: `Create a JSON object with a "sections" array for a landing page about: "${topic}".

REQUIREMENTS:
- Return ONLY valid JSON format
- Each section needs "type" and "prompt" fields
- Types: "hero", "features", "testimonials", "cta", "faq", "footer"
- Include 4-5 sections total

EXAMPLE:
{
  "sections": [
    {
      "type": "hero",
      "prompt": "Create compelling hero section for ${topic} with headline and CTA"
    },
    {
      "type": "features", 
      "prompt": "Design features section highlighting key benefits of ${topic}"
    },
    {
      "type": "cta",
      "prompt": "Create call-to-action section for ${topic}"
    }
  ]
}`,
    });
    
    console.log('✅ Structure generated successfully:', structure);
    return structure;
  } catch (error) {
    console.error('❌ Structure generation failed:', error);
    // Fallback structure
    return {
      sections: [
        {
          type: 'hero' as const,
          prompt: `Create a compelling hero section for ${topic} with headline, subheading, and call-to-action button`
        },
        {
          type: 'features' as const,
          prompt: `Design a features section highlighting the key benefits and features of ${topic}`
        },
        {
          type: 'cta' as const,
          prompt: `Create a call-to-action section encouraging users to take action related to ${topic}`
        }
      ]
    };
  }
}

/**
 * Generates the HTML for a single section based on its definition.
 */
async function generateSectionHtml(section: LPSection, sectionIndex: number) {
  try {
    const { object } = await generateObject({
      model: createAnthropic()('claude-3-5-sonnet-20241022'),  // 最新モデルに更新
      schema: sectionHtmlSchema,
      maxTokens: 3000,  // トークン数を少し減らす
      temperature: 0.7,  // 温度を下げて安定性を向上
      prompt: `Generate ONLY a JSON object with an "html" field containing valid HTML for a landing page section.

Section Type: ${section.type}
Section Index: ${sectionIndex}
Prompt: ${section.prompt}

REQUIREMENTS:
1. Return ONLY JSON format: {"html": "your-html-here"}
2. HTML must be complete and valid
3. Use Tailwind CSS classes
4. NO <html>, <head>, or <body> tags
5. Add data-editable-id="section-${sectionIndex}-element-X" to key elements
6. Make it responsive

EXAMPLE OUTPUT:
{
  "html": "<section class='py-16 bg-white'><div class='container mx-auto px-4'><h2 class='text-3xl font-bold' data-editable-id='section-${sectionIndex}-element-1'>Title</h2></div></section>"
}`,
    });
    
    // HTMLコンテンツの検証
    if (!object.html || typeof object.html !== 'string' || object.html.trim().length < 10) {
      throw new Error('Generated HTML is invalid or too short');
    }
    
    console.log(`✅ Section ${sectionIndex} (${section.type}) HTML generated`);
    return object.html;
  } catch (error) {
    console.error(`❌ Section ${sectionIndex} generation failed:`, error);
    // Fallback HTML
    return `<section class="py-16 bg-gray-50" data-editable-id="section-${sectionIndex}-element-0">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold text-gray-800 mb-4" data-editable-id="section-${sectionIndex}-element-1">
          ${section.type.charAt(0).toUpperCase() + section.type.slice(1)} Section
        </h2>
        <p class="text-gray-600" data-editable-id="section-${sectionIndex}-element-2">
          This section is currently being generated. Please try again.
        </p>
      </div>
    </section>`;
  }
}

export async function generateUnifiedLP({ topic }: { topic: string }) {
    console.log(`🚀 Starting LP generation for: ${topic}`);
    const startTime = Date.now();

    try {
        // Step 1: Generate the structure (faster with reduced complexity)
        console.log('📋 Step 1: Generating LP structure...');
        const structureStart = Date.now();
        const structure = await generateLPStructure(topic);
        console.log(`✅ LP Structure generated in ${Date.now() - structureStart}ms:`, structure);

        // Step 2: Generate HTML for each section in parallel with concurrency limit
        console.log('🎨 Step 2: Generating HTML for each section...');
        const htmlStart = Date.now();
        
        // Process in smaller batches to avoid API rate limits
        const batchSize = 2;
        const sectionHtmls: string[] = [];
        
        for (let i = 0; i < structure.sections.length; i += batchSize) {
            const batch = structure.sections.slice(i, i + batchSize);
            const batchPromises = batch.map((section, batchIndex) => 
                generateSectionHtml(section, i + batchIndex)
            );
            
            console.log(`⚡ Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(structure.sections.length/batchSize)}`);
            const batchResults = await Promise.all(batchPromises);
            sectionHtmls.push(...batchResults);
        }
        
        console.log(`✅ All sections HTML generated in ${Date.now() - htmlStart}ms`);

        // Step 3: Combine all HTML parts
        console.log('🔧 Step 3: Combining all HTML sections...');
        const combineStart = Date.now();
        const fullHtmlContent = sectionHtmls.join('\n\n');
        console.log(`✅ HTML combined in ${Date.now() - combineStart}ms`);

        const totalTime = Date.now() - startTime;
        console.log(`🎉 LP generation completed in ${totalTime}ms (${(totalTime/1000).toFixed(2)}s)`);

        // Return the final object
        return {
            htmlContent: fullHtmlContent,
            cssContent: '', // Kept for compatibility
            structure,
            metadata: {
                generationTime: totalTime,
                sectionCount: structure.sections.length,
                topic: topic
            }
        };
    } catch (error) {
        const totalTime = Date.now() - startTime;
        console.error(`❌ LP generation failed after ${totalTime}ms:`, error);
        throw error;
    }
}