import { z } from 'zod';
// Note: createWorkflow implementation is simulated for now

// ワークフロー入力スキーマ
const proHPWorkflowInputSchema = z.object({
  initialQuery: z.string().describe('ユーザーの初期要求'),
  businessType: z.string().optional().describe('ビジネスタイプ'),
  targetAudience: z.string().optional().describe('ターゲットオーディエンス'),
  goals: z.string().optional().describe('ビジネス目標'),
});

// ワークフロー出力スキーマ
const proHPWorkflowOutputSchema = z.object({
  projectFiles: z.object({
    html: z.string().describe('最終HTMLファイル'),
    css: z.string().describe('最終CSSファイル'),
    javascript: z.string().describe('最終JavaScriptファイル'),
  }),
  assets: z.object({
    imagePrompts: z.array(z.object({
      id: z.string(),
      fileName: z.string(),
      prompt: z.string(),
    })).describe('画像生成プロンプト一覧'),
    brandingGuidelines: z.object({
      colorPalette: z.array(z.string()),
      visualStyle: z.string(),
    }),
  }),
  qualityReport: z.object({
    overallScore: z.number(),
    lighthouse: z.object({
      performance: z.number(),
      accessibility: z.number(),
      bestPractices: z.number(),
      seo: z.number(),
    }),
    actionItems: z.array(z.object({
      priority: z.string(),
      issue: z.string(),
      solution: z.string(),
    })),
  }),
  downloadUrl: z.string().optional().describe('プロジェクトファイルのダウンロードURL'),
});

// ステップ1: 情報収集と戦略設計
const strategyStep = {
  id: 'strategy-collection',
  description: '情報整理と戦略設計',
  inputSchema: z.object({
    initialQuery: z.string(),
    businessType: z.string().optional(),
    targetAudience: z.string().optional(),
    goals: z.string().optional(),
  }),
  outputSchema: z.object({
    strategy: z.object({
      businessUnderstanding: z.string(),
      targetPersona: z.string(),
      competitorAnalysis: z.string(),
      uniqueValueProposition: z.string(),
    }),
    needsUserConfirmation: z.boolean(),
    confirmationRequest: z.string().optional(),
  }),
  execute: async (input: any, context: any) => {
    const { collectStrategyInfo } = await import('../tools/collectStrategyInfo');
    
    // 初期クエリから基本情報を抽出
    const answers = [
      input.initialQuery,
      input.businessType || '',
      input.targetAudience || '',
      input.goals || '',
    ];

    const result = await collectStrategyInfo.execute({ answers });
    
    return {
      strategy: result.strategy,
      needsUserConfirmation: true,
      confirmationRequest: \`
以下の戦略設計でよろしいでしょうか？

**ビジネス理解:**
\${result.strategy.businessUnderstanding}

**ターゲットペルソナ:**
\${result.strategy.targetPersona}

**競合分析:**
\${result.strategy.competitorAnalysis}

**独自価値提案:**
\${result.strategy.uniqueValueProposition}

この内容で次のステップに進む場合は「OK」、修正が必要な場合は具体的な修正内容をお伝えください。
      \`,
    };
  },
};

// ステップ2: コンセプトとワイヤーフレーム設計
const conceptStep = {
  id: 'concept-wireframe',
  description: 'HPコンセプトと構成提案',
  inputSchema: z.object({
    strategy: z.object({
      businessUnderstanding: z.string(),
      targetPersona: z.string(),
      competitorAnalysis: z.string(),
      uniqueValueProposition: z.string(),
    }),
    userFeedback: z.string().optional(),
  }),
  outputSchema: z.object({
    concept: z.object({
      siteMap: z.string(),
      wireframe: z.string(),
      designDirection: z.string(),
    }),
    needsUserConfirmation: z.boolean(),
    confirmationRequest: z.string().optional(),
  }),
  execute: async (input: any, context: any) => {
    const { generateConceptWireframe } = await import('../tools/generateConceptWireframe');
    
    const result = await generateConceptWireframe.execute({
      strategy: input.strategy,
    });
    
    return {
      concept: result.concept,
      needsUserConfirmation: true,
      confirmationRequest: \`
サイト構成とワイヤーフレームを確認してください：

**サイトマップ:**
\${result.concept.siteMap}

**ワイヤーフレーム:**
\${result.concept.wireframe}

**デザイン方向性:**
\${result.concept.designDirection}

この設計で次のステップに進む場合は「OK」、修正が必要な場合は詳細をお伝えください。
      \`,
    };
  },
};

// ステップ3: コピーライティングとUX設計
const copyStep = {
  id: 'copy-ux-design',
  description: '詳細コピーとUX設計',
  inputSchema: z.object({
    strategy: z.object({
      businessUnderstanding: z.string(),
      targetPersona: z.string(),
      competitorAnalysis: z.string(),
      uniqueValueProposition: z.string(),
    }),
    concept: z.object({
      siteMap: z.string(),
      wireframe: z.string(),
      designDirection: z.string(),
    }),
    userFeedback: z.string().optional(),
  }),
  outputSchema: z.object({
    copyContent: z.object({
      fullCopy: z.string(),
      ctaDesign: z.string(),
      interactionSpec: z.string(),
    }),
    needsUserConfirmation: z.boolean(),
    confirmationRequest: z.string().optional(),
  }),
  execute: async (input: any, context: any) => {
    const { writeCopyAndUX } = await import('../tools/writeCopyAndUX');
    
    const result = await writeCopyAndUX.execute({
      persona: input.strategy.targetPersona,
      wireframe: input.concept.wireframe,
      uniqueValueProp: input.strategy.uniqueValueProposition,
      designDirection: input.concept.designDirection,
    });
    
    return {
      copyContent: result.copyContent,
      needsUserConfirmation: true,
      confirmationRequest: \`
コピーライティングとUX設計が完了しました：

**メインコピー概要:**
\${result.copyContent.fullCopy.substring(0, 500)}...

**CTA設計:**
\${result.copyContent.ctaDesign}

**インタラクション仕様:**
\${result.copyContent.interactionSpec}

この内容で実装に進む場合は「OK」、修正が必要な場合は詳細をお伝えください。
      \`,
    };
  },
};

// ステップ4: ファイル構造設計
const fileStructureStep = {
  id: 'file-structure-planning',
  description: 'ファイル構造設計と実装計画',
  inputSchema: z.object({
    concept: z.object({
      designDirection: z.string(),
      wireframe: z.string(),
    }),
    copyContent: z.object({
      fullCopy: z.string(),
    }),
    strategy: z.object({
      targetPersona: z.string(),
    }),
  }),
  outputSchema: z.object({
    fileStructure: z.object({
      description: z.string(),
      structure: z.string(),
    }),
    implementationStrategy: z.object({
      htmlApproach: z.string(),
      cssApproach: z.string(),
      jsApproach: z.string(),
    }),
    technicalSpecs: z.object({
      responsive: z.string(),
      seo: z.string(),
      accessibility: z.string(),
      performance: z.string(),
    }),
  }),
  execute: async (input: any, context: any) => {
    const { planFileStructureTool } = await import('../tools/planFileStructure');
    
    const result = await planFileStructureTool.execute({
      concept: input.concept.designDirection,
      copyContent: input.copyContent.fullCopy,
      wireframe: input.concept.wireframe,
      targetAudience: input.strategy.targetPersona,
    });
    
    return result;
  },
};

// ステップ5-7: 並列実装（HTML, CSS, JavaScript）
const implementationSteps = {
  html: {
    id: 'html-generation',
    description: 'HTML実装',
    execute: async (input: any, context: any) => {
      const { generateHTMLTool } = await import('../tools/generateHTML');
      
      return await generateHTMLTool.execute({
        fileStructure: input.fileStructure,
        copyContent: input.copyContent.fullCopy,
        wireframe: input.concept.wireframe,
        technicalSpecs: input.technicalSpecs,
      });
    },
  },
  css: {
    id: 'css-generation',
    description: 'CSS実装',
    execute: async (input: any, context: any) => {
      const { generateCSSTool } = await import('../tools/generateCSS');
      
      return await generateCSSTool.execute({
        html: input.htmlResult.html,
        fileStructure: input.fileStructure,
        technicalSpecs: input.technicalSpecs,
        designDirection: input.concept.designDirection,
      });
    },
  },
  javascript: {
    id: 'javascript-generation',
    description: 'JavaScript実装',
    execute: async (input: any, context: any) => {
      const { generateJSTool } = await import('../tools/generateJS');
      
      return await generateJSTool.execute({
        html: input.htmlResult.html,
        css: input.cssResult.css,
        technicalSpecs: input.technicalSpecs,
        interactionRequirements: input.copyContent.interactionSpec,
      });
    },
  },
};

// ステップ9: 画像プロンプト生成
const imagePromptsStep = {
  id: 'image-prompts-generation',
  description: '画像生成プロンプト作成',
  execute: async (input: any, context: any) => {
    const { makeImagePromptsTool } = await import('../tools/makeImagePrompts');
    
    return await makeImagePromptsTool.execute({
      html: input.htmlResult.html,
      copyContent: input.copyContent.fullCopy,
      brandDirection: input.concept.designDirection,
      targetAudience: input.strategy.targetPersona,
      wireframe: input.concept.wireframe,
    });
  },
};

// ステップ10: 品質チェック
const qualityCheckStep = {
  id: 'quality-checklist',
  description: '品質チェックと最終確認',
  execute: async (input: any, context: any) => {
    const { qualityChecklistTool } = await import('../tools/qualityChecklist');
    
    const imagePrompts = input.imagePromptsResult.imagePrompts.map((img: any) => ({
      id: img.id,
      fileName: img.fileName,
      section: img.section,
      purpose: img.purpose,
    }));
    
    return await qualityChecklistTool.execute({
      html: input.htmlResult.html,
      css: input.cssResult.css,
      javascript: input.jsResult.javascript,
      imagePrompts,
    });
  },
};

// メインワークフロー定義
export const proHPWorkflow = createWorkflow({
  id: 'pro-hp-workflow',
  description: 'プロフェッショナルHP作成フロー - 段階確認付きワークフロー',
  inputSchema: proHPWorkflowInputSchema,
  outputSchema: proHPWorkflowOutputSchema,
})
  // ステップ1: 戦略設計
  .step('strategy', strategyStep.execute)
  .suspend('strategy-review', {
    description: '戦略設計の確認',
    schema: z.object({
      approved: z.boolean(),
      feedback: z.string().optional(),
    }),
  })
  
  // ステップ2: コンセプト設計
  .step('concept', conceptStep.execute)
  .suspend('concept-review', {
    description: 'コンセプト設計の確認',
    schema: z.object({
      approved: z.boolean(),
      feedback: z.string().optional(),
    }),
  })
  
  // ステップ3: コピー設計
  .step('copy', copyStep.execute)
  .suspend('copy-review', {
    description: 'コピー設計の確認',
    schema: z.object({
      approved: z.boolean(),
      feedback: z.string().optional(),
    }),
  })
  
  // ステップ4: ファイル構造設計
  .step('fileStructure', fileStructureStep.execute)
  
  // ステップ5-7: 並列実装
  .parallel({
    html: implementationSteps.html.execute,
    css: implementationSteps.css.execute,
    javascript: implementationSteps.javascript.execute,
  })
  
  // ステップ9: 画像プロンプト生成
  .step('imagePrompts', imagePromptsStep.execute)
  
  // ステップ10: 品質チェック
  .step('qualityCheck', qualityCheckStep.execute)
  
  // 最終処理
  .step('finalize', async (input: any, context: any) => {
    // プロジェクトファイルの整理
    const projectFiles = {
      html: input.htmlResult.html,
      css: input.cssResult.css,
      javascript: input.jsResult.javascript,
    };

    // アセット情報の整理
    const assets = {
      imagePrompts: input.imagePromptsResult.imagePrompts.map((img: any) => ({
        id: img.id,
        fileName: img.fileName,
        prompt: img.prompt,
      })),
      brandingGuidelines: input.imagePromptsResult.brandingGuidelines,
    };

    // 品質レポートの整理
    const qualityReport = {
      overallScore: input.qualityCheckResult.overallScore,
      lighthouse: input.qualityCheckResult.summary.lighthouse,
      actionItems: input.qualityCheckResult.actionItems.map((item: any) => ({
        priority: item.priority,
        issue: item.issue,
        solution: item.solution,
      })),
    };

    // TODO: 実際のプロジェクトではZIPファイル生成とアップロード処理を実装
    const downloadUrl = \`/downloads/project-\${Date.now()}.zip\`;

    return {
      projectFiles,
      assets,
      qualityReport,
      downloadUrl,
    };
  })
  
  .commit();

// ワークフローヘルパー関数
export const startProHPWorkflow = async (input: z.infer<typeof proHPWorkflowInputSchema>) => {
  return await proHPWorkflow.start(input);
};

export const resumeProHPWorkflow = async (runId: string, stepData: any) => {
  return await proHPWorkflow.resume(runId, stepData);
};

export const getWorkflowStatus = async (runId: string) => {
  return await proHPWorkflow.getStatus(runId);
};