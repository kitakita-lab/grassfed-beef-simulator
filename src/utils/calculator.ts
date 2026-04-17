import type {
  FormData,
  CalculationResult,
  RoundingMode,
  PriceStrategy,
  ValidationWarning,
  WholesaleResult,
  RetailPriceLevel,
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
