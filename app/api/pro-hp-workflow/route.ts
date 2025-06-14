import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { startProHPWorkflow, resumeProHPWorkflow, getWorkflowStatus } from '@/src/mastra/workflows/proHPWorkflow';

// リクエストスキーマ
const startWorkflowSchema = z.object({
  action: z.literal('start'),
  input: z.object({
    initialQuery: z.string(),
    businessType: z.string().optional(),
    targetAudience: z.string().optional(),
    goals: z.string().optional(),
  }),
});

const resumeWorkflowSchema = z.object({
  action: z.literal('resume'),
  runId: z.string(),
  stepData: z.object({
    approved: z.boolean(),
    feedback: z.string().optional(),
  }),
});

const statusWorkflowSchema = z.object({
  action: z.literal('status'),
  runId: z.string(),
});

const workflowRequestSchema = z.discriminatedUnion('action', [
  startWorkflowSchema,
  resumeWorkflowSchema,
  statusWorkflowSchema,
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const request = workflowRequestSchema.parse(body);

    switch (request.action) {
      case 'start': {
        console.log('Starting Professional HP Workflow with input:', request.input);
        
        const result = await startProHPWorkflow(request.input);
        
        return NextResponse.json({
          success: true,
          data: {
            runId: result.runId,
            status: result.status,
            currentStep: result.currentStep,
            output: result.output,
            needsUserInput: result.status === 'suspended',
            confirmationRequest: result.output?.confirmationRequest,
          },
        });
      }

      case 'resume': {
        console.log('Resuming workflow:', request.runId, 'with step data:', request.stepData);
        
        const result = await resumeProHPWorkflow(request.runId, request.stepData);
        
        return NextResponse.json({
          success: true,
          data: {
            runId: result.runId,
            status: result.status,
            currentStep: result.currentStep,
            output: result.output,
            needsUserInput: result.status === 'suspended',
            confirmationRequest: result.output?.confirmationRequest,
          },
        });
      }

      case 'status': {
        console.log('Getting workflow status for:', request.runId);
        
        const result = await getWorkflowStatus(request.runId);
        
        return NextResponse.json({
          success: true,
          data: {
            runId: result.runId,
            status: result.status,
            currentStep: result.currentStep,
            output: result.output,
            progress: calculateProgress(result.currentStep),
            history: result.history,
          },
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Workflow API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request format',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const runId = searchParams.get('runId');

  if (!runId) {
    return NextResponse.json({
      success: false,
      error: 'Missing runId parameter',
    }, { status: 400 });
  }

  try {
    const result = await getWorkflowStatus(runId);
    
    return NextResponse.json({
      success: true,
      data: {
        runId: result.runId,
        status: result.status,
        currentStep: result.currentStep,
        output: result.output,
        progress: calculateProgress(result.currentStep),
        history: result.history,
      },
    });

  } catch (error) {
    console.error('Workflow status API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get workflow status',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// ワークフローの進捗を計算
function calculateProgress(currentStep: string): {
  percentage: number;
  step: number;
  totalSteps: number;
  stepName: string;
} {
  const steps = [
    { id: 'strategy', name: '戦略設計' },
    { id: 'strategy-review', name: '戦略確認' },
    { id: 'concept', name: 'コンセプト設計' },
    { id: 'concept-review', name: 'コンセプト確認' },
    { id: 'copy', name: 'コピーライティング' },
    { id: 'copy-review', name: 'コピー確認' },
    { id: 'fileStructure', name: 'ファイル構造設計' },
    { id: 'implementation', name: '実装（HTML/CSS/JS）' },
    { id: 'imagePrompts', name: '画像プロンプト生成' },
    { id: 'qualityCheck', name: '品質チェック' },
    { id: 'finalize', name: '最終化' },
  ];

  const currentIndex = steps.findIndex(step => step.id === currentStep);
  const stepNumber = currentIndex >= 0 ? currentIndex + 1 : 1;
  const percentage = Math.round((stepNumber / steps.length) * 100);
  const stepName = steps[currentIndex]?.name || '不明なステップ';

  return {
    percentage,
    step: stepNumber,
    totalSteps: steps.length,
    stepName,
  };
}

// CORS対応
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}