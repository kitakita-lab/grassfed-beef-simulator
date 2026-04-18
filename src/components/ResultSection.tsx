import type {
  FormData,
  CalculationResult,
  WholesaleResult,
  DirectResult,
  EventResult,
  FurusatoResult,
} from '../types';
import {
  getChannelHints,
  formatCurrency,
  formatPercent,
  calculateWholesale,
  calculateDirect,
  calculateEvent,
  calculateFurusato,
} from '../utils/calculator';

interface Props {
  formData: FormData;
  result: CalculationResult | null;
}

// ─── 卸チャネルパネル ─────────────────────────────────────────────────────────
function WholesalePanel({
  wr,
  minPerKg,
  recPerKg,
  brandPerKg,
}: {
  wr: WholesaleResult;
  minPerKg: number;
  recPerKg: number;
  brandPerKg: number;
}) {
  return (
    <div className="channel-panel wholesale-panel">
      <div className="channel-panel-header wholesale">
        🏪 卸チャネル補足情報
        <span className="channel-basis-badge">卸価格 ÷ 掛け率 = 想定小売価格</span>
      </div>
      <div className="channel-panel-meta">
        <span className="channel-meta-item">卸先掛け率: <strong>{(wr.wholesaleRateDecimal * 100).toFixed(0)}%</strong></span>
        <span className="channel-meta-item">卸先想定粗利率: <strong>{formatPercent(wr.retailerGrossMarginDecimal)}</strong></span>
      </div>
      <div style={{ padding: '0 4px 4px' }}>
        <div className="annual-table-scroll">
          <table className="annual-table">
            <thead>
              <tr>
                <th>項目</th>
                <th className="col-min">🔴 最低</th>
                <th className="col-rec">🔵 推奨</th>
                <th className="col-brand">🟡 ブランド</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>卸価格 /kg</td>
                <td className="col-min">{formatCurrency(minPerKg)}</td>
                <td className="col-rec">{formatCurrency(recPerKg)}</td>
                <td className="col-brand">{formatCurrency(brandPerKg)}</td>
              </tr>
              <tr>
                <td>想定小売価格 /kg</td>
                <td className="col-min">{formatCurrency(wr.minimumRetailPricePerKg)}</td>
                <td className="col-rec">{formatCurrency(wr.recommendedRetailPricePerKg)}</td>
                <td className="col-brand">{formatCurrency(wr.brandRetailPricePerKg)}</td>
              </tr>
              <tr>
                <td>想定小売価格 /100g</td>
                <td className="col-min">{formatCurrency(wr.minimumRetailPricePer100g)}</td>
                <td className="col-rec">{formatCurrency(wr.recommendedRetailPricePer100g)}</td>
                <td className="col-brand">{formatCurrency(wr.brandRetailPricePer100g)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className={`wholesale-comment ${wr.retailPriceLevel}`}>
        💬 {wr.retailPriceComment}
      </div>
    </div>
  );
}

// ─── 直販チャネルパネル ───────────────────────────────────────────────────────
function DirectPanel({ dr, wholesaleRate }: { dr: DirectResult; wholesaleRate: number }) {
  const profitDiff = dr.recommendedProfit - dr.wholesaleRecommendedProfit;
  return (
    <div className="channel-panel direct-panel">
      <div className="channel-panel-header direct">
        🛒 直販価格（チャネル調整後）
        <span className="channel-basis-badge">
          卸想定小売 {formatCurrency(dr.wholesaleRetailRefPerKg)}/kg（掛け率{wholesaleRate}%）× 係数{(dr.coefficient * 100).toFixed(0)}%
        </span>
      </div>
      <div className="channel-panel-meta">
        <span className="channel-meta-item">
          卸比較（推奨）:
          <strong style={{ color: profitDiff >= 0 ? 'var(--color-hint)' : '#c0392b' }}>
            {profitDiff >= 0 ? '+' : ''}{formatCurrency(profitDiff)}/頭
          </strong>
        </span>
        <span className="channel-meta-item">
          価格根拠: <strong>卸想定小売 × {(dr.coefficient * 100).toFixed(0)}%</strong>（コスト下限保証あり）
        </span>
      </div>
      <div style={{ padding: '0 4px 4px' }}>
        <div className="annual-table-scroll">
          <table className="annual-table">
            <thead>
              <tr>
                <th>項目</th>
                <th className="col-min">🔴 最低</th>
                <th className="col-rec">🔵 推奨</th>
                <th className="col-brand">🟡 ブランド</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>直販価格 /kg</td>
                <td className="col-min">{formatCurrency(dr.minimumPricePerKg)}</td>
                <td className="col-rec">{formatCurrency(dr.recommendedPricePerKg)}</td>
                <td className="col-brand">{formatCurrency(dr.brandPricePerKg)}</td>
              </tr>
              <tr>
                <td>直販価格 /100g</td>
                <td className="col-min">{formatCurrency(dr.minimumPricePer100g)}</td>
                <td className="col-rec">{formatCurrency(dr.recommendedPricePer100g)}</td>
                <td className="col-brand">{formatCurrency(dr.brandPricePer100g)}</td>
              </tr>
              <tr>
                <td>1頭あたり利益</td>
                <td className={`col-min ${dr.minimumProfit < 0 ? 'negative' : ''}`}>{formatCurrency(dr.minimumProfit)}</td>
                <td className={`col-rec ${dr.recommendedProfit < 0 ? 'negative' : ''}`}>{formatCurrency(dr.recommendedProfit)}</td>
                <td className={`col-brand ${dr.brandProfit < 0 ? 'negative' : ''}`}>{formatCurrency(dr.brandProfit)}</td>
              </tr>
              <tr>
                <td>利益率</td>
                <td className="col-min">{formatPercent(dr.minimumProfitRate)}</td>
                <td className="col-rec">{formatPercent(dr.recommendedProfitRate)}</td>
                <td className="col-brand">{formatPercent(dr.brandProfitRate)}</td>
              </tr>
              <tr>
                <td>年間売上</td>
                <td className="col-min">{formatCurrency(dr.minimumAnnualRevenue)}</td>
                <td className="col-rec">{formatCurrency(dr.recommendedAnnualRevenue)}</td>
                <td className="col-brand">{formatCurrency(dr.brandAnnualRevenue)}</td>
              </tr>
              <tr>
                <td>年間利益</td>
                <td className={`col-min ${dr.minimumAnnualProfit < 0 ? 'negative' : ''}`}>{formatCurrency(dr.minimumAnnualProfit)}</td>
                <td className={`col-rec ${dr.recommendedAnnualProfit < 0 ? 'negative' : ''}`}>{formatCurrency(dr.recommendedAnnualProfit)}</td>
                <td className={`col-brand ${dr.brandAnnualProfit < 0 ? 'negative' : ''}`}>{formatCurrency(dr.brandAnnualProfit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── イベント販売チャネルパネル ───────────────────────────────────────────────
function EventPanel({ er, wholesaleRate, directCoefficient }: { er: EventResult; wholesaleRate: number; directCoefficient: number }) {
  const rows: { label: string; min: number; rec: number; brand: number }[] = [
    { label: '300g パック', min: er.minimum300g, rec: er.recommended300g, brand: er.brand300g },
    { label: '500g パック', min: er.minimum500g, rec: er.recommended500g, brand: er.brand500g },
    { label: '1kg パック', min: er.minimum1kg, rec: er.recommended1kg, brand: er.brand1kg },
  ];

  return (
    <div className="channel-panel event-panel">
      <div className="channel-panel-header event">
        🎪 イベント販売価格（小ロットパック）
        <span className="channel-basis-badge">
          卸想定小売（掛け率{wholesaleRate}%）× 係数{directCoefficient}% → 100g単価心理価格
        </span>
      </div>
      <div className="channel-panel-meta">
        <span className="channel-meta-item">
          100g単価（推奨）: <strong>{formatCurrency(er.recommendedPricePer100g)}/100g</strong>
        </span>
        <span className="channel-meta-item">
          1kg単価（推奨）: <strong>{formatCurrency(er.recommendedPricePerKg)}/kg</strong>
        </span>
      </div>

      {/* パックサイズ別価格グリッド（主要表示） */}
      <div className="event-package-grid">
        {rows.map(({ label, min, rec, brand }) => (
          <div key={label} className="event-package-row">
            <div className="event-package-label">{label}</div>
            <div className="event-package-prices">
              <div className="event-pkg-cell min">
                <span className="event-pkg-tier">最低</span>
                <span className="event-pkg-price col-min">{formatCurrency(min)}</span>
              </div>
              <div className="event-pkg-cell rec">
                <span className="event-pkg-tier">推奨</span>
                <span className="event-pkg-price col-rec">{formatCurrency(rec)}</span>
              </div>
              <div className="event-pkg-cell brand">
                <span className="event-pkg-tier">ブランド</span>
                <span className="event-pkg-price col-brand">{formatCurrency(brand)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 利益参考 */}
      <div className="channel-panel-meta" style={{ borderTop: '1px solid #e8d898', paddingTop: 8, marginTop: 4 }}>
        <span className="channel-meta-item">
          1頭あたり利益（推奨）:
          <strong className={er.recommendedProfit >= 0 ? '' : 'negative'}>
            {' '}{formatCurrency(er.recommendedProfit)}
          </strong>
        </span>
        <span className="channel-meta-item">
          利益率（推奨）: <strong>{formatPercent(er.recommendedProfitRate)}</strong>
        </span>
      </div>
    </div>
  );
}

// ─── ふるさと納税チャネルパネル ───────────────────────────────────────────────
function FurusatoPanel({ fr }: { fr: FurusatoResult }) {
  const constraintLabel = fr.activeConstraint === 'returnRate'
    ? `還元率${(fr.returnRateDecimal * 100).toFixed(0)}%が制約条件`
    : `手数料率${(fr.platformFeeDecimal * 100).toFixed(0)}%が制約条件`;

  const packages: { label: string; min: number; rec: number; brand: number }[] = [
    { label: '500g 返礼品', min: fr.minimum500g, rec: fr.recommended500g, brand: fr.brand500g },
    { label: '1kg 返礼品', min: fr.minimum1kg, rec: fr.recommended1kg, brand: fr.brand1kg },
    { label: '300g 返礼品', min: fr.minimum300g, rec: fr.recommended300g, brand: fr.brand300g },
  ];

  return (
    <div className="channel-panel furusato-panel">
      <div className="channel-panel-header furusato">
        🎁 ふるさと納税 必要寄附金額
        <span className="channel-basis-badge">調達原価 ÷ 目標還元率（{(fr.returnRateDecimal * 100).toFixed(0)}%）</span>
      </div>
      <div className="channel-panel-meta">
        <span className="channel-meta-item">目標還元率: <strong>{(fr.returnRateDecimal * 100).toFixed(0)}%</strong></span>
        <span className="channel-meta-item">プラットフォーム手数料: <strong>{(fr.platformFeeDecimal * 100).toFixed(0)}%</strong></span>
        <span className="channel-meta-item furusato-constraint">⚖️ {constraintLabel}</span>
      </div>

      {/* 返礼品別寄附金額テーブル */}
      <div style={{ padding: '0 4px 4px' }}>
        <div className="annual-table-scroll">
          <table className="annual-table">
            <thead>
              <tr>
                <th>返礼品</th>
                <th className="col-min">🔴 最低寄附額</th>
                <th className="col-rec">🔵 推奨寄附額</th>
                <th className="col-brand">🟡 ブランド寄附額</th>
              </tr>
            </thead>
            <tbody>
              {packages.map(({ label, min, rec, brand }) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td className="col-min">{formatCurrency(min)}</td>
                  <td className="col-rec">{formatCurrency(rec)}</td>
                  <td className="col-brand">{formatCurrency(brand)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="furusato-note">
        💡 寄附金額は1,000円単位切り上げ。推奨寄附額 = 生産者が最低限確保したい調達原価を還元率で割り戻した金額です。
        年間調達収入（推奨）: <strong>{formatCurrency(fr.recommendedAnnualRevenue)}</strong>
      </div>
    </div>
  );
}

// ─── 価格カード ───────────────────────────────────────────────────────────────
function PriceCard({
  tier,
  headPrice,
  pricePerKg,
  pricePer100g,
  profit,
  profitRate,
  annualRevenue,
  annualProfit,
  comment,
}: {
  tier: 'min' | 'rec' | 'brand';
  headPrice: number;
  pricePerKg: number;
  pricePer100g: number;
  profit: number;
  profitRate: number;
  annualRevenue: number;
  annualProfit: number;
  comment: string;
}) {
  const labels = {
    min: { badge: '最低価格', title: '最低販売価格', badgeCls: 'badge-min', titleCls: 'min', headerCls: 'min' },
    rec: { badge: '推奨価格', title: '推奨販売価格', badgeCls: 'badge-rec', titleCls: 'rec', headerCls: 'rec' },
    brand: { badge: 'ブランド価格', title: 'ブランド販売価格', badgeCls: 'badge-brand', titleCls: 'brand', headerCls: 'brand' },
  }[tier];

  return (
    <div className="price-card">
      <div className={`price-card-header ${labels.headerCls}`}>
        <span className={`price-card-badge ${labels.badgeCls}`}>{labels.badge}</span>
        <span className={`price-card-title ${labels.titleCls}`}>{labels.title}</span>
      </div>
      <div className="price-card-body">
        <div className={`price-main ${labels.titleCls}`}>{formatCurrency(headPrice)}</div>
        <div className="price-sub">1頭あたり販売額</div>
        <div className="price-row">
          <span className="price-row-label">1kg 単価</span>
          <span className="price-row-value">{formatCurrency(pricePerKg)} / kg</span>
        </div>
        <div className="price-row">
          <span className="price-row-label">100g 単価</span>
          <span className="price-row-value">{formatCurrency(pricePer100g)} / 100g</span>
        </div>
        <div className="price-row">
          <span className="price-row-label">1頭あたり利益</span>
          <span className={`price-row-value ${profit >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(profit)}
          </span>
        </div>
        <div className="price-row">
          <span className="price-row-label">利益率</span>
          <span className={`price-row-value ${profitRate >= 0 ? 'positive' : 'negative'}`}>
            {formatPercent(profitRate)}
          </span>
        </div>
        <div className="price-row">
          <span className="price-row-label">年間想定売上</span>
          <span className="price-row-value">{formatCurrency(annualRevenue)}</span>
        </div>
        <div className="price-row">
          <span className="price-row-label">年間想定利益</span>
          <span className={`price-row-value ${annualProfit >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(annualProfit)}
          </span>
        </div>
        <div className="price-comment">{comment}</div>
      </div>
    </div>
  );
}

const GENERAL_TIPS = [
  '少頭数育成では、単価の維持が経営継続の鍵です。',
  '有機認証・グラスフェッドの付加価値は、価格にしっかり反映しましょう。',
  '卸チャネルは利益が圧迫されやすいため、直販・ふるさと納税との組み合わせが有効です。',
  '価格は下げやすく上げにくいため、最初から適正価格で設定することが大切です。',
];

// チャネル別の価格カードの補足説明
function channelPriceCardNote(channel: string): string | null {
  switch (channel) {
    case '直販':
      return '上の価格はコスト積み上げによる参考価格（卸換算）です。実際の直販価格は↓の直販価格パネルをご確認ください。';
    case 'イベント販売':
      return '上の価格はコスト積み上げによる参考価格（卸換算）です。実際のイベント価格（心理価格丸め・小ロット）は↓をご確認ください。';
    case 'ふるさと納税':
      return '上の価格はコスト積み上げによる参考価格（調達原価）です。必要寄附金額は↓のふるさと納税パネルをご確認ください。';
    default:
      return null;
  }
}

export default function ResultSection({ formData, result }: Props) {
  const channelHints = getChannelHints(formData.salesChannel);

  if (!result) {
    return (
      <div className="results-area">
        <div className="empty-result">
          <div className="empty-result-icon">🐄</div>
          <h3>入力値を確認してください</h3>
          <p>
            「年間出荷予定頭数」と「可食販売量」に正の数値を入力すると、
            価格が自動で計算されます。
            <br />まずは「サンプルを入力」ボタンで試してみてください。
          </p>
        </div>
        <div className="hints-card" style={{ marginTop: 16 }}>
          <div className="hints-title">
            <span>📢</span>{formData.salesChannel}チャネルのポイント
          </div>
          <ul className="hints-list">
            {channelHints.map((h, i) => <li key={i}>{h}</li>)}
          </ul>
        </div>
        <div className="tips-card" style={{ marginTop: 16 }}>
          <div className="tips-title">
            <span>🌿</span>高付加価値・少頭数育成のヒント
          </div>
          <ul className="tips-list">
            {GENERAL_TIPS.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      </div>
    );
  }

  const {
    raisingCost,
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
    annualBrandCost,
  } = result;

  // チャネル別補足パネルの計算
  const wholesaleResult: WholesaleResult | null =
    formData.salesChannel === '卸' && formData.wholesaleRate > 0
      ? calculateWholesale(result, formData.wholesaleRate)
      : null;

  const directResult: DirectResult | null =
    formData.salesChannel === '直販' && formData.wholesaleRate > 0
      ? calculateDirect(
          result,
          formData.wholesaleRate,
          formData.directCoefficient,
          formData.meatWeightPerHead,
          formData.annualShipmentHeads,
          formData.roundingMode,
        )
      : null;

  const eventResult: EventResult | null =
    formData.salesChannel === 'イベント販売' && formData.wholesaleRate > 0
      ? calculateEvent(
          result,
          formData.wholesaleRate,
          formData.directCoefficient,
          formData.meatWeightPerHead,
        )
      : null;

  const furusatoResult: FurusatoResult | null =
    formData.salesChannel === 'ふるさと納税' && formData.furusatoReturnRate > 0
      ? calculateFurusato(
          result,
          formData.furusatoPlatformFeeRate,
          formData.furusatoReturnRate,
          formData.meatWeightPerHead,
          formData.annualShipmentHeads,
        )
      : null;

  const priceCardNote = channelPriceCardNote(formData.salesChannel);

  return (
    <div className="results-area">
      <div className="result-intro">
        <strong>計算結果</strong>（{formData.salesChannel}チャネル・{formData.priceStrategy}戦略・{formData.roundingMode}）
        <br />
        1頭あたり総原価: <strong>{formatCurrency(baseCost)}</strong> ／
        手数料率: <strong>{formatPercent(feeRate)}</strong>
      </div>

      {/* コストベース参考価格カード（全チャネル共通） */}
      <div className="price-cards">
        <PriceCard
          tier="min"
          headPrice={minimumHeadPrice}
          pricePerKg={minimumPricePerKg}
          pricePer100g={minimumPricePer100g}
          profit={minimumProfit}
          profitRate={minimumProfitRate}
          annualRevenue={minimumAnnualRevenue}
          annualProfit={minimumAnnualProfit}
          comment="赤字を回避するための下限価格です。この価格を下回ると損失が発生します。"
        />
        <PriceCard
          tier="rec"
          headPrice={recommendedHeadPrice}
          pricePerKg={recommendedPricePerKg}
          pricePer100g={recommendedPricePer100g}
          profit={recommendedProfit}
          profitRate={recommendedProfitRate}
          annualRevenue={recommendedAnnualRevenue}
          annualProfit={recommendedAnnualProfit}
          comment="継続経営のための現実的な価格です。理想利益率を確保しつつ、最低価格の110%以上を保証しています。"
        />
        <PriceCard
          tier="brand"
          headPrice={brandHeadPrice}
          pricePerKg={brandPricePerKg}
          pricePer100g={brandPricePer100g}
          profit={brandProfit}
          profitRate={brandProfitRate}
          annualRevenue={brandAnnualRevenue}
          annualProfit={brandAnnualProfit}
          comment={`有機認証・グラスフェッド・少頭数育成の価値を守るブランド価格です（${formData.priceStrategy}戦略）。`}
        />
      </div>

      {/* チャネル別補足説明（直販/イベント/ふるさと納税のみ） */}
      {priceCardNote && (
        <div className="channel-note">
          ℹ️ {priceCardNote}
        </div>
      )}

      {/* チャネル別パネル */}
      {wholesaleResult && (
        <WholesalePanel
          wr={wholesaleResult}
          minPerKg={minimumPricePerKg}
          recPerKg={recommendedPricePerKg}
          brandPerKg={brandPricePerKg}
        />
      )}
      {directResult && (
        <DirectPanel dr={directResult} wholesaleRate={formData.wholesaleRate} />
      )}
      {eventResult && (
        <EventPanel
          er={eventResult}
          wholesaleRate={formData.wholesaleRate}
          directCoefficient={formData.directCoefficient}
        />
      )}
      {furusatoResult && (
        <FurusatoPanel fr={furusatoResult} />
      )}

      {/* コスト内訳 */}
      <div className="summary-card">
        <div className="summary-header">
          <span>📊</span> コスト内訳（1頭あたり）
        </div>
        <div className="summary-body">
          <div className="summary-row">
            <span className="summary-label">飼養コスト</span>
            <span className="summary-value">{formatCurrency(raisingCost)}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">認証・ブランド維持コスト</span>
            <span className="summary-value">{formatCurrency(brandCostPerHead)}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">　└ 年間認証コスト合計</span>
            <span className="summary-value text-muted" style={{ fontWeight: 400, fontSize: '0.8rem' }}>
              {formatCurrency(annualBrandCost)} ÷ {formData.annualShipmentHeads}頭
            </span>
          </div>
          <div className="summary-row">
            <span className="summary-label">加工・販売固定コスト</span>
            <span className="summary-value">{formatCurrency(processingCostTotal)}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label" style={{ fontWeight: 700 }}>1頭あたり総原価</span>
            <span className="summary-value highlight">{formatCurrency(baseCost)}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">損益分岐単価（1kg）</span>
            <span className="summary-value" style={{ color: '#c0392b' }}>
              {formatCurrency(breakEvenPricePerKg)} / kg
            </span>
          </div>
          <div className="summary-row">
            <span className="summary-label">合算手数料率</span>
            <span className="summary-value">{formatPercent(feeRate)}</span>
          </div>
        </div>
      </div>

      {/* 年間比較表 */}
      <div className="summary-card">
        <div className="summary-header">
          <span>📅</span> 年間想定（{formData.annualShipmentHeads}頭出荷時）
        </div>
        <div className="summary-body" style={{ padding: '0 4px 4px' }}>
          <div className="annual-table-scroll">
            <table className="annual-table">
              <thead>
                <tr>
                  <th>項目</th>
                  <th className="col-min">🔴 最低</th>
                  <th className="col-rec">🔵 推奨</th>
                  <th className="col-brand">🟡 ブランド</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1kg単価</td>
                  <td className="col-min">{formatCurrency(minimumPricePerKg)}</td>
                  <td className="col-rec">{formatCurrency(recommendedPricePerKg)}</td>
                  <td className="col-brand">{formatCurrency(brandPricePerKg)}</td>
                </tr>
                <tr>
                  <td>100g単価</td>
                  <td className="col-min">{formatCurrency(minimumPricePer100g)}</td>
                  <td className="col-rec">{formatCurrency(recommendedPricePer100g)}</td>
                  <td className="col-brand">{formatCurrency(brandPricePer100g)}</td>
                </tr>
                <tr>
                  <td>年間売上</td>
                  <td className="col-min">{formatCurrency(minimumAnnualRevenue)}</td>
                  <td className="col-rec">{formatCurrency(recommendedAnnualRevenue)}</td>
                  <td className="col-brand">{formatCurrency(brandAnnualRevenue)}</td>
                </tr>
                <tr>
                  <td>年間利益</td>
                  <td className={`col-min ${minimumAnnualProfit < 0 ? 'negative' : ''}`}>{formatCurrency(minimumAnnualProfit)}</td>
                  <td className={`col-rec ${recommendedAnnualProfit < 0 ? 'negative' : ''}`}>{formatCurrency(recommendedAnnualProfit)}</td>
                  <td className={`col-brand ${brandAnnualProfit < 0 ? 'negative' : ''}`}>{formatCurrency(brandAnnualProfit)}</td>
                </tr>
                <tr>
                  <td>利益率</td>
                  <td className="col-min">{formatPercent(minimumProfitRate)}</td>
                  <td className="col-rec">{formatPercent(recommendedProfitRate)}</td>
                  <td className="col-brand">{formatPercent(brandProfitRate)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 目標利益との比較 */}
      {formData.annualTargetProfit > 0 && (
        <div className="summary-card">
          <div className="summary-header">
            <span>🎯</span> 目標利益との比較
          </div>
          <div className="summary-body">
            <div className="summary-row">
              <span className="summary-label">目標年間利益</span>
              <span className="summary-value">{formatCurrency(formData.annualTargetProfit)}</span>
            </div>
            {[
              { label: '最低価格での年間利益', value: minimumAnnualProfit, cls: 'col-min' },
              { label: '推奨価格での年間利益', value: recommendedAnnualProfit, cls: 'col-rec' },
              { label: 'ブランド価格での年間利益', value: brandAnnualProfit, cls: 'col-brand' },
            ].map(({ label, value, cls }) => {
              const diff = value - formData.annualTargetProfit;
              return (
                <div className="summary-row" key={label}>
                  <span className="summary-label">{label}</span>
                  <span className={`summary-value ${cls}`}>
                    {formatCurrency(value)}
                    <span style={{ fontSize: '0.75rem', marginLeft: 6, color: diff >= 0 ? '#2c7a2c' : '#c0392b' }}>
                      ({diff >= 0 ? '+' : ''}{formatCurrency(diff)})
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* チャネルヒント */}
      <div className="hints-card">
        <div className="hints-title">
          <span>📢</span>{formData.salesChannel}チャネルのポイント
        </div>
        <ul className="hints-list">
          {channelHints.map((h, i) => <li key={i}>{h}</li>)}
        </ul>
      </div>

      {/* 一般ヒント */}
      <div className="tips-card">
        <div className="tips-title">
          <span>🌿</span>高付加価値・少頭数育成のヒント
        </div>
        <ul className="tips-list">
          {GENERAL_TIPS.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      </div>
    </div>
  );
}
