// app/api/media/signed-url/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ url: '' })
}