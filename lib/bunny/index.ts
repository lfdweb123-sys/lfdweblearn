// lib/bunny/index.ts
export const BUNNY_CDN = process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE || ''
export const BUNNY_STREAM_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID || ''

export function getBunnyVideoUrl(videoId: string): string {
  return `https://iframe.mediadelivery.net/embed/${BUNNY_STREAM_LIBRARY_ID}/${videoId}`
}