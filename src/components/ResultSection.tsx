import type { FormData, CalculationResult } from '../types';
import { getChannelHints, formatCurrency, formatPercent } from '../utils/calculator';

interface Props {
  formData: FormData;
  result: CalculationResult | null;
}

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
            <span>📢</span>
            {formData.salesChannel}チャネルのポイント
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

  return (
    <div className="results-area">
      <div className="result-intro">
        <strong>計算結果</strong>（{formData.salesChannel}チャネル・{formData.priceStrategy}戦略・{formData.roundingMode}）
        <br />
        1頭あたり総原価: <strong>{formatCurrency(baseCost)}</strong> ／
        手数料率: <strong>{formatPercent(feeRate)}</strong>
      </div>

      {/* 3大価格カード */}
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
          <span>📢</span>
          {formData.salesChannel}チャネルのポイント
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
