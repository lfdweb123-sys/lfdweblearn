// app/api/payments/webhook/route.ts
import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ received: true })
}