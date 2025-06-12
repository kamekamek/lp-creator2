import { NextRequest, NextResponse } from 'next/server';
import { createLPCreatorAgent, createModel } from '@/src/mastra/agents/lpCreatorAgent';
import { mastra } from '@/src/mastra';
import { Message } from 'ai';
import { streamText } from 'ai';

// 開発環境のみログを出力する関数
function devLog(message: string, data?: any) {
  if (process.env.NODE_ENV !== 'production') {
    if (data) {
      console.log(`[LP Creator] ${message}`, data);
    } else {
      console.log(`[LP Creator] ${message}`);
    }
  }
}

// Vercel Serverless Function でストリームを許可するための設定
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { messages, model: requestModel } = await req.json();
    
    // メッセージの検証と処理
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }
    
    // 最新のユーザーメッセージを取得
    const lastUserMessage = messages.filter((m: Message) => m.role === 'user').pop();
    const userContent = lastUserMessage?.content || '';
    
    devLog('Processing LP creation request', { userContent: userContent.substring(0, 100) + '...' });
    
    // デフォルトモデル設定
    let currentModel = {
      provider: 'claude',
      modelName: 'claude-3-5-sonnet-20241022'
    };
    
    // リクエストからモデル設定を取得
    if (requestModel && requestModel.provider && requestModel.modelName) {
      currentModel = requestModel;
      devLog(`Using model from request: ${currentModel.provider} - ${currentModel.modelName}`);
    }
    
    // OpenAIモデルの場合は、Agentを介さずに直接streamTextを呼び出す
    if (currentModel.provider === 'openai') {
      devLog('Bypassing agent for OpenAI model, using streamText directly.');
      const model = createModel(currentModel.provider, currentModel.modelName);
      const response = await streamText({
        model: model,
        messages: messages,
      });
      return response.toDataStreamResponse();
    }
    
    // 選択されたモデルでlpCreatorAgentを動的に作成
    const lpCreatorAgent = createLPCreatorAgent(currentModel.provider, currentModel.modelName);
    
    devLog('Starting LP creation with agent');
    
    // 動的に作成されたlpCreatorAgentを使用してストリーミングレスポンスを取得
    const mastraStreamResult = await lpCreatorAgent.stream(messages);
    
    // Stream オブジェクトの詳細をログ出力
    devLog('Mastra Stream Result Type', typeof mastraStreamResult);
    if (mastraStreamResult && typeof mastraStreamResult === 'object') {
      devLog('Mastra Stream Result Keys', Object.keys(mastraStreamResult));
      
      // toDataStreamResponse メソッドの有無を確認
      if (typeof (mastraStreamResult as any).toDataStreamResponse === 'function') {
        devLog('Mastra Stream Result has toDataStreamResponse method');
      }
    }
    
    // mastraStreamResult を適切なレスポンスに変換
    if (typeof (mastraStreamResult as any).toDataStreamResponse === 'function') {
      return (mastraStreamResult as any).toDataStreamResponse();
    } else {
      // toDataStreamResponse が利用できない場合のエラー報告
      return NextResponse.json(
        { error: 'Internal server error: Stream processing failed.' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    // エラー詳細をログ出力
    const message = error instanceof Error ? error.message : 'Internal server error';
    devLog('LP Creator API error:', message);
    console.error('[LP Creator] Full error:', error);
    
    return NextResponse.json(
      { error: 'LP Creator API error', details: message },
      { status: 500 }
    );
  }
}