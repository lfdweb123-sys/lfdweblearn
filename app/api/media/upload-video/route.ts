// app/api/media/upload-video/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/middleware/withAuth'

export async function POST(request: NextRequest) {
  const uid = await verifyToken(request)
  if (!uid) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { title } = await request.json()
    const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID!
    const apiKey = process.env.BUNNY_STREAM_API_KEY!

    // Créer la vidéo dans Bunny Stream
    const createRes = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos`,
      {
        method: 'POST',
        headers: {
          AccessKey: apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      }
    )

    const video = await createRes.json()

    // URL d'upload direct
    const uploadUrl = `https://video.bunnycdn.com/library/${libraryId}/videos/${video.guid}`

    return NextResponse.json({
      videoId: video.guid,
      uploadUrl,
    })
  } catch (error) {
    console.error('Erreur Bunny upload:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}