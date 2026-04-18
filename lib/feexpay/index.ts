// lib/feexpay/index.ts

export const FEEXPAY_CONFIG = {
  shopId: process.env.FEEXPAY_SHOP_ID!,
  apiKey: process.env.FEEXPAY_API_KEY!,
  publicShopId: process.env.NEXT_PUBLIC_FEEXPAY_SHOP_ID!,
  webhookSecret: process.env.FEEXPAY_WEBHOOK_SECRET!,
}

export interface InitiatePaymentPayload {
  courseId: string
  userId: string
  amount: number
  currency: string
  description: string
  userEmail: string
  userFullname: string
  userPhone?: string
}

export interface FeexpayCallback {
  status: 'SUCCESS' | 'FAILED' | 'PENDING'
  reference: string
  amount: number
  currency: string
  custom_id?: string
}

// Générer une référence unique par paiement
export function generatePaymentRef(courseId: string, userId: string): string {
  const timestamp = Date.now()
  return `LFD-${courseId.slice(0, 6)}-${userId.slice(0, 6)}-${timestamp}`
}