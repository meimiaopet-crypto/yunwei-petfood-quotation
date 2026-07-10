import Decimal from 'decimal.js';

// 金融级精度：28 位有效数字，4 位小数（与 DECIMAL(10,4) 匹配）
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export const D = (v: number | string | Decimal | null | undefined): Decimal =>
  v === null || v === undefined || v === '' ? new Decimal(0) : new Decimal(v);

export const toNum = (v: Decimal | number): number => (v instanceof Decimal ? v.toNumber() : v);
export const round2 = (v: Decimal | number): number => D(v).toDecimalPlaces(2).toNumber();
export const round4 = (v: Decimal | number): number => D(v).toDecimalPlaces(4).toNumber();

/** 统一空值到 0，避免 NaN */
export const safe = (n: number | null | undefined, fallback = 0): number =>
  Number.isFinite(n) ? (n as number) : fallback;

/** 限幅：把数字限制在 [min, max] */
export const clamp = (n: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, n));
