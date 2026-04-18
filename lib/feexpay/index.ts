// lib/feexpay/index.ts
export const FEEXPAY_SHOP_ID = process.env.FEEXPAY_SHOP_ID || ''
export const FEEXPAY_API_KEY = process.env.FEEXPAY_API_KEY || ''

export interface FeexpayPayload {
  amount: number
  currency: string
  description: string
  customId: string
  callbackInfo?: Record<string, string>
}