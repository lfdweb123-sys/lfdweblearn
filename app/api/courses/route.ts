// app/api/courses/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ courses: [] })
}

export async function POST() {
  return NextResponse.json({ message: 'create course' })
}