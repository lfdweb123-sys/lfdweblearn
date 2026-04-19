// app/api/subscriptions/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customId, status } = body

    if (!customId || status !== 'success') {
      return NextResponse.json({ ok: false })
    }

    const intentSnap = await adminDb.collection('subscription_intents').doc(customId).get()
    if (!intentSnap.exists) return NextResponse.json({ ok: false })

    const intent = intentSnap.data()!
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + intent.durationDays)

    // Activer l abonnement
    await adminDb.collection('subscriptions').doc(intent.userId).set({
      userId: intent.userId,
      planId: intent.planId,
      planName: intent.planName,
      amount: intent.amount,
      currency: intent.currency,
      status: 'active',
      customId,
      startedAt: FieldValue.serverTimestamp(),
      expiresAt,
      updatedAt: FieldValue.serverTimestamp(),
    })

    // Mettre a jour l intent
    await adminDb.collection('subscription_intents').doc(customId).update({
      status: 'success',
      activatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}