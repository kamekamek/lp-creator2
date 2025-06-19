const puppeteer = require('puppeteer');

async function testStructuredWorkflow() {
  console.log('🧪 構造化ワークフローテスト開始...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // 1. トップページにアクセス
    console.log('1️⃣ トップページアクセス...');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle0' });
    console.log('✅ ページ読み込み完了\n');
    
    // 2. 構造化ワークフロータブが選択されているか確認
    console.log('2️⃣ 構造化ワークフロータブの確認...');
    const activeTab = await page.$eval('button[class*="bg-background"]', el => el.textContent);
    console.log(`✅ アクティブタブ: ${activeTab}\n`);
    
    // 3. 初期画面の要素確認
    console.log('3️⃣ 初期画面要素の確認...');
    const title = await page.$eval('h2', el => el.textContent).catch(() => '要素が見つかりません');
    console.log(`  - タイトル: ${title}`);
    
    const cards = await page.$$eval('.grid > div', cards => 
      cards.map(card => ({
        title: card.querySelector('h3')?.textContent || '',
        description: card.querySelector('p')?.textContent || ''
      }))
    ).catch(() => []);
    console.log('  - カード情報:');
    cards.forEach(card => {
      console.log(`    • ${card.title}: ${card.description.substring(0, 50)}...`);
    });
    
    // 4. ヒアリング開始ボタンクリック
    console.log('\n4️⃣ ヒアリング開始ボタンをクリック...');
    const startButton = await page.$('button').then(button => {
      return page.evaluate(el => el.textContent?.includes('ヒアリングを開始') ? el : null, button);
    }).catch(() => null);
    
    if (startButton) {
      await page.click('button:has-text("ヒアリングを開始")').catch(async () => {
        // フォールバック: テキストでボタンを探す
        const buttons = await page.$$('button');
        for (let button of buttons) {
          const text = await page.evaluate(el => el.textContent, button);
          if (text?.includes('ヒアリングを開始')) {
            await button.click();
            break;
          }
        }
      });
      console.log('✅ ボタンクリック成功');
      
      // 5. ヒアリングインターフェースの読み込み待機
      console.log('\n5️⃣ ヒアリングインターフェース読み込み待機...');
      await page.waitForTimeout(3000); // API呼び出しの待機
      
      // 6. ヒアリング画面の要素確認
      const hearingTitle = await page.$eval('h1', el => el.textContent).catch(() => '不明');
      console.log(`✅ ヒアリング画面タイトル: ${hearingTitle}`);
      
      // 会話エリアの確認
      const conversationArea = await page.$('.max-w-4xl');
      if (conversationArea) {
        console.log('✅ 会話エリアが表示されています');
      }
      
      // 進捗表示の確認
      const progressExists = await page.$('.space-y-4').catch(() => null);
      if (progressExists) {
        console.log('✅ 進捗表示エリアが存在します');
      }
    } else {
      console.log('⚠️  ヒアリング開始ボタンが見つかりません');
      
      // デバッグ情報: 存在するボタンを表示
      const buttons = await page.$$eval('button', buttons => 
        buttons.map(btn => btn.textContent?.trim()).filter(text => text)
      );
      console.log('📋 ページ上のボタン:', buttons);
    }
    
    // 7. スクリーンショット保存
    console.log('\n7️⃣ スクリーンショット保存...');
    await page.screenshot({ 
      path: 'test-screenshot-structured-workflow.png',
      fullPage: true 
    });
    console.log('✅ スクリーンショット保存完了: test-screenshot-structured-workflow.png');
    
    // 8. パフォーマンス測定
    console.log('\n8️⃣ パフォーマンス測定...');
    const metrics = await page.metrics();
    console.log(`  - DOM要素数: ${metrics.Nodes}`);
    console.log(`  - JSヒープサイズ: ${(metrics.JSHeapUsedSize / 1048576).toFixed(2)} MB`);
    console.log(`  - レイアウト時間: ${metrics.LayoutDuration?.toFixed(2) || 'N/A'} ms`);
    
  } catch (error) {
    console.error('❌ エラー発生:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ テスト完了');
  }
}

// テスト実行
testStructuredWorkflow().catch(console.error);