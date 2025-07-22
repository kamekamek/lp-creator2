import type { AISuggestion } from '../types/lp-generator';

/**
 * クライアント側提案適用ユーティリティ
 * ブラウザのDOMParserを使用してAISuggestionを実際のHTMLコンテンツに適用する
 */
export class SuggestionApplierClient {
  
  /**
   * 提案をHTMLコンテンツに適用
   */
  static applySuggestionToContent(
    htmlContent: string,
    cssContent: string,
    suggestion: AISuggestion
  ): { htmlContent: string; cssContent: string } {
    // ブラウザ環境でのみ実行（テスト環境では window が存在する）
    if (typeof window === 'undefined' && typeof global === 'undefined') {
      throw new Error('SuggestionApplierClient can only be used in browser environment');
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    console.log('Parsed document:', doc);
    console.log('Document body:', doc.body);
    console.log('Document querySelector body:', doc.querySelector('body'));
    
    let updatedHtml = htmlContent;
    let updatedCss = cssContent;

    try {
      switch (suggestion.action.type) {
        case 'add':
          ({ htmlContent: updatedHtml, cssContent: updatedCss } = 
            this.handleAddAction(doc, cssContent, suggestion));
          break;
          
        case 'modify':
          ({ htmlContent: updatedHtml, cssContent: updatedCss } = 
            this.handleModifyAction(doc, cssContent, suggestion));
          break;
          
        case 'replace':
          ({ htmlContent: updatedHtml, cssContent: updatedCss } = 
            this.handleReplaceAction(doc, cssContent, suggestion));
          break;
          
        default:
          console.warn(`Unknown action type: ${suggestion.action.type}`);
      }
    } catch (error) {
      console.error('Error applying suggestion:', error);
      throw new Error(`提案の適用に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { htmlContent: updatedHtml, cssContent: updatedCss };
  }

  /**
   * ADD アクションの処理
   */
  private static handleAddAction(
    document: Document,
    cssContent: string,
    suggestion: AISuggestion
  ): { htmlContent: string; cssContent: string } {
    let updatedCss = cssContent;

    console.log('Handling ADD action for target:', suggestion.action.target);

    switch (suggestion.action.target) {
      case 'h1':
        this.addH1Tag(document, suggestion);
        break;
        
      case 'meta':
        this.addMetaTag(document, suggestion);
        break;
        
      case 'section':
        this.addSection(document, suggestion);
        break;
        
      case 'css':
        updatedCss = this.addCSSRules(cssContent, suggestion);
        break;
        
      case 'content':
        this.addContentSection(document, suggestion);
        break;
        
      default:
        console.warn(`Unknown add target: ${suggestion.action.target}`);
    }

    const serialized = this.serializeDocument(document);
    console.log('Serialized document length:', serialized.length);
    console.log('Contains h1:', serialized.includes('<h1'));

    return { 
      htmlContent: serialized,
      cssContent: updatedCss
    };
  }

  /**
   * MODIFY アクションの処理
   */
  private static handleModifyAction(
    document: Document,
    cssContent: string,
    suggestion: AISuggestion
  ): { htmlContent: string; cssContent: string } {
    let updatedCss = cssContent;

    switch (suggestion.action.target) {
      case 'img':
        this.modifyImages(document, suggestion);
        break;
        
      case 'button':
        this.modifyButtons(document, suggestion);
        break;
        
      case 'css':
        updatedCss = this.modifyCSSRules(cssContent, suggestion);
        break;
        
      case 'html':
        this.modifyHTMLStructure(document, suggestion);
        break;
        
      case 'interactive':
        this.modifyInteractiveElements(document, suggestion);
        break;
        
      default:
        console.warn(`Unknown modify target: ${suggestion.action.target}`);
    }

    return { 
      htmlContent: this.serializeDocument(document),
      cssContent: updatedCss
    };
  }

  /**
   * REPLACE アクションの処理
   */
  private static handleReplaceAction(
    document: Document,
    cssContent: string,
    suggestion: AISuggestion
  ): { htmlContent: string; cssContent: string } {
    // Replace logic implementation
    return { 
      htmlContent: this.serializeDocument(document),
      cssContent
    };
  }

  /**
   * ドキュメントをHTMLストリングにシリアライズ
   */
  private static serializeDocument(document: Document): string {
    // documentElement.outerHTMLを使用してシリアライズ
    return document.documentElement.outerHTML;
  }

  /**
   * H1タグを追加
   */
  private static addH1Tag(document: Document, suggestion: AISuggestion): void {
    let body: HTMLElement | null = document.body;
    
    // bodyが見つからない場合、querySelector で探す
    if (!body) {
      body = document.querySelector('body');
    }
    
    if (!body) {
      console.log('No body found in document');
      console.log('Document HTML:', document.documentElement.outerHTML.substring(0, 200));
      return;
    }

    const existingH1 = document.querySelector('h1');
    if (existingH1) {
      console.log('H1 already exists');
      return; // 既にH1がある場合は追加しない
    }

    const h1 = document.createElement('h1');
    h1.textContent = 'メインタイトル';
    h1.className = 'text-3xl font-bold text-gray-900 mb-6';
    
    console.log('Adding H1 tag to body');
    // body の最初の子要素として挿入
    body.insertBefore(h1, body.firstChild);
    console.log('H1 tag added, body children count:', body.children.length);
  }

  /**
   * メタタグを追加
   */
  private static addMetaTag(document: Document, suggestion: AISuggestion): void {
    const head = document.head;
    if (!head) return;

    if (suggestion.action.value === 'description追加') {
      const existingMeta = document.querySelector('meta[name="description"]');
      if (existingMeta) return;

      const meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      meta.setAttribute('content', 'ページの説明を入力してください');
      head.appendChild(meta);
    }
  }

  /**
   * セクションを追加
   */
  private static addSection(document: Document, suggestion: AISuggestion): void {
    const body = document.body;
    if (!body) return;

    let sectionContent = '';
    
    if (suggestion.action.value === 'CTA追加') {
      sectionContent = `
        <section class="py-12 bg-blue-50">
          <div class="max-w-4xl mx-auto text-center px-4">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">今すぐ始めませんか？</h2>
            <p class="text-gray-600 mb-6">簡単な手続きで今すぐご利用いただけます。</p>
            <button class="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-colors">
              今すぐ申し込む
            </button>
          </div>
        </section>
      `;
    } else if (suggestion.action.value === '無料トライアル') {
      sectionContent = `
        <section class="py-12 bg-green-50">
          <div class="max-w-4xl mx-auto text-center px-4">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">無料トライアル開始</h2>
            <p class="text-gray-600 mb-6">14日間無料でお試しいただけます。クレジットカード不要。</p>
            <button class="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-medium transition-colors">
              無料で始める
            </button>
          </div>
        </section>
      `;
    } else if (suggestion.action.value === '導入実績') {
      sectionContent = `
        <section class="py-12 bg-gray-50">
          <div class="max-w-4xl mx-auto px-4">
            <h2 class="text-2xl font-bold text-gray-900 text-center mb-8">お客様の声</h2>
            <div class="grid md:grid-cols-2 gap-6">
              <div class="bg-white p-6 rounded-lg shadow">
                <p class="text-gray-600 mb-4">"導入後、効率が大幅に向上しました。"</p>
                <div class="text-sm text-gray-500">— 株式会社サンプル 代表取締役</div>
              </div>
              <div class="bg-white p-6 rounded-lg shadow">
                <p class="text-gray-600 mb-4">"使いやすく、コストパフォーマンスが優秀です。"</p>
                <div class="text-sm text-gray-500">— 有限会社例示 営業部長</div>
              </div>
            </div>
          </div>
        </section>
      `;
    }

    if (sectionContent) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = sectionContent;
      const section = tempDiv.firstElementChild;
      if (section) {
        body.appendChild(section);
      }
    }
  }

  /**
   * CSSルールを追加
   */
  private static addCSSRules(cssContent: string, suggestion: AISuggestion): string {
    let additionalCSS = '';

    if (suggestion.action.value === 'シャドウ効果追加') {
      additionalCSS = `
/* AI提案: シャドウ効果の追加 */
.card, .btn, button {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;
}

.card:hover, .btn:hover, button:hover {
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
}
      `;
    } else if (suggestion.action.value === 'メディアクエリ追加') {
      additionalCSS = `
/* AI提案: レスポンシブデザインの追加 */
@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
  
  h1 {
    font-size: 1.5rem;
  }
  
  .grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .text-lg {
    font-size: 1rem;
  }
  
  .px-8 {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
      `;
    }

    return cssContent + additionalCSS;
  }

  /**
   * コンテンツセクションを追加
   */
  private static addContentSection(document: Document, suggestion: AISuggestion): void {
    const body = document.body;
    if (!body) return;

    if (suggestion.action.value === '詳細説明を追加') {
      const contentSection = document.createElement('section');
      contentSection.className = 'py-8 px-4';
      contentSection.innerHTML = `
        <div class="max-w-4xl mx-auto">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">詳細について</h2>
          <p class="text-gray-600 leading-relaxed mb-4">
            こちらでは、サービスや製品の詳細な説明を記載します。
            お客様が知りたい情報を分かりやすくお伝えします。
          </p>
          <p class="text-gray-600 leading-relaxed">
            特徴や利点、使用方法など、具体的な情報を追加することで、
            ユーザーの理解を深め、信頼性を向上させることができます。
          </p>
        </div>
      `;
      
      body.appendChild(contentSection);
    }
  }

  /**
   * 画像を修正（alt属性追加）
   */
  private static modifyImages(document: Document, suggestion: AISuggestion): void {
    const images = document.querySelectorAll('img');
    
    images.forEach((img, index) => {
      if (!img.getAttribute('alt')) {
        img.setAttribute('alt', `画像${index + 1}の説明`);
      }
    });
  }

  /**
   * ボタンを修正（CTAテキスト強化）
   */
  private static modifyButtons(document: Document, suggestion: AISuggestion): void {
    const buttons = document.querySelectorAll('button, .button, .btn');
    
    buttons.forEach(button => {
      const currentText = button.textContent || '';
      if (!currentText.includes('今すぐ') && !currentText.includes('無料')) {
        if (currentText.includes('申し込み')) {
          button.textContent = '今すぐ申し込む';
        } else if (currentText.includes('開始') || currentText.includes('始める')) {
          button.textContent = '今すぐ始める';
        } else if (currentText.includes('登録')) {
          button.textContent = '無料で登録';
        }
      }
    });
  }

  /**
   * CSSルールを修正
   */
  private static modifyCSSRules(cssContent: string, suggestion: AISuggestion): string {
    // 既存のCSSを強化
    return cssContent;
  }

  /**
   * HTML構造を修正（セマンティック要素）
   */
  private static modifyHTMLStructure(document: Document, suggestion: AISuggestion): void {
    if (suggestion.action.value === 'セマンティック要素追加') {
      const body = document.body;
      if (!body) return;

      // div要素をsection要素に変換
      const divs = document.querySelectorAll('div.section, div[class*="section"]');
      divs.forEach(div => {
        const section = document.createElement('section');
        section.className = div.className;
        section.innerHTML = div.innerHTML;
        div.parentNode?.replaceChild(section, div);
      });

      // メインコンテンツエリアをmain要素でラップ
      const mainContent = document.querySelector('.main-content, .content, main');
      if (!mainContent && body.children.length > 0) {
        const main = document.createElement('main');
        const firstChild = body.firstElementChild;
        if (firstChild) {
          main.appendChild(firstChild);
          body.insertBefore(main, body.firstChild);
        }
      }
    }
  }

  /**
   * インタラクティブ要素を修正（ARIA属性追加）
   */
  private static modifyInteractiveElements(document: Document, suggestion: AISuggestion): void {
    const interactiveElements = document.querySelectorAll('button, input, select, textarea');
    
    interactiveElements.forEach((element, index) => {
      if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
        const tagName = element.tagName.toLowerCase();
        element.setAttribute('aria-label', `${tagName}要素${index + 1}`);
      }
    });
  }
}