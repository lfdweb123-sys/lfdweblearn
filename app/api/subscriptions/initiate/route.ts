// app/api/subscriptions/initiate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase/admin'

const PLANS: Record<string, { name: string; amount: number; currency: string; durationDays: number }> = {
  monthly: { name: 'Pro Mensuel', amount: 9900, currency: 'XOF', durationDays: 30 },
  yearly: { name: 'Pro Annuel', amount: 99000, currency: 'XOF', durationDays: 365 },
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('firebase-token')?.value
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

    const decoded = await adminAuth.verifyIdToken(token)
    const uid = decoded.uid

    const userSnap = await adminDb.collection('users').doc(uid).get()
    const userData = userSnap.data()

    if (!userData || (userData.role !== 'instructor' && userData.role !== 'admin')) {
      return NextResponse.json({ error: 'Formateur requis' }, { status: 403 })
    }

    const { planId } = await request.json()
    const plan = PLANS[planId]
    if (!plan) return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })

    const customId = 'sub_' + uid + '_' + Date.now()
    const shopId = process.env.NEXT_PUBLIC_FEEXPAY_SHOP_ID || ''

    // Sauvegarder l'intention de paiement
    await adminDb.collection('subscription_intents').doc(customId).set({
      userId: uid,
      planId,
      planName: plan.name,
      amount: plan.amount,
      currency: plan.currency,
      durationDays: plan.durationDays,
      status: 'pending',
      createdAt: new Date(),
    })

    return NextResponse.json({
      customId,
      shopId,
      amount: plan.amount,
      currency: plan.currency,
      planName: plan.name,
      planId,
      userEmail: userData.email,
      userFullname: userData.displayName || '',
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}