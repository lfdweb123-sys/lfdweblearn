// app/(public)/[domain]/page.tsx
import { notFound } from 'next/navigation'
import { adminDb } from '@/lib/firebase/admin'
import type { Instructor, Course } from '@/types'
import PublicInstructorPage from '@/components/public/InstructorPage'

interface Props {
  params: { domain: string }
}

export async function generateMetadata({ params }: Props) {
  try {
    const snap = await adminDb
      .collection('instructors')
      .where('slug', '==', params.domain)
      .limit(1)
      .get()

    if (snap.empty) return { title: 'Formateur introuvable' }

    const instructor = snap.docs[0].data() as Instructor
    return {
      title: `${instructor.branding.displayName} — Formations`,
      description: instructor.branding.bio || 'Formations en ligne',
    }
  } catch {
    return { title: 'LFD Web Learn' }
  }
}

export default async function InstructorPublicRoute({ params }: Props) {
  try {
    // Chercher par slug
    const instructorSnap = await adminDb
      .collection('instructors')
      .where('slug', '==', params.domain)
      .limit(1)
      .get()

    if (instructorSnap.empty) notFound()

    const instructorDoc = instructorSnap.docs[0]
    const instructor = {
      id: instructorDoc.id,
      ...instructorDoc.data(),
    } as Instructor

    // Récupérer les formations publiées
    const coursesSnap = await adminDb
      .collection('courses')
      .where('instructorId', '==', instructorDoc.id)
      .where('status', '==', 'published')
      .get()

    const courses = coursesSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Course[]

    return (
      <PublicInstructorPage
        instructor={instructor}
        courses={courses}
      />
    )
  } catch (error) {
    console.error(error)
    notFound()
  }
}