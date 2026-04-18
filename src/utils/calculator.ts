import type {
  FormData,
  CalculationResult,
  RoundingMode,
  PriceStrategy,
  ValidationWarning,
  WholesaleResult,
  RetailPriceLevel,
  EventResult,
  FurusatoResult,
} from '../types';

const PSYCHOLOGY_PRICES_100G = [398, 480, 580, 680, 780, 880, 980, 1180, 1280, 1480];
const PSYCHOLOGY_PRICES_1KG = [3980, 4800, 5800, 6800, 7800, 8800, 9800, 11800, 12800, 14800];

const STRATEGY_MULTIPLIERS: Record<PriceStrategy, number> = {
  '控えめ': 1.05,
  '標準': 1.15,
  '高付加価値': 1.30,
};

function roundPrice(price: number, mode: RoundingMode): number {
  switch (mode) {
    case '1円単位':
      return Math.ceil(price);
    case '10円単位':
      return Math.ceil(price / 10) * 10;
    case '100円単位':
    default:
      return Math.ceil(price / 100) * 100;
  }
}

function nearestPsychologyPrice(price: number, candidates: number[]): number {
  const valid = candidates.filter((p) => p >= price);
  if (valid.length === 0) return Math.ceil(price / 100) * 100;
  return Math.min(...valid);
}

// calculate() の出力は「直販基準価格」。全チャネルの価格はここから派生する。
export function calculate(data: FormData): CalculationResult | null {
  if (data.annualShipmentHeads <= 0 || data.meatWeightPerHead <= 0) return null;

  // 2-1 飼養コスト
  const raisingCost =
    data.feedCost +
    data.grassCost +
    data.vetCost +
    data.managementCost +
    data.laborCost +
    data.otherRaisingCost;

  // 2-2 年間認証・ブランド維持コスト
  const annualBrandCost =
    data.organicCertCost +
    data.grassfedCertCost +
    data.environmentCost +
    data.brandOperationCost +
    data.otherCertCost;

  // 2-3 1頭あたり認証コスト
  const brandCostPerHead = annualBrandCost / data.annualShipmentHeads;

  // 2-4 加工・販売固定コスト
  const processingCostTotal =
    data.processingCost +
    data.packagingCost +
    data.storageCost +
    data.shippingCost +
    data.otherSalesCost;

  // 2-5 1頭あたり総原価
  const baseCost = raisingCost + brandCostPerHead + processingCostTotal;

  // 2-6 手数料率（%入力 → 小数）
  const feeRate = (data.salesFeeRate + data.paymentFeeRate) / 100;

  // 2-7 最低売上額
  const minimumRevenueNeeded = baseCost + data.minimumProfitPerHead;

  // 2-8 最低販売価格（手数料除算不能チェック）
  if (1 - feeRate <= 0) return null;
  const minimumHeadPriceRaw = minimumRevenueNeeded / (1 - feeRate);

  // 2-9 推奨販売価格
  const idealProfitRateDecimal = data.idealProfitRate / 100;
  const denominator = 1 - feeRate - idealProfitRateDecimal;
  const candidateHeadPrice = denominator > 0 ? baseCost / denominator : minimumHeadPriceRaw * 1.5;
  const recommendedHeadPriceRaw = Math.max(candidateHeadPrice, minimumHeadPriceRaw * 1.1);

  // 2-10 ブランド販売価格
  const strategyMultiplier = STRATEGY_MULTIPLIERS[data.priceStrategy];
  const brandHeadPriceRaw = recommendedHeadPriceRaw * strategyMultiplier;

  // 2-11 → 2-12 単価計算 + 丸め
  let minimumPricePerKg = minimumHeadPriceRaw / data.meatWeightPerHead;
  let recommendedPricePerKg = recommendedHeadPriceRaw / data.meatWeightPerHead;
  let brandPricePerKg = brandHeadPriceRaw / data.meatWeightPerHead;

  let minimumPricePer100g: number;
  let recommendedPricePer100g: number;
  let brandPricePer100g: number;

  if (data.roundingMode === '100g単価心理価格') {
    minimumPricePer100g = nearestPsychologyPrice(minimumPricePerKg / 10, PSYCHOLOGY_PRICES_100G);
    recommendedPricePer100g = nearestPsychologyPrice(recommendedPricePerKg / 10, PSYCHOLOGY_PRICES_100G);
    brandPricePer100g = nearestPsychologyPrice(brandPricePerKg / 10, PSYCHOLOGY_PRICES_100G);
    minimumPricePerKg = minimumPricePer100g * 10;
    recommendedPricePerKg = recommendedPricePer100g * 10;
    brandPricePerKg = brandPricePer100g * 10;
  } else if (data.roundingMode === '1kg単価心理価格') {
    minimumPricePerKg = nearestPsychologyPrice(minimumPricePerKg, PSYCHOLOGY_PRICES_1KG);
    recommendedPricePerKg = nearestPsychologyPrice(recommendedPricePerKg, PSYCHOLOGY_PRICES_1KG);
    brandPricePerKg = nearestPsychologyPrice(brandPricePerKg, PSYCHOLOGY_PRICES_1KG);
    minimumPricePer100g = minimumPricePerKg / 10;
    recommendedPricePer100g = recommendedPricePerKg / 10;
    brandPricePer100g = brandPricePerKg / 10;
  } else {
    minimumPricePerKg = roundPrice(minimumPricePerKg, data.roundingMode);
    recommendedPricePerKg = roundPrice(recommendedPricePerKg, data.roundingMode);
    brandPricePerKg = roundPrice(brandPricePerKg, data.roundingMode);
    minimumPricePer100g = minimumPricePerKg / 10;
    recommendedPricePer100g = recommendedPricePerKg / 10;
    brandPricePer100g = brandPricePerKg / 10;
  }

  // 1頭売上（丸め後のkg単価から逆算）
  const minimumHeadPrice = minimumPricePerKg * data.meatWeightPerHead;
  const recommendedHeadPrice = recommendedPricePerKg * data.meatWeightPerHead;
  const brandHeadPrice = brandPricePerKg * data.meatWeightPerHead;

  // 2-13 利益額
  const minimumProfit = minimumHeadPrice * (1 - feeRate) - baseCost;
  const recommendedProfit = recommendedHeadPrice * (1 - feeRate) - baseCost;
  const brandProfit = brandHeadPrice * (1 - feeRate) - baseCost;

  // 2-14 利益率
  const minimumProfitRate = minimumHeadPrice > 0 ? minimumProfit / minimumHeadPrice : 0;
  const recommendedProfitRate = recommendedHeadPrice > 0 ? recommendedProfit / recommendedHeadPrice : 0;
  const brandProfitRate = brandHeadPrice > 0 ? brandProfit / brandHeadPrice : 0;

  // 2-15 年間想定
  const minimumAnnualRevenue = minimumHeadPrice * data.annualShipmentHeads;
  const recommendedAnnualRevenue = recommendedHeadPrice * data.annualShipmentHeads;
  const brandAnnualRevenue = brandHeadPrice * data.annualShipmentHeads;

  const minimumAnnualProfit = minimumProfit * data.annualShipmentHeads;
  const recommendedAnnualProfit = recommendedProfit * data.annualShipmentHeads;
  const brandAnnualProfit = brandProfit * data.annualShipmentHeads;

  // 損益分岐単価（利益ゼロの1kg単価）
  const breakEvenPricePerKg =
    baseCost / (data.meatWeightPerHead * (1 - feeRate));

  return {
    raisingCost,
    annualBrandCost,
    brandCostPerHead,
    processingCostTotal,
    baseCost,
    feeRate,
    minimumHeadPrice,
    recommendedHeadPrice,
    brandHeadPrice,
    minimumPricePerKg,
    recommendedPricePerKg,
    brandPricePerKg,
    minimumPricePer100g,
    recommendedPricePer100g,
    brandPricePer100g,
    minimumProfit,
    recommendedProfit,
    brandProfit,
    minimumProfitRate,
    recommendedProfitRate,
    brandProfitRate,
    minimumAnnualRevenue,
    recommendedAnnualRevenue,
    brandAnnualRevenue,
    minimumAnnualProfit,
    recommendedAnnualProfit,
    brandAnnualProfit,
    breakEvenPricePerKg,
  };
}

export function validate(data: FormData): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  if (data.annualShipmentHeads <= 0) {
    warnings.push({ type: 'error', message: '年間出荷予定頭数が 0 以下です。計算できません。' });
  }
  if (data.meatWeightPerHead <= 0) {
    warnings.push({ type: 'error', message: '可食販売量が 0 以下です。計算できません。' });
  }

  const feeRate = (data.salesFeeRate + data.paymentFeeRate) / 100;
  if (feeRate >= 1) {
    warnings.push({ type: 'error', message: '手数料率の合計が100%以上です。価格計算ができません。' });
  } else if (feeRate > 0.5) {
    warnings.push({ type: 'warning', message: '手数料率の合計が50%を超えています。設定を確認してください。' });
  }

  const idealProfitRateDecimal = data.idealProfitRate / 100;
  if (idealProfitRateDecimal + feeRate >= 1) {
    warnings.push({ type: 'warning', message: '理想利益率と手数料の合計が100%以上です。推奨価格が正常に計算されない可能性があります。' });
  }
  if (data.idealProfitRate > 60) {
    warnings.push({ type: 'warning', message: '理想利益率が60%を超えています。市場環境によっては販売が難しい可能性があります。' });
  }

  const fields = [
    data.feedCost, data.grassCost, data.vetCost, data.managementCost,
    data.laborCost, data.otherRaisingCost, data.organicCertCost,
    data.grassfedCertCost, data.environmentCost, data.brandOperationCost,
    data.otherCertCost, data.processingCost, data.packagingCost,
    data.storageCost, data.shippingCost, data.otherSalesCost,
    data.minimumProfitPerHead,
  ];
  if (fields.some((v) => v < 0)) {
    warnings.push({ type: 'error', message: 'マイナスのコスト値が入力されています。正しい値を入力してください。' });
  }

  return warnings;
}

export function getChannelHints(channel: string): string[] {
  switch (channel) {
    case '直販':
      return [
        '直販は手数料が低く、ブランド訴求がしやすいチャネルです。',
        '顧客との信頼関係を築くことで、単価維持がしやすくなります。',
        'SNSやウェブサイトでの情報発信と組み合わせると効果的です。',
      ];
    case '卸':
      return [
        '卸は単価が下がりやすく、数量を前提とした交渉になりがちです。',
        '利益が圧迫されやすいため、卸価格の下限をあらかじめ決めておくことが重要です。',
        '少頭数育成では、卸への依存度を下げることも検討してください。',
      ];
    case 'ふるさと納税':
      return [
        'ふるさと納税は付加価値を乗せやすく、認証価値を返礼品に反映しやすいチャネルです。',
        '返礼品の設計（セット内容・重量・ストーリー）で差別化できます。',
        'ポータル手数料・発送費・ギフト包装費を含めた費用回収設計が重要です。',
      ];
    case 'イベント販売':
      return [
        'イベント販売は小ロット対応が可能で、顔の見える販売ができます。',
        '送料が不要なケースが多く、その分を利益に還元できます。',
        '試食や対面説明でブランドストーリーを伝えやすいチャネルです。',
      ];
    default:
      return [];
  }
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('ja-JP', { maximumFractionDigits: 0 }) + '円';
}

export function formatPercent(value: number): string {
  return (value * 100).toFixed(1) + '%';
}

function roundWholesale(price: number): number {
  return Math.round(price / 10) * 10;
}

function getDirectPriceLevel(pricePerKg: number): RetailPriceLevel {
  if (pricePerKg < 5000) return 'low';
  if (pricePerKg < 8000) return 'normal';
  if (pricePerKg < 12000) return 'premium';
  return 'ultra';
}

function getDirectPriceComment(level: RetailPriceLevel, pricePerKg: number): string {
  const priceLabel = formatCurrency(Math.round(pricePerKg / 100) * 100);
  switch (level) {
    case 'low':
      return `直販基準価格（${priceLabel}/kg）は一般スーパーの国産牛肉と競合する水準です。有機・グラスフェッドとしての付加価値訴求が重要になります。`;
    case 'normal':
      return `直販基準価格（${priceLabel}/kg）は有機・グラスフェッドビーフとして妥当な価格帯です。自然食品店・専門店での展開に適しています。`;
    case 'premium':
      return `直販基準価格（${priceLabel}/kg）は高品質ブランド牛として訴求できる価格帯です。百貨店・高級食品店向けの展開が適しています。`;
    case 'ultra':
      return `直販基準価格（${priceLabel}/kg）はプレミアム価格帯です。希少性とブランドストーリーが価格を支える必要があります。`;
  }
}

// ─── 卸チャネル価格計算 ───────────────────────────────────────────────────────
// 卸価格 = 直販基準価格（calculate()出力）× 卸先掛け率
export function calculateWholesale(
  result: CalculationResult,
  wholesaleRate: number,
  meatWeightPerHead: number,
  annualShipmentHeads: number,
): WholesaleResult {
  const wholesaleRateDecimal = wholesaleRate / 100;
  const retailerGrossMarginDecimal = 1 - wholesaleRateDecimal;

  // 卸価格 = 直販基準価格 × 掛け率
  const minWsPerKg = roundWholesale(result.minimumPricePerKg * wholesaleRateDecimal);
  const recWsPerKg = roundWholesale(result.recommendedPricePerKg * wholesaleRateDecimal);
  const brandWsPerKg = roundWholesale(result.brandPricePerKg * wholesaleRateDecimal);

  const minWsPer100g = Math.round(minWsPerKg / 10);
  const recWsPer100g = Math.round(recWsPerKg / 10);
  const brandWsPer100g = Math.round(brandWsPerKg / 10);

  const minWsHead = minWsPerKg * meatWeightPerHead;
  const recWsHead = recWsPerKg * meatWeightPerHead;
  const brandWsHead = brandWsPerKg * meatWeightPerHead;

  // 卸利益: 卸価格売上 - 原価（EC手数料なし）
  const minWsProfit = minWsHead - result.baseCost;
  const recWsProfit = recWsHead - result.baseCost;
  const brandWsProfit = brandWsHead - result.baseCost;

  const minWsProfitRate = minWsHead > 0 ? minWsProfit / minWsHead : 0;
  const recWsProfitRate = recWsHead > 0 ? recWsProfit / recWsHead : 0;
  const brandWsProfitRate = brandWsHead > 0 ? brandWsProfit / brandWsHead : 0;

  const directPriceLevel = getDirectPriceLevel(result.recommendedPricePerKg);
  const directPriceComment = getDirectPriceComment(directPriceLevel, result.recommendedPricePerKg);

  return {
    wholesaleRateDecimal,
    retailerGrossMarginDecimal,
    minimumWholesalePricePerKg: minWsPerKg,
    recommendedWholesalePricePerKg: recWsPerKg,
    brandWholesalePricePerKg: brandWsPerKg,
    minimumWholesalePricePer100g: minWsPer100g,
    recommendedWholesalePricePer100g: recWsPer100g,
    brandWholesalePricePer100g: brandWsPer100g,
    minimumWholesaleHeadPrice: minWsHead,
    recommendedWholesaleHeadPrice: recWsHead,
    brandWholesaleHeadPrice: brandWsHead,
    minimumWholesaleProfit: minWsProfit,
    recommendedWholesaleProfit: recWsProfit,
    brandWholesaleProfit: brandWsProfit,
    minimumWholesaleProfitRate: minWsProfitRate,
    recommendedWholesaleProfitRate: recWsProfitRate,
    brandWholesaleProfitRate: brandWsProfitRate,
    minimumWholesaleAnnualRevenue: minWsHead * annualShipmentHeads,
    recommendedWholesaleAnnualRevenue: recWsHead * annualShipmentHeads,
    brandWholesaleAnnualRevenue: brandWsHead * annualShipmentHeads,
    minimumWholesaleAnnualProfit: minWsProfit * annualShipmentHeads,
    recommendedWholesaleAnnualProfit: recWsProfit * annualShipmentHeads,
    brandWholesaleAnnualProfit: brandWsProfit * annualShipmentHeads,
    directPriceLevel,
    directPriceComment,
  };
}

// ─── イベント販売価格計算 ─────────────────────────────────────────────────────
// 直販基準価格を100g心理価格に丸め、小ロットパック価格を算出する
export function calculateEvent(
  result: CalculationResult,
  meatWeightPerHead: number,
): EventResult {
  // 直販基準kg単価を100g心理価格に変換（イベントは常に心理価格丸め）
  const min100g = nearestPsychologyPrice(result.minimumPricePerKg / 10, PSYCHOLOGY_PRICES_100G);
  const rec100g = nearestPsychologyPrice(result.recommendedPricePerKg / 10, PSYCHOLOGY_PRICES_100G);
  const brand100g = nearestPsychologyPrice(result.brandPricePerKg / 10, PSYCHOLOGY_PRICES_100G);

  const minPerKg = min100g * 10;
  const recPerKg = rec100g * 10;
  const brandPerKg = brand100g * 10;

  const { baseCost, feeRate } = result;
  const minHead = minPerKg * meatWeightPerHead;
  const recHead = recPerKg * meatWeightPerHead;
  const brandHead = brandPerKg * meatWeightPerHead;

  const minProfit = minHead * (1 - feeRate) - baseCost;
  const recProfit = recHead * (1 - feeRate) - baseCost;
  const brandProfit = brandHead * (1 - feeRate) - baseCost;

  return {
    minimumPricePer100g: min100g,
    recommendedPricePer100g: rec100g,
    brandPricePer100g: brand100g,
    minimumPricePerKg: minPerKg,
    recommendedPricePerKg: recPerKg,
    brandPricePerKg: brandPerKg,
    minimum300g: min100g * 3,
    recommended300g: rec100g * 3,
    brand300g: brand100g * 3,
    minimum500g: min100g * 5,
    recommended500g: rec100g * 5,
    brand500g: brand100g * 5,
    minimum1kg: min100g * 10,
    recommended1kg: rec100g * 10,
    brand1kg: brand100g * 10,
    minimumProfit: minProfit,
    recommendedProfit: recProfit,
    brandProfit: brandProfit,
    minimumProfitRate: minHead > 0 ? minProfit / minHead : 0,
    recommendedProfitRate: recHead > 0 ? recProfit / recHead : 0,
    brandProfitRate: brandHead > 0 ? brandProfit / brandHead : 0,
  };
}

// ─── ふるさと納税 必要寄附金額計算 ───────────────────────────────────────────
// 直販基準価格を返礼品価値として、2制約モデルで最低寄附金額を算出する
// 制約1（還元率）: 寄附 >= 返礼品価値 / 目標還元率
// 制約2（費用回収）: 寄附 >= (返礼品価値 + 固定費) / (1 - 率費合計)
// 採用値: max(制約1, 制約2) を1,000円単位切り上げ
type FurusatoInput = Pick<FormData,
  | 'furusatoReturnRate'
  | 'furusatoPortalFeeRate'
  | 'furusatoPaymentFeeRate'
  | 'furusatoOtherRateFee'
  | 'furusatoPackagingCost'
  | 'furusatoStorageCost'
  | 'furusatoShippingCost'
  | 'furusatoFulfillmentCost'
  | 'furusatoOtherFixedCost'
  | 'meatWeightPerHead'
  | 'annualShipmentHeads'
>;

export function calculateFurusato(
  result: CalculationResult,
  data: FurusatoInput,
): FurusatoResult {
  const returnRateDecimal = data.furusatoReturnRate / 100;
  const rateFeeTotal =
    (data.furusatoPortalFeeRate + data.furusatoPaymentFeeRate + data.furusatoOtherRateFee) / 100;
  const fixedCostPerHead =
    data.furusatoPackagingCost +
    data.furusatoStorageCost +
    data.furusatoShippingCost +
    data.furusatoFulfillmentCost +
    data.furusatoOtherFixedCost;

  // パッケージ単位の寄附金額計算
  function donationForPackage(pricePerKg: number, weightKg: number): number {
    const giftValue = pricePerKg * weightKg;
    // パッケージ分の固定費（頭全体の固定費を重量按分）
    const fixedCostForPackage =
      data.meatWeightPerHead > 0 ? fixedCostPerHead * (weightKg / data.meatWeightPerHead) : 0;

    const d1 = returnRateDecimal > 0 ? giftValue / returnRateDecimal : Infinity;
    const d2 = rateFeeTotal < 1 ? (giftValue + fixedCostForPackage) / (1 - rateFeeTotal) : Infinity;
    return Math.ceil(Math.max(d1, d2) / 1000) * 1000;
  }

  // 有効制約の判定（推奨価格×500gパッケージで評価）
  const giftValue500gRec = result.recommendedPricePerKg * 0.5;
  const fixedCost500g =
    data.meatWeightPerHead > 0 ? fixedCostPerHead * (0.5 / data.meatWeightPerHead) : 0;
  const d1rec = returnRateDecimal > 0 ? giftValue500gRec / returnRateDecimal : 0;
  const d2rec = rateFeeTotal < 1 ? (giftValue500gRec + fixedCost500g) / (1 - rateFeeTotal) : 0;
  const activeConstraint: 'returnRate' | 'costCoverage' = d1rec >= d2rec ? 'returnRate' : 'costCoverage';

  // 1頭分（全量）の寄附金額
  const minDonationPerHead = donationForPackage(result.minimumPricePerKg, data.meatWeightPerHead);
  const recDonationPerHead = donationForPackage(result.recommendedPricePerKg, data.meatWeightPerHead);
  const brandDonationPerHead = donationForPackage(result.brandPricePerKg, data.meatWeightPerHead);

  return {
    returnRateDecimal,
    rateFeeTotal,
    fixedCostPerHead,
    activeConstraint,
    minimumDonationPerHead: minDonationPerHead,
    recommendedDonationPerHead: recDonationPerHead,
    brandDonationPerHead: brandDonationPerHead,
    minimum300g: donationForPackage(result.minimumPricePerKg, 0.3),
    recommended300g: donationForPackage(result.recommendedPricePerKg, 0.3),
    brand300g: donationForPackage(result.brandPricePerKg, 0.3),
    minimum500g: donationForPackage(result.minimumPricePerKg, 0.5),
    recommended500g: donationForPackage(result.recommendedPricePerKg, 0.5),
    brand500g: donationForPackage(result.brandPricePerKg, 0.5),
    minimum1kg: donationForPackage(result.minimumPricePerKg, 1.0),
    recommended1kg: donationForPackage(result.recommendedPricePerKg, 1.0),
    brand1kg: donationForPackage(result.brandPricePerKg, 1.0),
    minimumAnnualRevenue: minDonationPerHead * data.annualShipmentHeads,
    recommendedAnnualRevenue: recDonationPerHead * data.annualShipmentHeads,
    brandAnnualRevenue: brandDonationPerHead * data.annualShipmentHeads,
  };
}
