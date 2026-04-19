import { adminDb } from '@/lib/firebase/admin'
import { notFound } from 'next/navigation'
import type { Instructor, Course } from '@/types'
import Link from 'next/link'
import { BookOpen, Play, Globe, Clock, User } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface Props {
  params: { domain: string }
}

export default async function InstructorPublicPage({ params }: Props) {
  const slug = params.domain

  const instructorSnap = await adminDb
    .collection('instructors')
    .where('slug', '==', slug)
    .limit(1)
    .get()

  if (instructorSnap.empty) {
    notFound()
  }

  const instructorData = instructorSnap.docs[0].data() as Instructor
  const instructorId = instructorSnap.docs[0].id

  const coursesSnap = await adminDb
    .collection('courses')
    .where('instructorId', '==', instructorId)
    .where('status', '==', 'published')
    .get()

  const courses = coursesSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Course[]

  const primaryColor = instructorData.branding?.primaryColor || '#0284c7'
  const secondaryColor = instructorData.branding?.secondaryColor || '#f97316'
  const displayName = instructorData.branding?.displayName || 'Formateur'
  const bio = instructorData.branding?.bio || ''
  const logo = instructorData.branding?.logo || null
  const coverImage = instructorData.branding?.coverImage || null

  return (
    <div className="min-h-screen bg-slate-50">

      <header style={{ backgroundColor: primaryColor }}>
        {coverImage && (
          <div className="w-full h-48 overflow-hidden">
            <img src={coverImage} alt="Cover" className="w-full h-full object-cover opacity-60" />
          </div>
        )}
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            {logo ? (
              <img src={logo} alt={displayName} className="w-16 h-16 rounded-2xl object-contain bg-white p-1" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <User size={28} className="text-white" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">{displayName}</h1>
              {bio && <p className="text-white/80 text-sm mt-1 max-w-xl">{bio}</p>}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">
            Formations disponibles
            <span className="ml-2 text-sm font-normal text-slate-400">
              ({courses.length})
            </span>
          </h2>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <BookOpen size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Aucune formation disponible</p>
            <p className="text-slate-400 text-sm mt-1">Revenez bientot !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all group">
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-sky-50">
                      <BookOpen size={40} className="text-sky-200" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={'text-xs font-bold px-3 py-1.5 rounded-full text-white shadow-md ' + (course.price === 0 ? 'bg-green-500' : 'bg-orange-500')}>
                      {course.price === 0 ? 'Gratuit' : formatPrice(course.price, course.currency)}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-slate-800 mb-1.5 line-clamp-2">{course.title}</h3>
                  {course.shortDescription && (
                    <p className="text-slate-500 text-sm mb-3 line-clamp-2">{course.shortDescription}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Play size={11} />
                      {course.totalLessons || 0} lecons
                    </span>
                    <span className="flex items-center gap-1">
                      {course.accessType === 'lifetime' ? (
                        <><Globe size={11} />A vie</>
                      ) : (
                        <><Clock size={11} />{course.accessDuration}j</>
                      )}
                    </span>
                  </div>
                  <Link
                    href={'/register?course=' + course.id + '&instructor=' + slug}
                    className="block w-full text-center text-white font-semibold py-2.5 rounded-xl text-sm transition-all hover:opacity-90"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    {course.price === 0 ? "S'inscrire gratuitement" : 'Acheter la formation'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="mt-20 border-t border-slate-200 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">
            Propulse par <a href="https://lfdweblearn.com" className="text-sky-600 hover:underline font-medium">LFD Web Learn</a>
          </p>
        </div>
      </footer>
    </div>
  )
}