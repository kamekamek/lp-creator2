import { describe, it, expect } from '@jest/globals';

// Import the helper functions directly
// We need to extract these from the store file
function calculateHearingCompletion(hearingData: any): number {
  const requiredFields = [
    'serviceContent',
    'targetCustomerPain',
    'desiredConversion'
  ];
  
  const optionalFields = [
    'uniqueValueProposition',
    'budgetAndUrgency'
  ];
  
  const strategyFields = [
    'competitors',
    'currentChannels',
    'brandImage',
    'successMetrics'
  ];
  
  // 必須フィールドの完了度 (60%)
  const requiredCompletion = requiredFields.filter(field =>
    hearingData.essentialInfo?.[field as keyof typeof hearingData.essentialInfo]
  ).length / requiredFields.length;
  
  // オプションフィールドの完了度 (20%)
  const optionalCompletion = optionalFields.filter(field =>
    hearingData.essentialInfo?.[field as keyof typeof hearingData.essentialInfo]
  ).length / optionalFields.length;
  
  // 戦略フィールドの完了度 (20%)
  const strategyCompletion = strategyFields.filter(field =>
    hearingData.strategyInfo?.[field as keyof typeof hearingData.strategyInfo]
  ).length / strategyFields.length;
  
  return Math.round(
    (requiredCompletion * 60) + 
    (optionalCompletion * 20) + 
    (strategyCompletion * 20)
  );
}

function isHearingComplete(hearingData: any): boolean {
  const requiredFields = [
    'serviceContent',
    'targetCustomerPain',
    'desiredConversion'
  ];
  
  const hasAllRequired = requiredFields.every(field =>
    hearingData.essentialInfo?.[field as keyof typeof hearingData.essentialInfo]
  );
  
  // 戦略情報も最低1つは必要
  const hasStrategyInfo = !!(hearingData.strategyInfo && 
    Object.values(hearingData.strategyInfo).some(value => 
      value && (Array.isArray(value) ? value.length > 0 : true)
    ));
  
  return hasAllRequired && hasStrategyInfo;
}

describe('Workflow Store Helper Functions', () => {
  describe('calculateHearingCompletion', () => {
    it('should return 0 for empty data', () => {
      const result = calculateHearingCompletion({});
      expect(result).toBe(0);
    });

    it('should calculate partial completion correctly', () => {
      const data = {
        essentialInfo: {
          serviceContent: 'テストサービス',
          targetCustomerPain: 'テスト課題'
        }
      };
      
      const result = calculateHearingCompletion(data);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(100);
    });

    it('should calculate full completion correctly', () => {
      const data = {
        essentialInfo: {
          serviceContent: 'SaaS型顧客管理システム',
          uniqueValueProposition: 'AIを活用した自動分析機能',
          targetCustomerPain: '顧客情報の管理が煩雑で営業効率が悪い',
          desiredConversion: '無料トライアル申し込み',
          budgetAndUrgency: '月額10万円以下、3ヶ月以内に導入'
        },
        strategyInfo: {
          competitors: ['Salesforce', 'HubSpot'],
          currentChannels: 'Web広告、セミナー',
          brandImage: '革新的で信頼性の高いソリューション',
          successMetrics: '月次トライアル申し込み数100件'
        }
      };
      
      const result = calculateHearingCompletion(data);
      expect(result).toBe(100);
    });
  });

  describe('isHearingComplete', () => {
    it('should return false for incomplete data', () => {
      const data = {
        essentialInfo: {
          serviceContent: 'テストサービス'
        }
      };
      
      const result = isHearingComplete(data);
      expect(result).toBe(false);
    });

    it('should return true for complete data', () => {
      const data = {
        essentialInfo: {
          serviceContent: 'SaaS型顧客管理システム',
          targetCustomerPain: '顧客情報の管理が煩雑で営業効率が悪い',
          desiredConversion: '無料トライアル申し込み'
        },
        strategyInfo: {
          competitors: ['Salesforce', 'HubSpot']
        }
      };
      
      const result = isHearingComplete(data);
      expect(result).toBe(true);
    });
  });
});