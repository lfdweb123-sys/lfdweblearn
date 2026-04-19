// app/courses/page.tsx
import { adminDb } from '@/lib/firebase/admin'
import type { Course } from '@/types'
import CoursesClient from './CoursesClient'

export const metadata = { title: 'Formations — LFD Web Learn' }

export default async function CoursesPage() {
  let courses: Course[] = []

  try {
    const snap = await adminDb
      .collection('courses')
      .where('status', '==', 'published')
      .get()
    courses = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Course[]
  } catch {
    courses = []
  }

  return <CoursesClient courses={courses} />
}