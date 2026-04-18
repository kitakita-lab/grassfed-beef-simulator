import type {
  FormData,
  CalculationResult,
  RoundingMode,
  PriceStrategy,
  ValidationWarning,
  ChannelPrices,
} from '../types';

const PSYCHOLOGY_PRICES_100G = [398, 480, 580, 680, 780, 880, 980, 1180, 1280, 1480];
const PSYCHOLOGY_PRICES_1KG = [3980, 4800, 5800, 6800, 7800, 8800, 9800, 11800, 12800, 14800];

// チャネル別価格係数（固定）
const DIRECT_RATE    = 0.90; // 直販 = 小売参考 × 0.90
const EVENT_RATE     = 0.92; // イベント = 小売参考 × 0.92 → 100g心理価格
const FURUSATO_RATE  = 1.20; // ふるさと納税 = 小売参考 × 1.20

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

// 10円単位に丸める（小売参考価格・卸価格の表示用）
function round10(v: number): number {
  return Math.round(v / 10) * 10;
}

// ─── 基準価格計算（卸価格として扱う）────────────────────────────────────────
// calculate() の出力が卸価格。全チャネル価格はここから派生する。
export function calculate(data: FormData): CalculationResult | null {
  if (data.annualShipmentHeads <= 0 || data.meatWeightPerHead <= 0) return null;

  const raisingCost =
    data.feedCost + data.grassCost + data.vetCost +
    data.managementCost + data.laborCost + data.otherRaisingCost;

  const annualBrandCost =
    data.organicCertCost + data.grassfedCertCost + data.environmentCost +
    data.brandOperationCost + data.otherCertCost;

  const brandCostPerHead = annualBrandCost / data.annualShipmentHeads;

  const processingCostTotal =
    data.processingCost + data.packagingCost + data.storageCost +
    data.shippingCost + data.otherSalesCost;

  const baseCost = raisingCost + brandCostPerHead + processingCostTotal;

  const feeRate = (data.salesFeeRate + data.paymentFeeRate) / 100;
  if (1 - feeRate <= 0) return null;

  const minimumHeadPriceRaw = (baseCost + data.minimumProfitPerHead) / (1 - feeRate);

  const idealProfitRateDecimal = data.idealProfitRate / 100;
  const denominator = 1 - feeRate - idealProfitRateDecimal;
  const candidateHeadPrice = denominator > 0 ? baseCost / denominator : minimumHeadPriceRaw * 1.5;
  const recommendedHeadPriceRaw = Math.max(candidateHeadPrice, minimumHeadPriceRaw * 1.1);

  const strategyMultiplier = STRATEGY_MULTIPLIERS[data.priceStrategy];
  const brandHeadPriceRaw = recommendedHeadPriceRaw * strategyMultiplier;

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

  const minimumHeadPrice = minimumPricePerKg * data.meatWeightPerHead;
  const recommendedHeadPrice = recommendedPricePerKg * data.meatWeightPerHead;
  const brandHeadPrice = brandPricePerKg * data.meatWeightPerHead;

  const minimumProfit = minimumHeadPrice * (1 - feeRate) - baseCost;
  const recommendedProfit = recommendedHeadPrice * (1 - feeRate) - baseCost;
  const brandProfit = brandHeadPrice * (1 - feeRate) - baseCost;

  const minimumProfitRate = minimumHeadPrice > 0 ? minimumProfit / minimumHeadPrice : 0;
  const recommendedProfitRate = recommendedHeadPrice > 0 ? recommendedProfit / recommendedHeadPrice : 0;
  const brandProfitRate = brandHeadPrice > 0 ? brandProfit / brandHeadPrice : 0;

  const minimumAnnualRevenue = minimumHeadPrice * data.annualShipmentHeads;
  const recommendedAnnualRevenue = recommendedHeadPrice * data.annualShipmentHeads;
  const brandAnnualRevenue = brandHeadPrice * data.annualShipmentHeads;

  const minimumAnnualProfit = minimumProfit * data.annualShipmentHeads;
  const recommendedAnnualProfit = recommendedProfit * data.annualShipmentHeads;
  const brandAnnualProfit = brandProfit * data.annualShipmentHeads;

  const breakEvenPricePerKg = baseCost / (data.meatWeightPerHead * (1 - feeRate));

  return {
    raisingCost, annualBrandCost, brandCostPerHead, processingCostTotal,
    baseCost, feeRate,
    minimumHeadPrice, recommendedHeadPrice, brandHeadPrice,
    minimumPricePerKg, recommendedPricePerKg, brandPricePerKg,
    minimumPricePer100g, recommendedPricePer100g, brandPricePer100g,
    minimumProfit, recommendedProfit, brandProfit,
    minimumProfitRate, recommendedProfitRate, brandProfitRate,
    minimumAnnualRevenue, recommendedAnnualRevenue, brandAnnualRevenue,
    minimumAnnualProfit, recommendedAnnualProfit, brandAnnualProfit,
    breakEvenPricePerKg,
  };
}

// ─── チャネル別価格計算 ──────────────────────────────────────────────────────
// 卸価格（calculate()出力）→ 小売参考 → 直販/イベント/ふるさと納税
// 小売 = 卸 ÷ wholesaleRate
// 直販 = 小売 × 0.90
// イベント = 小売 × 0.92 → 100g心理価格に丸め
// ふるさと納税 = 小売 × 1.20（1,000円単位切上）
export function calculateChannelPrices(
  result: CalculationResult,
  wholesaleRate: number,
  meatWeightPerHead: number,
): ChannelPrices {
  const wholesaleRateDecimal = wholesaleRate / 100;

  // 小売参考価格 = 卸価格 ÷ 掛け率
  const retailMin   = wholesaleRateDecimal > 0 ? round10(result.minimumPricePerKg / wholesaleRateDecimal) : 0;
  const retailRec   = wholesaleRateDecimal > 0 ? round10(result.recommendedPricePerKg / wholesaleRateDecimal) : 0;
  const retailBrand = wholesaleRateDecimal > 0 ? round10(result.brandPricePerKg / wholesaleRateDecimal) : 0;

  // 直販 = 小売 × 0.90（10円単位）
  const directMinPerKg   = round10(retailMin   * DIRECT_RATE);
  const directRecPerKg   = round10(retailRec   * DIRECT_RATE);
  const directBrandPerKg = round10(retailBrand * DIRECT_RATE);

  // イベント = 小売 × 0.92 → 100g心理価格
  const eventMinPer100g   = nearestPsychologyPrice(retailMin   * EVENT_RATE / 10, PSYCHOLOGY_PRICES_100G);
  const eventRecPer100g   = nearestPsychologyPrice(retailRec   * EVENT_RATE / 10, PSYCHOLOGY_PRICES_100G);
  const eventBrandPer100g = nearestPsychologyPrice(retailBrand * EVENT_RATE / 10, PSYCHOLOGY_PRICES_100G);

  // ふるさと納税 = 小売 × 1.20（10円単位。パックは1,000円単位切上）
  const furusatoMinPerKg   = round10(retailMin   * FURUSATO_RATE);
  const furusatoRecPerKg   = round10(retailRec   * FURUSATO_RATE);
  const furusatoBrandPerKg = round10(retailBrand * FURUSATO_RATE);

  const ceil1000 = (v: number) => Math.ceil(v / 1000) * 1000;

  // 原価割れ判定: ふるさと納税推奨 /頭 が baseCost を下回る場合に警告
  const furusatoRecHeadPrice = furusatoRecPerKg * meatWeightPerHead;
  const furusatoBelowCostWarning = furusatoRecHeadPrice < result.baseCost;

  return {
    wholesaleRateDecimal,
    retailMinPerKg:   retailMin,
    retailRecPerKg:   retailRec,
    retailBrandPerKg: retailBrand,
    directMinPerKg,
    directRecPerKg,
    directBrandPerKg,
    directMinPer100g:   directMinPerKg   / 10,
    directRecPer100g:   directRecPerKg   / 10,
    directBrandPer100g: directBrandPerKg / 10,
    eventMinPer100g,
    eventRecPer100g,
    eventBrandPer100g,
    eventMinPerKg:   eventMinPer100g   * 10,
    eventRecPerKg:   eventRecPer100g   * 10,
    eventBrandPerKg: eventBrandPer100g * 10,
    eventMin300g:   eventMinPer100g   * 3,
    eventRec300g:   eventRecPer100g   * 3,
    eventBrand300g: eventBrandPer100g * 3,
    eventMin500g:   eventMinPer100g   * 5,
    eventRec500g:   eventRecPer100g   * 5,
    eventBrand500g: eventBrandPer100g * 5,
    eventMin1kg:   eventMinPer100g   * 10,
    eventRec1kg:   eventRecPer100g   * 10,
    eventBrand1kg: eventBrandPer100g * 10,
    furusatoMinPerKg,
    furusatoRecPerKg,
    furusatoBrandPerKg,
    furusatoMin500g:   ceil1000(furusatoMinPerKg   * 0.5),
    furusatoRec500g:   ceil1000(furusatoRecPerKg   * 0.5),
    furusatoBrand500g: ceil1000(furusatoBrandPerKg * 0.5),
    furusatoMin1kg:   ceil1000(furusatoMinPerKg),
    furusatoRec1kg:   ceil1000(furusatoRecPerKg),
    furusatoBrand1kg: ceil1000(furusatoBrandPerKg),
    furusatoBelowCostWarning,
  };
}

export function validate(data: FormData): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  if (data.annualShipmentHeads <= 0)
    warnings.push({ type: 'error', message: '年間出荷予定頭数が 0 以下です。計算できません。' });
  if (data.meatWeightPerHead <= 0)
    warnings.push({ type: 'error', message: '可食販売量が 0 以下です。計算できません。' });

  const feeRate = (data.salesFeeRate + data.paymentFeeRate) / 100;
  if (feeRate >= 1)
    warnings.push({ type: 'error', message: '手数料率の合計が100%以上です。価格計算ができません。' });
  else if (feeRate > 0.5)
    warnings.push({ type: 'warning', message: '手数料率の合計が50%を超えています。設定を確認してください。' });

  if (data.idealProfitRate / 100 + feeRate >= 1)
    warnings.push({ type: 'warning', message: '理想利益率と手数料の合計が100%以上です。推奨価格が正常に計算されない可能性があります。' });
  if (data.idealProfitRate > 60)
    warnings.push({ type: 'warning', message: '理想利益率が60%を超えています。市場環境によっては販売が難しい可能性があります。' });

  const fields = [
    data.feedCost, data.grassCost, data.vetCost, data.managementCost,
    data.laborCost, data.otherRaisingCost, data.organicCertCost,
    data.grassfedCertCost, data.environmentCost, data.brandOperationCost,
    data.otherCertCost, data.processingCost, data.packagingCost,
    data.storageCost, data.shippingCost, data.otherSalesCost,
    data.minimumProfitPerHead,
  ];
  if (fields.some((v) => v < 0))
    warnings.push({ type: 'error', message: 'マイナスのコスト値が入力されています。正しい値を入力してください。' });

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
        'ポータル手数料（目安15〜25%）が差し引かれるため、手取り額の確認を忘れずに。',
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
