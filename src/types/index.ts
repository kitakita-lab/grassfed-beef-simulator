export type SalesChannel = '直販' | '卸' | 'ふるさと納税' | 'イベント販売';
export type PriceStrategy = '控えめ' | '標準' | '高付加価値';
export type RoundingMode =
  | '1円単位'
  | '10円単位'
  | '100円単位'
  | '100g単価心理価格'
  | '1kg単価心理価格';

export interface FormData {
  // A. 基本情報
  numberOfHeads: number;
  annualShipmentHeads: number;
  meatWeightPerHead: number;
  salesChannel: SalesChannel;

  // B. 飼養コスト
  feedCost: number;
  grassCost: number;
  vetCost: number;
  managementCost: number;
  laborCost: number;
  otherRaisingCost: number;

  // C. 認証・ブランド維持コスト（年間）
  organicCertCost: number;
  grassfedCertCost: number;
  environmentCost: number;
  brandOperationCost: number;
  otherCertCost: number;

  // D. 加工・販売コスト
  processingCost: number;
  packagingCost: number;
  storageCost: number;
  shippingCost: number;
  salesFeeRate: number;   // ％入力（例: 10 → 10%）
  paymentFeeRate: number; // ％入力（例: 3.6 → 3.6%）
  otherSalesCost: number;

  // E. 利益設定
  minimumProfitPerHead: number;
  idealProfitRate: number; // ％入力（例: 20 → 20%）
  annualTargetProfit: number;

  // F. ブランド設定
  priceStrategy: PriceStrategy;

  // G. 丸め設定
  roundingMode: RoundingMode;
}

export interface CalculationResult {
  raisingCost: number;
  annualBrandCost: number;
  brandCostPerHead: number;
  processingCostTotal: number;
  baseCost: number;
  feeRate: number;

  minimumHeadPrice: number;
  recommendedHeadPrice: number;
  brandHeadPrice: number;

  minimumPricePerKg: number;
  recommendedPricePerKg: number;
  brandPricePerKg: number;

  minimumPricePer100g: number;
  recommendedPricePer100g: number;
  brandPricePer100g: number;

  minimumProfit: number;
  recommendedProfit: number;
  brandProfit: number;

  minimumProfitRate: number;
  recommendedProfitRate: number;
  brandProfitRate: number;

  minimumAnnualRevenue: number;
  recommendedAnnualRevenue: number;
  brandAnnualRevenue: number;

  minimumAnnualProfit: number;
  recommendedAnnualProfit: number;
  brandAnnualProfit: number;

  breakEvenPricePerKg: number;
}

export interface ValidationWarning {
  type: 'error' | 'warning';
  message: string;
}
