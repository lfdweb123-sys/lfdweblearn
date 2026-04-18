// app/api/payments/initiate/route.ts
import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ message: 'initiate payment' })
}