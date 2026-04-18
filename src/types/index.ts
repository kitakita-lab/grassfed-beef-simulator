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

  // H. 卸掛け率（全チャネル価格の起点）
  wholesaleRate: number; // 卸先掛け率（%）例: 70 → 70%
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

// 卸価格（calculate()出力）を起点に全チャネル価格を保持
// 小売 = 卸 ÷ 掛け率 / 直販 = 小売×0.90 / イベント = 小売×0.92→心理価格 / ふるさと = 小売×1.20
export interface ChannelPrices {
  wholesaleRateDecimal: number;

  // 小売参考価格 /kg
  retailMinPerKg: number;
  retailRecPerKg: number;
  retailBrandPerKg: number;

  // 直販 /kg, /100g
  directMinPerKg: number;
  directRecPerKg: number;
  directBrandPerKg: number;
  directMinPer100g: number;
  directRecPer100g: number;
  directBrandPer100g: number;

  // イベント /100g（心理価格）, /kg, パック
  eventMinPer100g: number;
  eventRecPer100g: number;
  eventBrandPer100g: number;
  eventMinPerKg: number;
  eventRecPerKg: number;
  eventBrandPerKg: number;
  eventMin300g: number;
  eventRec300g: number;
  eventBrand300g: number;
  eventMin500g: number;
  eventRec500g: number;
  eventBrand500g: number;
  eventMin1kg: number;
  eventRec1kg: number;
  eventBrand1kg: number;

  // ふるさと納税 /kg, パック（1,000円単位切上）
  furusatoMinPerKg: number;
  furusatoRecPerKg: number;
  furusatoBrandPerKg: number;
  furusatoMin500g: number;
  furusatoRec500g: number;
  furusatoBrand500g: number;
  furusatoMin1kg: number;
  furusatoRec1kg: number;
  furusatoBrand1kg: number;
  furusatoBelowCostWarning: boolean; // 推奨価格が原価を下回る場合 true
}

export interface ValidationWarning {
  type: 'error' | 'warning';
  message: string;
}
