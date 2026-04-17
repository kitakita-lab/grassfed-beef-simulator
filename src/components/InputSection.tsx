import { useState } from 'react';
import type { FormData, SalesChannel, PriceStrategy, RoundingMode, ValidationWarning } from '../types';

interface Props {
  formData: FormData;
  onChange: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  warnings: ValidationWarning[];
  isDirty: boolean;
}

function NumField({
  label,
  hint,
  value,
  unit,
  onChange,
  step = 1000,
  min = 0,
}: {
  label: string;
  hint?: string;
  value: number;
  unit?: string;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
}) {
  return (
    <div className="field-group">
      <label className="field-label">
        {label}
        {hint && <span className="field-hint">{hint}</span>}
      </label>
      <div className="field-input-wrap">
        <input
          type="number"
          className={`field-input${unit ? '' : ' no-unit'}`}
          value={value === 0 ? '' : value}
          placeholder="0"
          step={step}
          min={min}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            onChange(isNaN(v) ? 0 : v);
          }}
        />
        {unit && <span className="field-unit">{unit}</span>}
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  defaultOpen = false,
  children,
}: {
  icon: string;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="section-card">
      <div className="section-header" onClick={() => setOpen((o) => !o)}>
        <span className="section-title">
          <span className="section-icon">{icon}</span>
          {title}
        </span>
        <span className={`chevron ${open ? 'open' : ''}`}>▼</span>
      </div>
      {open && <div className="section-body">{children}</div>}
    </div>
  );
}

const CHANNELS: SalesChannel[] = ['直販', '卸', 'ふるさと納税', 'イベント販売'];
const STRATEGIES: PriceStrategy[] = ['控えめ', '標準', '高付加価値'];
const ROUNDING_MODES: RoundingMode[] = ['1円単位', '10円単位', '100円単位', '100g単価心理価格', '1kg単価心理価格'];

export default function InputSection({ formData, onChange, warnings, isDirty }: Props) {
  return (
    <div className="input-area">
      {!isDirty ? (
        <div className="guide-card">
          <div className="guide-card-body">
            <p className="guide-card-title">🌱 まず基本情報とコストを入力してください</p>
            <ul className="guide-card-list">
              <li>年間出荷予定頭数と可食販売量を入力すると計算が始まります</li>
              <li>「サンプルを入力」で北海道・18頭規模の数値例を確認できます</li>
              <li>入力値はブラウザに自動保存され、次回も引き続き使えます</li>
            </ul>
          </div>
        </div>
      ) : warnings.length > 0 ? (
        <div className="warnings">
          {warnings.map((w, i) => (
            <div key={i} className={`warning-item ${w.type}`}>
              <span className="warning-icon">{w.type === 'error' ? '🚫' : '⚠️'}</span>
              <span>{w.message}</span>
            </div>
          ))}
        </div>
      ) : null}

      {/* A. 基本情報 */}
      <Section icon="🐄" title="A. 基本情報" defaultOpen>
        <div className="field-row">
          <NumField
            label="飼養頭数"
            unit="頭"
            value={formData.numberOfHeads}
            step={1}
            onChange={(v) => onChange('numberOfHeads', v)}
          />
          <NumField
            label="年間出荷予定頭数"
            unit="頭"
            value={formData.annualShipmentHeads}
            step={1}
            onChange={(v) => onChange('annualShipmentHeads', v)}
          />
        </div>
        <NumField
          label="1頭あたり可食販売量"
          hint="（枝肉歩留まり後の販売可能量）"
          unit="kg"
          value={formData.meatWeightPerHead}
          step={10}
          onChange={(v) => onChange('meatWeightPerHead', v)}
        />
        <div className="field-group">
          <label className="field-label">販売チャネル</label>
          <div className="radio-group">
            {CHANNELS.map((ch) => (
              <label key={ch} className={`radio-label ${formData.salesChannel === ch ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="salesChannel"
                  value={ch}
                  checked={formData.salesChannel === ch}
                  onChange={() => onChange('salesChannel', ch)}
                />
                {ch}
              </label>
            ))}
          </div>
        </div>
      </Section>

      {/* B. 飼養コスト */}
      <Section icon="🌿" title="B. 飼養コスト（1頭あたり年間）" defaultOpen>
        <div className="field-row">
          <NumField
            label="飼料コスト"
            unit="円"
            value={formData.feedCost}
            onChange={(v) => onChange('feedCost', v)}
          />
          <NumField
            label="牧草生産コスト"
            unit="円"
            value={formData.grassCost}
            onChange={(v) => onChange('grassCost', v)}
          />
        </div>
        <div className="field-row">
          <NumField
            label="衛生・獣医コスト"
            unit="円"
            value={formData.vetCost}
            onChange={(v) => onChange('vetCost', v)}
          />
          <NumField
            label="管理コスト"
            unit="円"
            value={formData.managementCost}
            onChange={(v) => onChange('managementCost', v)}
          />
        </div>
        <div className="field-row">
          <NumField
            label="人件費按分"
            hint="（自分の労働含む）"
            unit="円"
            value={formData.laborCost}
            onChange={(v) => onChange('laborCost', v)}
          />
          <NumField
            label="その他飼養コスト"
            unit="円"
            value={formData.otherRaisingCost}
            onChange={(v) => onChange('otherRaisingCost', v)}
          />
        </div>
      </Section>

      {/* C. 認証・ブランド維持コスト */}
      <Section icon="🏷️" title="C. 認証・ブランド維持コスト（年間合計）">
        <div className="field-row">
          <NumField
            label="有機認証維持コスト"
            unit="円"
            value={formData.organicCertCost}
            onChange={(v) => onChange('organicCertCost', v)}
          />
          <NumField
            label="グラスフェッド関連維持費"
            unit="円"
            value={formData.grassfedCertCost}
            onChange={(v) => onChange('grassfedCertCost', v)}
          />
        </div>
        <div className="field-row">
          <NumField
            label="環境保全・放牧維持費"
            unit="円"
            value={formData.environmentCost}
            onChange={(v) => onChange('environmentCost', v)}
          />
          <NumField
            label="ブランド運営費"
            hint="（広告・HP等）"
            unit="円"
            value={formData.brandOperationCost}
            onChange={(v) => onChange('brandOperationCost', v)}
          />
        </div>
        <NumField
          label="その他認証関連費"
          unit="円"
          value={formData.otherCertCost}
          onChange={(v) => onChange('otherCertCost', v)}
        />
      </Section>

      {/* D. 加工・販売コスト */}
      <Section icon="📦" title="D. 加工・販売コスト（1頭あたり）">
        <div className="field-row">
          <NumField
            label="加工費"
            hint="（と畜・カット等）"
            unit="円"
            value={formData.processingCost}
            onChange={(v) => onChange('processingCost', v)}
          />
          <NumField
            label="包装費"
            unit="円"
            value={formData.packagingCost}
            onChange={(v) => onChange('packagingCost', v)}
          />
        </div>
        <div className="field-row">
          <NumField
            label="冷凍・保管費"
            unit="円"
            value={formData.storageCost}
            onChange={(v) => onChange('storageCost', v)}
          />
          <NumField
            label="送料負担"
            hint="（着払い等除く）"
            unit="円"
            value={formData.shippingCost}
            onChange={(v) => onChange('shippingCost', v)}
          />
        </div>
        <div className="field-row">
          <NumField
            label="販売手数料"
            hint="（ECサイト等）"
            unit="%"
            value={formData.salesFeeRate}
            step={0.5}
            onChange={(v) => onChange('salesFeeRate', v)}
          />
          <NumField
            label="決済手数料"
            hint="（クレジット等）"
            unit="%"
            value={formData.paymentFeeRate}
            step={0.1}
            onChange={(v) => onChange('paymentFeeRate', v)}
          />
        </div>
        <NumField
          label="その他販売関連費"
          unit="円"
          value={formData.otherSalesCost}
          onChange={(v) => onChange('otherSalesCost', v)}
        />
      </Section>

      {/* E. 利益設定 */}
      <Section icon="💰" title="E. 利益設定">
        <NumField
          label="最低限確保したい利益額（1頭あたり）"
          unit="円"
          value={formData.minimumProfitPerHead}
          onChange={(v) => onChange('minimumProfitPerHead', v)}
        />
        <NumField
          label="理想利益率"
          hint="（販売額に対する利益の割合）"
          unit="%"
          value={formData.idealProfitRate}
          step={1}
          onChange={(v) => onChange('idealProfitRate', v)}
        />
        <NumField
          label="年間で確保したい目標利益額（任意）"
          unit="円"
          value={formData.annualTargetProfit}
          onChange={(v) => onChange('annualTargetProfit', v)}
        />
      </Section>

      {/* F. ブランド設定 */}
      <Section icon="⭐" title="F. ブランド価格設定">
        <div className="field-group">
          <label className="field-label">価格戦略</label>
          <div className="radio-group">
            {STRATEGIES.map((s) => (
              <label key={s} className={`radio-label ${formData.priceStrategy === s ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="priceStrategy"
                  value={s}
                  checked={formData.priceStrategy === s}
                  onChange={() => onChange('priceStrategy', s)}
                />
                {s === '控えめ' && '控えめ（×1.05）'}
                {s === '標準' && '標準（×1.15）'}
                {s === '高付加価値' && '高付加価値（×1.30）'}
              </label>
            ))}
          </div>
          <p className="text-muted text-small" style={{ marginTop: 8 }}>
            推奨価格に対する係数で、ブランド価格を算出します。
          </p>
        </div>
      </Section>

      {/* G. 丸め設定 */}
      <Section icon="🔢" title="G. 価格の丸め設定">
        <div className="field-group">
          <label className="field-label">丸め方式</label>
          <div className="radio-group" style={{ flexDirection: 'column', gap: 6 }}>
            {ROUNDING_MODES.map((m) => (
              <label key={m} className={`radio-label ${formData.roundingMode === m ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="roundingMode"
                  value={m}
                  checked={formData.roundingMode === m}
                  onChange={() => onChange('roundingMode', m)}
                />
                {m === '1円単位' && '1円単位（切り上げ）'}
                {m === '10円単位' && '10円単位（切り上げ）'}
                {m === '100円単位' && '100円単位（切り上げ）'}
                {m === '100g単価心理価格' && '100g単価で心理価格に丸め（398・480・580…円）'}
                {m === '1kg単価心理価格' && '1kg単価で心理価格に丸め（3,980・4,800・5,800…円）'}
              </label>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}
