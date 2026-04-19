import { adminDb } from '@/lib/firebase/admin'
import { notFound } from 'next/navigation'
import type { Instructor, Course } from '@/types'
import Link from 'next/link'
import { BookOpen, Play, Globe, Clock, Shield, Award } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface Props {
  params: Promise<{ domain: string }>
}

export default async function InstructorPublicPage({ params }: Props) {
  const { domain: slug } = await params

  try {
    const instructorSnap = await adminDb
      .collection('instructors')
      .where('slug', '==', slug)
      .limit(1)
      .get()

    if (instructorSnap.empty) notFound()

    const instructorData = instructorSnap.docs[0].data() as Instructor
    const instructorId = instructorSnap.docs[0].id

    const coursesSnap = await adminDb
      .collection('courses')
      .where('instructorId', '==', instructorId)
      .where('status', '==', 'published')
      .get()

    const courses = coursesSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Course[]

    const primary = instructorData.branding?.primaryColor || '#0284c7'
    const secondary = instructorData.branding?.secondaryColor || '#f97316'
    const displayName = instructorData.branding?.displayName || 'Formateur'
    const bio = instructorData.branding?.bio || ''
    const logo = instructorData.branding?.logo || null
    const coverImage = instructorData.branding?.coverImage || null
    const ROOT = 'https://lfdweblearn.com'

    return (
      <div className="min-h-screen bg-slate-50">

        {/* ── Hero ─────────────────────────────────────── */}
        <div className="relative">

          {/* Banniere — contenue, ne deborde pas sur la page */}
          <div
            className="w-full h-56 sm:h-72 relative overflow-hidden"
            style={{
              background: coverImage
                ? undefined
                : 'linear-gradient(135deg, ' + primary + ' 0%, ' + primary + 'cc 100%)',
            }}
          >
            {coverImage && (
              <img
                src={coverImage}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )}
            {/* Overlay sur la banniere uniquement */}
            <div
              className="absolute inset-0"
              style={{ backgroundColor: primary + '55' }}
            />
          </div>

          {/* Card formateur superposee */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 px-4">
            <div className="max-w-5xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden border-4 border-white shadow-lg"
                  style={{ backgroundColor: primary }}
                >
                  {logo ? (
                    <img src={logo} alt={displayName} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-3xl font-bold text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{displayName}</h1>
                  {bio && <p className="text-slate-500 text-sm mt-1 line-clamp-2">{bio}</p>}
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <BookOpen size={13} />
                      {courses.length} formation{courses.length > 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Shield size={13} />
                      Formateur certifie LFD
                    </span>
                  </div>
                </div>
                <div
                  className="flex-shrink-0 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ backgroundColor: secondary }}
                >
                  {courses.length} formation{courses.length > 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Formations ───────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-800">Formations disponibles</h2>
            <span className="text-sm text-slate-400">{courses.length} formation{courses.length > 1 ? 's' : ''}</span>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: primary + '15' }}
              >
                <BookOpen size={28} style={{ color: primary }} />
              </div>
              <p className="text-slate-600 font-semibold">Aucune formation disponible</p>
              <p className="text-slate-400 text-sm mt-1">Revenez bientot !</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col"
                >
                  <div className="relative h-48 overflow-hidden bg-slate-100 flex-shrink-0">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: primary + '15' }}
                      >
                        <BookOpen size={44} style={{ color: primary + '60' }} />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span
                        className="text-xs font-bold px-3 py-1.5 rounded-full text-white shadow-md"
                        style={{ backgroundColor: course.price === 0 ? '#10b981' : secondary }}
                      >
                        {course.price === 0 ? 'Gratuit' : formatPrice(course.price, course.currency)}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <span className="flex items-center gap-1 text-xs bg-black/50 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">
                        {course.accessType === 'lifetime'
                          ? <><Globe size={10} />A vie</>
                          : <><Clock size={10} />{course.accessDuration} jours</>
                        }
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-semibold text-slate-800 mb-1.5 line-clamp-2 text-base leading-snug">
                      {course.title}
                    </h3>
                    {course.shortDescription && (
                      <p className="text-slate-400 text-sm mb-3 line-clamp-2 leading-relaxed">
                        {course.shortDescription}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-4 mt-auto pt-3 border-t border-slate-50">
                      <span className="flex items-center gap-1">
                        <Play size={11} />
                        {course.totalLessons || 0} lecon{(course.totalLessons || 0) > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Award size={11} />
                        Certificat inclus
                      </span>
                    </div>
                    <Link
                      href={ROOT + '/courses?course=' + course.id + '&instructor=' + slug}
                      className="block w-full text-center text-white font-semibold py-3 rounded-xl text-sm transition-all hover:opacity-90 active:scale-95"
                      style={{ backgroundColor: primary }}
                    >
                      {course.price === 0 ? "S'inscrire gratuitement" : 'Acheter - ' + formatPrice(course.price, course.currency)}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ───────────────────────────────────── */}
        <footer className="border-t border-slate-200 bg-white py-6">
          <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: primary }}
              >
                <BookOpen size={13} className="text-white" />
              </div>
              <span className="font-bold text-sm">
                <span style={{ color: primary }}>LFD</span>
                <span className="text-orange-500"> Web Learn</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs">Plateforme de formation en ligne pour l Afrique</p>
            <Link
              href={ROOT}
              className="text-xs font-medium hover:underline"
              style={{ color: primary }}
            >
              Creer ma formation →
            </Link>
          </div>
        </footer>
      </div>
    )
  } catch (error) {
    console.error('Erreur page formateur:', error)
    notFound()
  }
}