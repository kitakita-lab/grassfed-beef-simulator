import type { FormData, CalculationResult, ChannelPrices } from '../types';
import {
  getChannelHints,
  formatCurrency,
  formatPercent,
  calculateChannelPrices,
} from '../utils/calculator';

interface Props {
  formData: FormData;
  result: CalculationResult | null;
}

// ─── 小売参考価格バー（常時表示・補助） ────────────────────────────────────
function RetailRefStrip({ cp }: { cp: ChannelPrices }) {
  return (
    <div className="retail-ref-strip">
      <span className="retail-ref-label">📍 小売参考（基準）</span>
      <span className="retail-ref-values">
        <span className="col-min">最低 {formatCurrency(cp.retailMinPerKg)}</span>
        {' ／ '}
        <span className="col-rec">推奨 {formatCurrency(cp.retailRecPerKg)}</span>
        {' ／ '}
        <span className="col-brand">ブランド {formatCurrency(cp.retailBrandPerKg)}</span>
        {' /kg'}
      </span>
    </div>
  );
}

// ─── 直販チャネルパネル ────────────────────────────────────────────────────
function DirectPanel({ cp }: { cp: ChannelPrices }) {
  return (
    <div className="summary-card">
      <div className="summary-header"><span>🏠</span> 直販・EC・ギフト価格</div>
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
                <td>直販価格 /kg</td>
                <td className="col-min">{formatCurrency(cp.directMinPerKg)}</td>
                <td className="col-rec">{formatCurrency(cp.directRecPerKg)}</td>
                <td className="col-brand">{formatCurrency(cp.directBrandPerKg)}</td>
              </tr>
              <tr>
                <td>直販価格 /100g</td>
                <td className="col-min">{formatCurrency(cp.directMinPer100g)}</td>
                <td className="col-rec">{formatCurrency(cp.directRecPer100g)}</td>
                <td className="col-brand">{formatCurrency(cp.directBrandPer100g)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <RetailRefStrip cp={cp} />
        <p className="channel-detail-note">小売参考価格より10%安い設定（小売参考 × 0.90）</p>
      </div>
    </div>
  );
}

// ─── イベント販売チャネルパネル ────────────────────────────────────────────
function EventPanel({ cp }: { cp: ChannelPrices }) {
  return (
    <div className="summary-card">
      <div className="summary-header"><span>🎪</span> イベント販売価格</div>
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
                <td>100g単価（心理価格）</td>
                <td className="col-min">{formatCurrency(cp.eventMinPer100g)}</td>
                <td className="col-rec">{formatCurrency(cp.eventRecPer100g)}</td>
                <td className="col-brand">{formatCurrency(cp.eventBrandPer100g)}</td>
              </tr>
              <tr>
                <td>300g パック</td>
                <td className="col-min">{formatCurrency(cp.eventMin300g)}</td>
                <td className="col-rec">{formatCurrency(cp.eventRec300g)}</td>
                <td className="col-brand">{formatCurrency(cp.eventBrand300g)}</td>
              </tr>
              <tr>
                <td>500g パック</td>
                <td className="col-min">{formatCurrency(cp.eventMin500g)}</td>
                <td className="col-rec">{formatCurrency(cp.eventRec500g)}</td>
                <td className="col-brand">{formatCurrency(cp.eventBrand500g)}</td>
              </tr>
              <tr>
                <td>1kg パック</td>
                <td className="col-min">{formatCurrency(cp.eventMin1kg)}</td>
                <td className="col-rec">{formatCurrency(cp.eventRec1kg)}</td>
                <td className="col-brand">{formatCurrency(cp.eventBrand1kg)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <RetailRefStrip cp={cp} />
        <p className="channel-detail-note">小売参考価格 × 0.92 を元に算出し、100g心理価格（398・480・580…円）に丸めて表示</p>
      </div>
    </div>
  );
}

// ─── ふるさと納税チャネルパネル ────────────────────────────────────────────
function FurusatoPanel({ cp }: { cp: ChannelPrices }) {
  return (
    <div className="summary-card">
      <div className="summary-header"><span>🎁</span> ふるさと納税 寄付額目安</div>
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
                <td>寄付額目安 /kg</td>
                <td className="col-min">{formatCurrency(cp.furusatoMinPerKg)}</td>
                <td className="col-rec">{formatCurrency(cp.furusatoRecPerKg)}</td>
                <td className="col-brand">{formatCurrency(cp.furusatoBrandPerKg)}</td>
              </tr>
              <tr>
                <td>500g 返礼品</td>
                <td className="col-min">{formatCurrency(cp.furusatoMin500g)}</td>
                <td className="col-rec">{formatCurrency(cp.furusatoRec500g)}</td>
                <td className="col-brand">{formatCurrency(cp.furusatoBrand500g)}</td>
              </tr>
              <tr>
                <td>1kg 返礼品</td>
                <td className="col-min">{formatCurrency(cp.furusatoMin1kg)}</td>
                <td className="col-rec">{formatCurrency(cp.furusatoRec1kg)}</td>
                <td className="col-brand">{formatCurrency(cp.furusatoBrand1kg)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {cp.furusatoBelowCostWarning && (
          <p className="channel-detail-note" style={{ color: '#c0392b' }}>
            ⚠️ 推奨寄付額が原価を下回っています。卸掛け率または利益設定を見直してください。
          </p>
        )}
        <RetailRefStrip cp={cp} />
        <p className="furusato-note" style={{ margin: '4px 0 4px' }}>
          ※ ふるさと納税の寄付額は、小売参考価格を基準にした簡易係数（×1.20）による目安表示です。実際の寄付額設計は、返礼率・ポータル手数料・送料・梱包費・自治体条件により変動します。
        </p>
      </div>
    </div>
  );
}

// ─── 卸チャネルパネル ──────────────────────────────────────────────────────
function WholesalePanel({ cp }: { cp: ChannelPrices }) {
  const rateLabel = `${(cp.wholesaleRateDecimal * 100).toFixed(0)}%`;
  return (
    <div className="summary-card">
      <div className="summary-header"><span>🏭</span> 卸価格</div>
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
                <td>卸価格 /kg</td>
                <td className="col-min">{formatCurrency(cp.wholesaleMinPerKg)}</td>
                <td className="col-rec">{formatCurrency(cp.wholesaleRecPerKg)}</td>
                <td className="col-brand">{formatCurrency(cp.wholesaleBrandPerKg)}</td>
              </tr>
              <tr>
                <td>想定卸先小売参考 /kg</td>
                <td className="col-min">{formatCurrency(cp.retailMinPerKg)}</td>
                <td className="col-rec">{formatCurrency(cp.retailRecPerKg)}</td>
                <td className="col-brand">{formatCurrency(cp.retailBrandPerKg)}</td>
              </tr>
              <tr>
                <td>想定卸先小売参考 /100g</td>
                <td className="col-min">{formatCurrency(cp.retailMinPerKg / 10)}</td>
                <td className="col-rec">{formatCurrency(cp.retailRecPerKg / 10)}</td>
                <td className="col-brand">{formatCurrency(cp.retailBrandPerKg / 10)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="channel-detail-note">卸価格 = 小売参考価格 × 卸掛け率（{rateLabel}）</p>
      </div>
    </div>
  );
}

// ─── チャネル別パネル ディスパッチャー ────────────────────────────────────
function ChannelDetailPanel({ cp, salesChannel }: { cp: ChannelPrices; salesChannel: string }) {
  switch (salesChannel) {
    case '直販':       return <DirectPanel cp={cp} />;
    case 'イベント販売': return <EventPanel cp={cp} />;
    case 'ふるさと納税': return <FurusatoPanel cp={cp} />;
    case '卸':         return <WholesalePanel cp={cp} />;
    default:           return <DirectPanel cp={cp} />;
  }
}

// ─── 価格カード ───────────────────────────────────────────────────────────
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
    min: { badge: '最低価格', title: '最低小売参考価格', badgeCls: 'badge-min', titleCls: 'min', headerCls: 'min' },
    rec: { badge: '推奨価格', title: '推奨小売参考価格', badgeCls: 'badge-rec', titleCls: 'rec', headerCls: 'rec' },
    brand: { badge: 'ブランド価格', title: 'ブランド小売参考価格', badgeCls: 'badge-brand', titleCls: 'brand', headerCls: 'brand' },
  }[tier];

  return (
    <div className="price-card">
      <div className={`price-card-header ${labels.headerCls}`}>
        <span className={`price-card-badge ${labels.badgeCls}`}>{labels.badge}</span>
        <span className={`price-card-title ${labels.titleCls}`}>{labels.title}</span>
      </div>
      <div className="price-card-body">
        <div className={`price-main ${labels.titleCls}`}>{formatCurrency(headPrice)}</div>
        <div className="price-sub">
          {tier === 'brand' ? 'ブランド戦略 小売参考価格' :
           tier === 'rec'   ? 'コスト積み上げ 小売参考価格' :
                              '赤字回避 小売参考下限'}
        </div>
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
    annualBrandCost,
    brandCostPerHead,
    processingCostTotal,
    baseCost,
    feeRate,
    breakEvenPricePerKg,
  } = result;

  const cp = calculateChannelPrices(
    result,
    formData.wholesaleRate,
    formData.meatWeightPerHead,
    formData.annualShipmentHeads,
  );

  return (
    <div className="results-area">
      <div className="result-intro">
        <strong>計算結果</strong>（{formData.salesChannel}チャネル・{formData.priceStrategy}戦略・{formData.roundingMode}）
        <br />
        1頭あたり総原価: <strong>{formatCurrency(baseCost)}</strong> ／
        手数料率: <strong>{formatPercent(feeRate)}</strong>
      </div>

      {/* 基準価格バナー */}
      <div className="direct-basis-banner">
        🏪 基準価格は小売参考価格です — 直販×0.90 / イベント×0.92（心理価格） / ふるさと納税×1.20 / 卸×{formData.wholesaleRate}%
      </div>

      {/* 小売参考価格カード（3段階） */}
      <div className="price-cards">
        <PriceCard
          tier="min"
          headPrice={cp.retailMinHeadPrice}
          pricePerKg={cp.retailMinPerKg}
          pricePer100g={cp.retailMinPerKg / 10}
          profit={cp.retailMinProfit}
          profitRate={cp.retailMinProfitRate}
          annualRevenue={cp.retailMinAnnualRevenue}
          annualProfit={cp.retailMinAnnualProfit}
          comment="赤字を回避するための最低小売参考価格です。この価格を下回ると損失が発生します。"
        />
        <PriceCard
          tier="rec"
          headPrice={cp.retailRecHeadPrice}
          pricePerKg={cp.retailRecPerKg}
          pricePer100g={cp.retailRecPerKg / 10}
          profit={cp.retailRecProfit}
          profitRate={cp.retailRecProfitRate}
          annualRevenue={cp.retailRecAnnualRevenue}
          annualProfit={cp.retailRecAnnualProfit}
          comment="コスト積み上げによる推奨小売参考価格です。全チャネル価格の基準として使用します。"
        />
        <PriceCard
          tier="brand"
          headPrice={cp.retailBrandHeadPrice}
          pricePerKg={cp.retailBrandPerKg}
          pricePer100g={cp.retailBrandPerKg / 10}
          profit={cp.retailBrandProfit}
          profitRate={cp.retailBrandProfitRate}
          annualRevenue={cp.retailBrandAnnualRevenue}
          annualProfit={cp.retailBrandAnnualProfit}
          comment={`有機認証・グラスフェッド・少頭数育成の付加価値を反映した上位小売参考価格です（${formData.priceStrategy}戦略）。`}
        />
      </div>

      {/* 選択中チャネルの価格パネル */}
      <ChannelDetailPanel cp={cp} salesChannel={formData.salesChannel} />

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
            <span className="summary-label">損益分岐 小売参考 /kg</span>
            <span className="summary-value" style={{ color: '#c0392b' }}>
              {formatCurrency(Math.ceil(breakEvenPricePerKg / (formData.wholesaleRate / 100)))} / kg
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
          <span>📅</span> 年間想定（{formData.annualShipmentHeads}頭出荷時・小売参考価格基準）
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
                  <td>小売参考 1kg単価</td>
                  <td className="col-min">{formatCurrency(cp.retailMinPerKg)}</td>
                  <td className="col-rec">{formatCurrency(cp.retailRecPerKg)}</td>
                  <td className="col-brand">{formatCurrency(cp.retailBrandPerKg)}</td>
                </tr>
                <tr>
                  <td>年間売上（小売参考）</td>
                  <td className="col-min">{formatCurrency(cp.retailMinAnnualRevenue)}</td>
                  <td className="col-rec">{formatCurrency(cp.retailRecAnnualRevenue)}</td>
                  <td className="col-brand">{formatCurrency(cp.retailBrandAnnualRevenue)}</td>
                </tr>
                <tr>
                  <td>年間利益</td>
                  <td className={`col-min ${cp.retailMinAnnualProfit < 0 ? 'negative' : ''}`}>{formatCurrency(cp.retailMinAnnualProfit)}</td>
                  <td className={`col-rec ${cp.retailRecAnnualProfit < 0 ? 'negative' : ''}`}>{formatCurrency(cp.retailRecAnnualProfit)}</td>
                  <td className={`col-brand ${cp.retailBrandAnnualProfit < 0 ? 'negative' : ''}`}>{formatCurrency(cp.retailBrandAnnualProfit)}</td>
                </tr>
                <tr>
                  <td>利益率</td>
                  <td className="col-min">{formatPercent(cp.retailMinProfitRate)}</td>
                  <td className="col-rec">{formatPercent(cp.retailRecProfitRate)}</td>
                  <td className="col-brand">{formatPercent(cp.retailBrandProfitRate)}</td>
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
              { label: '最低価格での年間利益', value: cp.retailMinAnnualProfit, cls: 'col-min' },
              { label: '推奨価格での年間利益', value: cp.retailRecAnnualProfit, cls: 'col-rec' },
              { label: 'ブランド価格での年間利益', value: cp.retailBrandAnnualProfit, cls: 'col-brand' },
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
