# LP生成・編集・対話システム詳細設計書 - 実装詳細

> **関連ドキュメント**: [概要](lp-generation-editing-design-overview.md) | [コアシステム](lp-generation-editing-design-core.md)

---

## 5. 実装アーキテクチャ

### 5.1 状態管理設計

```typescript
// src/store/editing-store.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface EditingState {
  // LP全体の状態
  lpData: {
    id: string;
    sections: Section[];
    designSystem: DesignSystem;
    metadata: LPMetadata;
  };
  
  // 編集状態
  editingMode: 'visual' | 'code' | 'preview';
  selectedElements: string[];
  activeElement: string | null;
  
  // 履歴管理
  history: {
    past: LPSnapshot[];
    future: LPSnapshot[];
  };
  
  // リアルタイム同期
  syncStatus: 'synced' | 'syncing' | 'error';
  collaborators: Collaborator[];
  
  // アクション
  actions: {
    updateElement: (elementId: string, updates: Partial<Element>) => void;
    addSection: (section: Section, position?: number) => void;
    deleteElement: (elementId: string) => void;
    undo: () => void;
    redo: () => void;
    applyAISuggestion: (suggestion: Suggestion) => void;
  };
}

export const useEditingStore = create<EditingState>()(
  immer((set, get) => ({
    lpData: initialLPData,
    editingMode: 'visual',
    selectedElements: [],
    activeElement: null,
    history: { past: [], future: [] },
    syncStatus: 'synced',
    collaborators: [],
    
    actions: {
      updateElement: (elementId, updates) => set((state) => {
        // 履歴に追加
        state.history.past.push(createSnapshot(state.lpData));
        state.history.future = [];
        
        // 要素を更新
        const element = findElement(state.lpData, elementId);
        if (element) {
          Object.assign(element, updates);
        }
        
        // 同期をトリガー
        state.syncStatus = 'syncing';
        syncChanges(elementId, updates);
      }),
      
      // ... 他のアクション
    }
  }))
);
```

### 5.2 パフォーマンス最適化

```typescript
// src/utils/performance-optimization.ts
export class PerformanceOptimizer {
  // 仮想化レンダリング
  virtualizeElements(elements: Element[], viewport: Viewport): Element[] {
    return elements.filter(element => {
      const elementBounds = calculateBounds(element);
      return intersectsViewport(elementBounds, viewport);
    });
  }
  
  // デバウンス処理
  debouncedUpdate = debounce((elementId: string, updates: any) => {
    this.applyUpdates(elementId, updates);
  }, 300);
  
  // バッチ更新
  batchUpdates(updates: Update[]) {
    unstable_batchedUpdates(() => {
      updates.forEach(update => {
        this.applyUpdate(update);
      });
    });
  }
  
  // メモ化
  memoizedCalculations = new Map<string, any>();
  
  calculateWithMemo<T>(key: string, calculation: () => T): T {
    if (!this.memoizedCalculations.has(key)) {
      this.memoizedCalculations.set(key, calculation());
    }
    return this.memoizedCalculations.get(key);
  }
}
```

### 5.3 プラグインシステム

```typescript
// src/plugins/plugin-system.ts
export interface Plugin {
  id: string;
  name: string;
  version: string;
  hooks: {
    beforeGenerate?: (context: GenerationContext) => void;
    afterGenerate?: (result: GenerationResult) => void;
    beforeEdit?: (element: Element, changes: any) => boolean;
    afterEdit?: (element: Element) => void;
    customTools?: Tool[];
    customComponents?: Component[];
  };
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  
  async loadPlugin(pluginPath: string) {
    const plugin = await import(pluginPath);
    this.validatePlugin(plugin);
    this.plugins.set(plugin.id, plugin);
    this.initializePlugin(plugin);
  }
  
  executeHook<T extends keyof Plugin['hooks']>(
    hookName: T,
    ...args: Parameters<NonNullable<Plugin['hooks'][T]>>
  ) {
    this.plugins.forEach(plugin => {
      const hook = plugin.hooks[hookName];
      if (hook) {
        hook(...args);
      }
    });
  }
  
  getCustomTools(): Tool[] {
    return Array.from(this.plugins.values())
      .flatMap(plugin => plugin.hooks.customTools || []);
  }
}
```

---

## 6. 技術スタック詳細

### 必要な依存関係

```json
{
  "dependencies": {
    // AI・自然言語処理
    "@tensorflow/tfjs": "^4.10.0",
    "natural": "^6.5.0",
    "compromise": "^14.10.0",
    
    // リアルタイム同期
    "yjs": "^13.6.0",
    "y-websocket": "^1.5.0",
    
    // 音声認識・合成
    "@speechly/react-client": "^2.2.0",
    "react-speech-kit": "^3.0.1",
    
    // ジェスチャー認識
    "hammerjs": "^2.0.8",
    "@use-gesture/react": "^10.2.0",
    
    // アニメーション
    "framer-motion": "^10.16.0",
    "lottie-react": "^2.4.0",
    
    // ドラッグ&ドロップ
    "@dnd-kit/sortable": "^7.0.2",
    "@dnd-kit/core": "^6.0.8",
    
    // 状態管理
    "zustand": "^4.4.0",
    "immer": "^10.0.2",
    
    // パフォーマンス
    "react-window": "^1.8.9",
    "react-intersection-observer": "^9.5.0"
  }
}
```

### 6.1 開発環境セットアップ

```bash
# プロジェクト初期化
npm create next-app@latest lp-creator --typescript --tailwind --eslint
cd lp-creator

# 必要な依存関係のインストール
npm install @tensorflow/tfjs natural compromise
npm install yjs y-websocket
npm install @speechly/react-client react-speech-kit
npm install hammerjs @use-gesture/react
npm install framer-motion lottie-react
npm install @dnd-kit/sortable @dnd-kit/core
npm install zustand immer
npm install react-window react-intersection-observer

# 開発用依存関係
npm install -D @types/natural @types/hammerjs
npm install -D eslint-plugin-react-hooks
npm install -D prettier eslint-config-prettier
```

### 6.2 デプロイメント設定

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      
      - name: Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### 6.3 パフォーマンス監視

```typescript
// src/utils/performance-monitoring.ts
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  startMeasure(name: string) {
    performance.mark(`${name}-start`);
  }
  
  endMeasure(name: string) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measurement = performance.getEntriesByName(name)[0];
    const duration = measurement.duration;
    
    this.recordMetric(name, duration);
    
    // 閾値を超えた場合は警告
    if (duration > this.getThreshold(name)) {
      console.warn(`Performance warning: ${name} took ${duration}ms`);
      this.reportSlowOperation(name, duration);
    }
  }
  
  private recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // 最新100件のみ保持
    if (values.length > 100) {
      values.shift();
    }
  }
  
  getAverageMetric(name: string): number {
    const values = this.metrics.get(name) || [];
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
}
```

### 6.4 セキュリティ設定

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import rateLimit from 'express-rate-limit';

// レート制限設定
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 最大100リクエスト
  message: 'Too many requests from this IP',
});

export function middleware(request: NextRequest) {
  // セキュリティヘッダーの設定
  const response = NextResponse.next();
  
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'"
  );
  
  // API要求に対するレート制限
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // レート制限チェック（実装は環境に依存）
    const clientIP = request.ip || 'unknown';
    if (shouldRateLimit(clientIP)) {
      return new Response('Rate limit exceeded', { status: 429 });
    }
  }
  
  return response;
}

export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|favicon.ico).*)'],
};
```

### 6.5 テスト設定

```typescript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

```typescript
// src/components/__tests__/ContextAwareEditor.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ContextAwareEditor } from '../editing/ContextAwareEditor';

describe('ContextAwareEditor', () => {
  const mockElement = {
    id: 'test-element',
    type: 'heading' as const,
    content: 'Test Content',
    context: {
      section: 'hero',
      role: 'headline',
      constraints: {
        maxLength: 100,
        tone: 'professional',
      },
    },
  };

  it('renders content correctly', () => {
    render(<ContextAwareEditor element={mockElement} />);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('enters edit mode on double click', () => {
    render(<ContextAwareEditor element={mockElement} />);
    const contentElement = screen.getByText('Test Content');
    
    fireEvent.doubleClick(contentElement);
    
    expect(screen.getByDisplayValue('Test Content')).toBeInTheDocument();
  });

  it('shows context menu on hover', async () => {
    render(<ContextAwareEditor element={mockElement} />);
    const contentElement = screen.getByText('Test Content');
    
    fireEvent.mouseEnter(contentElement);
    
    // 300ms待機（hover menu delay）
    await new Promise(resolve => setTimeout(resolve, 350));
    
    expect(screen.getByText('✏️編集')).toBeInTheDocument();
    expect(screen.getByText('🤖AI改善')).toBeInTheDocument();
  });
});
```

### 6.6 環境変数設定

```bash
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# AI プロバイダー
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key

# データベース
DATABASE_URL=sqlite:./dev.db
REDIS_URL=redis://localhost:6379

# 認証
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# 監視・ログ
SENTRY_DSN=your_sentry_dsn
ANALYTICS_ID=your_analytics_id
```

---

## 実装ロードマップ

### Phase 1: 基盤構築 (1-2ヶ月)
- ✅ 基本LP生成機能
- ✅ プロワークフロー
- ✅ リアルタイムプレビュー
- 🔄 状態管理システム
- 🔄 パフォーマンス最適化

### Phase 2: 編集機能 (2-3ヶ月)
- 📋 コンテキスト認識型編集
- 📋 AI駆動コンテンツ改善
- 📋 ビジュアルデザインエディタ
- 📋 アニメーションシステム

### Phase 3: 対話システム (3-4ヶ月)
- 📋 マルチモーダルインターフェース
- 📋 音声・ジェスチャー入力
- 📋 インテリジェント提案
- 📋 リアルタイムコラボレーション

### Phase 4: 最適化・拡張 (4-6ヶ月)
- 📋 プラグインシステム
- 📋 エンタープライズ機能
- 📋 国際化・多言語対応
- 📋 PWA対応

これらの設計により、readdy.ai水準の高度なLP生成・編集システムを実現できます。