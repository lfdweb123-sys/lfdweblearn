// app/courses/page.tsx
import { adminDb } from '@/lib/firebase/admin'
import type { Course } from '@/types'
import CoursesClient from './CoursesClient'

export const metadata = { title: 'Formations — LFD Web Learn' }

// Serialiser les objets Firestore pour les Client Components
function serializeCourse(course: any): Course {
  return {
    ...course,
    createdAt: course.createdAt?.seconds
      ? { seconds: course.createdAt.seconds, nanoseconds: course.createdAt.nanoseconds }
      : null,
    updatedAt: course.updatedAt?.seconds
      ? { seconds: course.updatedAt.seconds, nanoseconds: course.updatedAt.nanoseconds }
      : null,
    modules: (course.modules || []).map((module: any) => ({
      ...module,
      lessons: (module.lessons || []).map((lesson: any) => ({
        ...lesson,
        createdAt: lesson.createdAt?.seconds
          ? { seconds: lesson.createdAt.seconds, nanoseconds: lesson.createdAt.nanoseconds }
          : null,
      })),
    })),
  }
}

export default async function CoursesPage() {
  let courses: Course[] = []

  try {
    const snap = await adminDb
      .collection('courses')
      .where('status', '==', 'published')
      .get()
    courses = snap.docs.map((d) => serializeCourse({ id: d.id, ...d.data() }))
  } catch {
    courses = []
  }

  return <CoursesClient courses={courses} />
}