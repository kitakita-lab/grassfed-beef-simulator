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

  // H. 卸チャネル設定
  wholesaleRate: number; // 卸先掛け率（%）例: 70 → 70%

  // I. 直販・イベント設定
  directCoefficient: number; // 直販・イベント係数（%入力, 例: 90 → 想定小売の90%）

  // J. ふるさと納税設定
  furusatoPlatformFeeRate: number; // プラットフォーム手数料率（%入力, 例: 25）
  furusatoReturnRate: number;      // 目標還元率（%入力, 例: 30、法定上限50%）
}

export type RetailPriceLevel = 'low' | 'normal' | 'premium' | 'ultra';

export interface WholesaleResult {
  wholesaleRateDecimal: number;
  retailerGrossMarginDecimal: number;
  minimumRetailPricePerKg: number;
  recommendedRetailPricePerKg: number;
  brandRetailPricePerKg: number;
  minimumRetailPricePer100g: number;
  recommendedRetailPricePer100g: number;
  brandRetailPricePer100g: number;
  retailPriceLevel: RetailPriceLevel;
  retailPriceComment: string;
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

export interface DirectResult {
  coefficient: number;                   // 直販係数（小数, e.g. 0.90）
  wholesaleRetailRefPerKg: number;       // 卸想定小売参考価格/kg（basis表示用）
  minimumPricePerKg: number;
  recommendedPricePerKg: number;
  brandPricePerKg: number;
  minimumPricePer100g: number;
  recommendedPricePer100g: number;
  brandPricePer100g: number;
  minimumHeadPrice: number;
  recommendedHeadPrice: number;
  brandHeadPrice: number;
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
  wholesaleRecommendedProfit: number;    // 卸推奨利益（比較用）
}

export interface EventResult {
  minimumPricePer100g: number;
  recommendedPricePer100g: number;
  brandPricePer100g: number;
  minimumPricePerKg: number;
  recommendedPricePerKg: number;
  brandPricePerKg: number;
  minimum300g: number;
  recommended300g: number;
  brand300g: number;
  minimum500g: number;
  recommended500g: number;
  brand500g: number;
  minimum1kg: number;
  recommended1kg: number;
  brand1kg: number;
  minimumProfit: number;
  recommendedProfit: number;
  brandProfit: number;
  minimumProfitRate: number;
  recommendedProfitRate: number;
  brandProfitRate: number;
}

export interface FurusatoResult {
  returnRateDecimal: number;
  platformFeeDecimal: number;
  activeConstraint: 'returnRate' | 'platformFee';
  minimumDonationPerHead: number;
  recommendedDonationPerHead: number;
  brandDonationPerHead: number;
  minimum300g: number;
  recommended300g: number;
  brand300g: number;
  minimum500g: number;
  recommended500g: number;
  brand500g: number;
  minimum1kg: number;
  recommended1kg: number;
  brand1kg: number;
  minimumAnnualRevenue: number;
  recommendedAnnualRevenue: number;
  brandAnnualRevenue: number;
}

export interface ValidationWarning {
  type: 'error' | 'warning';
  message: string;
}
