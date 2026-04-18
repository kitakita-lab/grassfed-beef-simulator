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

  // D. 加工・販売コスト（直販基準）
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

  // I. ふるさと納税設定
  furusatoReturnRate: number;      // 目標還元率（%入力, 例: 30）
  furusatoPortalFeeRate: number;   // ポータル手数料率（%入力, 例: 15）
  furusatoPaymentFeeRate: number;  // 決済手数料率（%入力, 例: 3）
  furusatoOtherRateFee: number;    // その他率費（%入力）
  furusatoPackagingCost: number;   // 包装・ギフトBOX代（円/頭）
  furusatoStorageCost: number;     // 保管・冷凍費（円/頭）
  furusatoShippingCost: number;    // 発送費（円/頭）
  furusatoFulfillmentCost: number; // 梱包代行費（円/頭）
  furusatoOtherFixedCost: number;  // その他固定費（円/頭）
}

export type RetailPriceLevel = 'low' | 'normal' | 'premium' | 'ultra';

export interface WholesaleResult {
  wholesaleRateDecimal: number;
  retailerGrossMarginDecimal: number;
  // 卸価格 = 直販基準価格 × 掛け率
  minimumWholesalePricePerKg: number;
  recommendedWholesalePricePerKg: number;
  brandWholesalePricePerKg: number;
  minimumWholesalePricePer100g: number;
  recommendedWholesalePricePer100g: number;
  brandWholesalePricePer100g: number;
  minimumWholesaleHeadPrice: number;
  recommendedWholesaleHeadPrice: number;
  brandWholesaleHeadPrice: number;
  minimumWholesaleProfit: number;
  recommendedWholesaleProfit: number;
  brandWholesaleProfit: number;
  minimumWholesaleProfitRate: number;
  recommendedWholesaleProfitRate: number;
  brandWholesaleProfitRate: number;
  minimumWholesaleAnnualRevenue: number;
  recommendedWholesaleAnnualRevenue: number;
  brandWholesaleAnnualRevenue: number;
  minimumWholesaleAnnualProfit: number;
  recommendedWholesaleAnnualProfit: number;
  brandWholesaleAnnualProfit: number;
  directPriceLevel: RetailPriceLevel;
  directPriceComment: string;
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
  rateFeeTotal: number;        // 率費合計（小数）= portal + payment + other
  fixedCostPerHead: number;    // 固定費合計（円/頭）
  activeConstraint: 'returnRate' | 'costCoverage';
  minimum300g: number;
  recommended300g: number;
  brand300g: number;
  minimum500g: number;
  recommended500g: number;
  brand500g: number;
  minimum1kg: number;
  recommended1kg: number;
  brand1kg: number;
  minimumDonationPerHead: number;
  recommendedDonationPerHead: number;
  brandDonationPerHead: number;
  minimumAnnualRevenue: number;
  recommendedAnnualRevenue: number;
  brandAnnualRevenue: number;
}

export interface ValidationWarning {
  type: 'error' | 'warning';
  message: string;
}
