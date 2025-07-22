// Simple test to debug workflow store
const { useWorkflowStore } = require('./src/stores/workflowStore');

// Mock data
const mockHearingData = {
  essentialInfo: {
    serviceContent: 'テストサービス',
    targetCustomerPain: 'テスト課題',
    desiredConversion: 'テストコンバージョン'
  }
};

console.log('Testing workflow store...');

// This won't work in Node.js environment because it's a React hook
// Let's create a simple unit test instead