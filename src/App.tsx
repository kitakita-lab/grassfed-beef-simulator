import { useState, useEffect, useCallback } from 'react';
import type { FormData } from './types';
import { calculate, validate } from './utils/calculator';
import { saveToStorage, loadFromStorage, DEFAULT_FORM_DATA, SAMPLE_FORM_DATA } from './utils/storage';
import InputSection from './components/InputSection';
import ResultSection from './components/ResultSection';

export default function App() {
  const [formData, setFormData] = useState<FormData>(() => {
    return loadFromStorage()?.formData ?? DEFAULT_FORM_DATA;
  });
  // hasInteracted は localStorage から復元する。
  // これにより「リセット後に再読み込み」しても false が維持される。
  const [hasInteracted, setHasInteracted] = useState<boolean>(() => {
    return loadFromStorage()?.hasInteracted ?? false;
  });

  const result = calculate(formData);
  // バリデーション警告は hasInteracted になって初めて表示する
  const warnings = hasInteracted ? validate(formData) : [];

  // formData と hasInteracted をまとめて保存
  useEffect(() => {
    saveToStorage(formData, hasInteracted);
  }, [formData, hasInteracted]);

  const handleChange = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setHasInteracted(true);
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSample = () => {
    setHasInteracted(true);
    setFormData(SAMPLE_FORM_DATA);
  };

  const handleReset = () => {
    if (window.confirm('入力値をすべてリセットしますか？')) {
      setFormData(DEFAULT_FORM_DATA);
      setHasInteracted(false);
      // React の useEffect より先に明示保存して再読み込み時も確実に false になるようにする
      saveToStorage(DEFAULT_FORM_DATA, false);
    }
  };

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <h1>
          有機グラスフェッドビーフ<br />
          採算・販売価格シミュレーター
        </h1>
        <p>
          <span className="badge">有機JAS対応</span>
          <span className="badge">グラスフェッド</span>
          <span className="badge">少頭数育成</span>
        </p>
        <p style={{ marginTop: 10 }}>
          飼養コスト・認証費用・加工費を入力するだけで、
          最低・推奨・ブランド販売単価を自動算出します。
        </p>
        <div className="header-actions">
          <button className="btn btn-sample" onClick={handleSample}>
            📋 サンプルを入力
          </button>
          <button className="btn btn-reset" onClick={handleReset}>
            🔄 リセット
          </button>
        </div>
      </header>

      <main className="main-content">
        <InputSection
          formData={formData}
          onChange={handleChange}
          warnings={warnings}
          hasInteracted={hasInteracted}
        />
        <ResultSection
          formData={formData}
          result={result}
        />
      </main>

      <footer className="app-footer">
        <p>有機グラスフェッドビーフ 採算・販売価格シミュレーター — 北海道の持続可能な畜産を支援します</p>
        <p style={{ marginTop: 4 }}>※ 本ツールの計算結果は参考値です。実際の経営判断は専門家にご相談ください。</p>
      </footer>
    </div>
  );
}
