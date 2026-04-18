import type {
  FormData,
  CalculationResult,
  RoundingMode,
  PriceStrategy,
  ValidationWarning,
  WholesaleResult,
  RetailPriceLevel,
  DirectResult,
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
  // 全候補が価格より低い場合は心理価格を使わず100円単位に切り上げ（最低価格を下回らないよう）
  if (valid.length === 0) return Math.ceil(price / 100) * 100;
  return Math.min(...valid);
}

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
        'プラットフォーム手数料（通常20〜30%程度）を考慮した価格設定が必要です。',
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

// 想定小売価格を10円単位に丸める（卸先が端数を調整するため参考値として）
function roundRetail(price: number): number {
  return Math.round(price / 10) * 10;
}

function getRetailPriceLevel(pricePerKg: number): RetailPriceLevel {
  if (pricePerKg < 5000) return 'low';
  if (pricePerKg < 8000) return 'normal';
  if (pricePerKg < 12000) return 'premium';
  return 'ultra';
}

function getRetailPriceComment(level: RetailPriceLevel, pricePerKg: number): string {
  const priceLabel = formatCurrency(Math.round(pricePerKg / 100) * 100);
  switch (level) {
    case 'low':
      return `想定小売価格（${priceLabel}/kg）は一般スーパーの国産牛肉と競合する水準です。有機・グラスフェッドとしての付加価値訴求が重要になります。`;
    case 'normal':
      return `想定小売価格（${priceLabel}/kg）は有機・グラスフェッドビーフとして妥当な価格帯です。自然食品店・専門店での展開に適しています。`;
    case 'premium':
      return `想定小売価格（${priceLabel}/kg）は高品質ブランド牛として訴求できる価格帯です。百貨店・高級食品店向けの展開が適しています。`;
    case 'ultra':
      return `想定小売価格（${priceLabel}/kg）はプレミアム価格帯です。希少性とブランドストーリーが価格を支える必要があります。`;
  }
}

export function calculateWholesale(
  result: CalculationResult,
  wholesaleRate: number,
): WholesaleResult {
  const wholesaleRateDecimal = wholesaleRate / 100;
  const retailerGrossMarginDecimal = 1 - wholesaleRateDecimal;

  // 小売価格 = 卸価格 ÷ 掛け率
  const minimumRetailPricePerKg =
    wholesaleRateDecimal > 0 ? roundRetail(result.minimumPricePerKg / wholesaleRateDecimal) : 0;
  const recommendedRetailPricePerKg =
    wholesaleRateDecimal > 0 ? roundRetail(result.recommendedPricePerKg / wholesaleRateDecimal) : 0;
  const brandRetailPricePerKg =
    wholesaleRateDecimal > 0 ? roundRetail(result.brandPricePerKg / wholesaleRateDecimal) : 0;

  const minimumRetailPricePer100g = Math.round(minimumRetailPricePerKg / 10);
  const recommendedRetailPricePer100g = Math.round(recommendedRetailPricePerKg / 10);
  const brandRetailPricePer100g = Math.round(brandRetailPricePerKg / 10);

  const retailPriceLevel = getRetailPriceLevel(recommendedRetailPricePerKg);
  const retailPriceComment = getRetailPriceComment(retailPriceLevel, recommendedRetailPricePerKg);

  return {
    wholesaleRateDecimal,
    retailerGrossMarginDecimal,
    minimumRetailPricePerKg,
    recommendedRetailPricePerKg,
    brandRetailPricePerKg,
    minimumRetailPricePer100g,
    recommendedRetailPricePer100g,
    brandRetailPricePer100g,
    retailPriceLevel,
    retailPriceComment,
  };
}

// ─── 直販価格計算 ─────────────────────────────────────────────────────────────
// 卸の想定小売参考価格 × directCoefficient（%）を基準に価格を算出する
export function calculateDirect(
  result: CalculationResult,
  wholesaleRate: number,
  directCoefficient: number,   // %入力（例: 90 → 0.90）
  meatWeightPerHead: number,
  annualShipmentHeads: number,
  roundingMode: RoundingMode,
): DirectResult {
  const wsRateDecimal = wholesaleRate / 100;
  const coeffDecimal = directCoefficient / 100;

  // 卸想定小売参考価格（掛け率で逆算）
  const minRetail = wsRateDecimal > 0 ? result.minimumPricePerKg / wsRateDecimal : result.minimumPricePerKg;
  const recRetail = wsRateDecimal > 0 ? result.recommendedPricePerKg / wsRateDecimal : result.recommendedPricePerKg;
  const brandRetail = wsRateDecimal > 0 ? result.brandPricePerKg / wsRateDecimal : result.brandPricePerKg;

  // 直販価格 = 想定小売 × 係数、ただし卸価格（コスト床）以上を保証
  let minPerKg = Math.max(result.minimumPricePerKg, minRetail * coeffDecimal);
  let recPerKg = Math.max(result.minimumPricePerKg, recRetail * coeffDecimal);
  let brandPerKg = Math.max(result.minimumPricePerKg, brandRetail * coeffDecimal);

  let minPer100g: number;
  let recPer100g: number;
  let brandPer100g: number;

  if (roundingMode === '100g単価心理価格') {
    minPer100g = nearestPsychologyPrice(minPerKg / 10, PSYCHOLOGY_PRICES_100G);
    recPer100g = nearestPsychologyPrice(recPerKg / 10, PSYCHOLOGY_PRICES_100G);
    brandPer100g = nearestPsychologyPrice(brandPerKg / 10, PSYCHOLOGY_PRICES_100G);
    minPerKg = minPer100g * 10;
    recPerKg = recPer100g * 10;
    brandPerKg = brandPer100g * 10;
  } else if (roundingMode === '1kg単価心理価格') {
    minPerKg = nearestPsychologyPrice(minPerKg, PSYCHOLOGY_PRICES_1KG);
    recPerKg = nearestPsychologyPrice(recPerKg, PSYCHOLOGY_PRICES_1KG);
    brandPerKg = nearestPsychologyPrice(brandPerKg, PSYCHOLOGY_PRICES_1KG);
    minPer100g = minPerKg / 10;
    recPer100g = recPerKg / 10;
    brandPer100g = brandPerKg / 10;
  } else {
    minPerKg = roundPrice(minPerKg, roundingMode);
    recPerKg = roundPrice(recPerKg, roundingMode);
    brandPerKg = roundPrice(brandPerKg, roundingMode);
    minPer100g = minPerKg / 10;
    recPer100g = recPerKg / 10;
    brandPer100g = brandPerKg / 10;
  }

  const { baseCost, feeRate } = result;
  const minHead = minPerKg * meatWeightPerHead;
  const recHead = recPerKg * meatWeightPerHead;
  const brandHead = brandPerKg * meatWeightPerHead;

  const minProfit = minHead * (1 - feeRate) - baseCost;
  const recProfit = recHead * (1 - feeRate) - baseCost;
  const brandProfit = brandHead * (1 - feeRate) - baseCost;

  return {
    coefficient: coeffDecimal,
    wholesaleRetailRefPerKg: Math.round(recRetail / 10) * 10,
    minimumPricePerKg: minPerKg,
    recommendedPricePerKg: recPerKg,
    brandPricePerKg: brandPerKg,
    minimumPricePer100g: minPer100g,
    recommendedPricePer100g: recPer100g,
    brandPricePer100g: brandPer100g,
    minimumHeadPrice: minHead,
    recommendedHeadPrice: recHead,
    brandHeadPrice: brandHead,
    minimumProfit: minProfit,
    recommendedProfit: recProfit,
    brandProfit: brandProfit,
    minimumProfitRate: minHead > 0 ? minProfit / minHead : 0,
    recommendedProfitRate: recHead > 0 ? recProfit / recHead : 0,
    brandProfitRate: brandHead > 0 ? brandProfit / brandHead : 0,
    minimumAnnualRevenue: minHead * annualShipmentHeads,
    recommendedAnnualRevenue: recHead * annualShipmentHeads,
    brandAnnualRevenue: brandHead * annualShipmentHeads,
    minimumAnnualProfit: minProfit * annualShipmentHeads,
    recommendedAnnualProfit: recProfit * annualShipmentHeads,
    brandAnnualProfit: brandProfit * annualShipmentHeads,
    wholesaleRecommendedProfit: result.recommendedProfit,
  };
}

// ─── イベント販売価格計算 ─────────────────────────────────────────────────────
// 直販ベース価格を100g単価心理価格に丸め、小ロットパック価格を算出する
export function calculateEvent(
  result: CalculationResult,
  wholesaleRate: number,
  directCoefficient: number,
  meatWeightPerHead: number,
): EventResult {
  const wsRateDecimal = wholesaleRate / 100;
  const coeffDecimal = directCoefficient / 100;

  const minRetail = wsRateDecimal > 0 ? result.minimumPricePerKg / wsRateDecimal : result.minimumPricePerKg;
  const recRetail = wsRateDecimal > 0 ? result.recommendedPricePerKg / wsRateDecimal : result.recommendedPricePerKg;
  const brandRetail = wsRateDecimal > 0 ? result.brandPricePerKg / wsRateDecimal : result.brandPricePerKg;

  const minBase = Math.max(result.minimumPricePerKg, minRetail * coeffDecimal);
  const recBase = Math.max(result.minimumPricePerKg, recRetail * coeffDecimal);
  const brandBase = Math.max(result.minimumPricePerKg, brandRetail * coeffDecimal);

  // イベント販売は常に100g単価心理価格丸め
  const min100g = nearestPsychologyPrice(minBase / 10, PSYCHOLOGY_PRICES_100G);
  const rec100g = nearestPsychologyPrice(recBase / 10, PSYCHOLOGY_PRICES_100G);
  const brand100g = nearestPsychologyPrice(brandBase / 10, PSYCHOLOGY_PRICES_100G);

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
// 調達原価を基に法定還元率・プラットフォーム手数料の両制約から必要寄附金額を算出する
export function calculateFurusato(
  result: CalculationResult,
  furusatoPlatformFeeRate: number,
  furusatoReturnRate: number,
  meatWeightPerHead: number,
  annualShipmentHeads: number,
): FurusatoResult {
  const platformFeeDecimal = furusatoPlatformFeeRate / 100;
  const returnRateDecimal = furusatoReturnRate / 100;

  // 調達価格/kg（= 生産者が受け取りたい価格 = コスト計算結果のkg単価）
  const minGiftPerKg = meatWeightPerHead > 0 ? result.minimumHeadPrice / meatWeightPerHead : 0;
  const recGiftPerKg = meatWeightPerHead > 0 ? result.recommendedHeadPrice / meatWeightPerHead : 0;
  const brandGiftPerKg = meatWeightPerHead > 0 ? result.brandHeadPrice / meatWeightPerHead : 0;

  // 寄附金額の制約:
  //   1. 還元率制約: 調達価格 / 寄附 <= 還元率 → 寄附 >= 調達価格 / 還元率
  //   2. プラットフォーム手数料制約: 調達価格 <= 寄附 × (1 - 手数料率) → 寄附 >= 調達価格 / (1 - 手数料率)
  function donationForGiftPerKg(giftPerKg: number, weightKg: number): number {
    const giftValue = giftPerKg * weightKg;
    const d1 = returnRateDecimal > 0 ? giftValue / returnRateDecimal : Infinity;
    const d2 = platformFeeDecimal < 1 ? giftValue / (1 - platformFeeDecimal) : Infinity;
    return Math.ceil(Math.max(d1, d2) / 1000) * 1000; // 1,000円単位切り上げ
  }

  // 有効制約の判定（推奨価格で評価）
  const d1rec = returnRateDecimal > 0 ? recGiftPerKg / returnRateDecimal : 0;
  const d2rec = platformFeeDecimal < 1 ? recGiftPerKg / (1 - platformFeeDecimal) : 0;
  const activeConstraint: 'returnRate' | 'platformFee' = d1rec >= d2rec ? 'returnRate' : 'platformFee';

  // 1頭あたり寄附金額
  const minDonationPerHead = donationForGiftPerKg(minGiftPerKg, meatWeightPerHead);
  const recDonationPerHead = donationForGiftPerKg(recGiftPerKg, meatWeightPerHead);
  const brandDonationPerHead = donationForGiftPerKg(brandGiftPerKg, meatWeightPerHead);

  return {
    returnRateDecimal,
    platformFeeDecimal,
    activeConstraint,
    minimumDonationPerHead: minDonationPerHead,
    recommendedDonationPerHead: recDonationPerHead,
    brandDonationPerHead: brandDonationPerHead,
    minimum300g: donationForGiftPerKg(minGiftPerKg, 0.3),
    recommended300g: donationForGiftPerKg(recGiftPerKg, 0.3),
    brand300g: donationForGiftPerKg(brandGiftPerKg, 0.3),
    minimum500g: donationForGiftPerKg(minGiftPerKg, 0.5),
    recommended500g: donationForGiftPerKg(recGiftPerKg, 0.5),
    brand500g: donationForGiftPerKg(brandGiftPerKg, 0.5),
    minimum1kg: donationForGiftPerKg(minGiftPerKg, 1.0),
    recommended1kg: donationForGiftPerKg(recGiftPerKg, 1.0),
    brand1kg: donationForGiftPerKg(brandGiftPerKg, 1.0),
    minimumAnnualRevenue: result.minimumHeadPrice * annualShipmentHeads,
    recommendedAnnualRevenue: result.recommendedHeadPrice * annualShipmentHeads,
    brandAnnualRevenue: result.brandHeadPrice * annualShipmentHeads,
  };
}
