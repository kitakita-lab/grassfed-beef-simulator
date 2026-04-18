import type { FormData } from '../types';

// v3: 価格基準を直販ベースへ変更。furusato詳細費用フィールド追加
// v2 のキーは別名なので自動的に無視される
const STORAGE_KEY = 'grassfed_beef_simulator_v3';

interface StoredState {
  formData: Partial<FormData>;
  hasInteracted: boolean;
}

export const DEFAULT_FORM_DATA: FormData = {
  numberOfHeads: 0,
  annualShipmentHeads: 0,
  meatWeightPerHead: 180,
  salesChannel: '直販',
  feedCost: 0,
  grassCost: 0,
  vetCost: 0,
  managementCost: 0,
  laborCost: 0,
  otherRaisingCost: 0,
  organicCertCost: 0,
  grassfedCertCost: 0,
  environmentCost: 0,
  brandOperationCost: 0,
  otherCertCost: 0,
  processingCost: 0,
  packagingCost: 0,
  storageCost: 0,
  shippingCost: 0,
  salesFeeRate: 10,
  paymentFeeRate: 3.6,
  otherSalesCost: 0,
  minimumProfitPerHead: 0,
  idealProfitRate: 20,
  annualTargetProfit: 0,
  priceStrategy: '標準',
  roundingMode: '100円単位',
  wholesaleRate: 70,
  furusatoReturnRate: 30,
  furusatoPortalFeeRate: 15,
  furusatoPaymentFeeRate: 3,
  furusatoOtherRateFee: 0,
  furusatoPackagingCost: 0,
  furusatoStorageCost: 0,
  furusatoShippingCost: 0,
  furusatoFulfillmentCost: 0,
  furusatoOtherFixedCost: 0,
};

export const SAMPLE_FORM_DATA: FormData = {
  numberOfHeads: 40,
  annualShipmentHeads: 18,
  meatWeightPerHead: 180,
  salesChannel: '直販',
  feedCost: 180000,
  grassCost: 90000,
  vetCost: 25000,
  managementCost: 40000,
  laborCost: 70000,
  otherRaisingCost: 15000,
  organicCertCost: 250000,
  grassfedCertCost: 120000,
  environmentCost: 180000,
  brandOperationCost: 150000,
  otherCertCost: 30000,
  processingCost: 80000,
  packagingCost: 12000,
  storageCost: 10000,
  shippingCost: 8000,
  salesFeeRate: 10,
  paymentFeeRate: 3.6,
  otherSalesCost: 5000,
  minimumProfitPerHead: 80000,
  idealProfitRate: 20,
  annualTargetProfit: 0,
  priceStrategy: '標準',
  roundingMode: '100円単位',
  wholesaleRate: 70,
  furusatoReturnRate: 30,
  furusatoPortalFeeRate: 15,
  furusatoPaymentFeeRate: 3,
  furusatoOtherRateFee: 0,
  furusatoPackagingCost: 36000,
  furusatoStorageCost: 18000,
  furusatoShippingCost: 180000,
  furusatoFulfillmentCost: 0,
  furusatoOtherFixedCost: 0,
};

export function saveToStorage(data: FormData, hasInteracted: boolean): void {
  try {
    const stored: StoredState = { formData: data, hasInteracted };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // localStorage unavailable
  }
}

export function loadFromStorage(): { formData: FormData; hasInteracted: boolean } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    return {
      formData: { ...DEFAULT_FORM_DATA, ...(parsed.formData ?? {}) },
      hasInteracted: parsed.hasInteracted ?? false,
    };
  } catch {
    return null;
  }
}
