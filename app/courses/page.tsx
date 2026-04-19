// app/courses/page.tsx
import { adminDb } from '@/lib/firebase/admin'
import type { Course, Instructor } from '@/types'
import Link from 'next/link'
import { BookOpen, Play, Globe, Clock, ArrowLeft } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sky-600 rounded-xl flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <span className="font-bold">
              <span className="text-sky-600">LFD</span>
              <span className="text-orange-500"> Web Learn</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-600 hover:text-sky-600 transition-colors">Connexion</Link>
            <Link href="/register" className="text-sm font-semibold bg-sky-600 text-white px-4 py-2 rounded-xl hover:bg-sky-700 transition-all">
              S'inscrire
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-sky-600 mb-4 transition-colors">
            <ArrowLeft size={16} />
            Retour
          </Link>
          <h1 className="text-3xl font-bold text-slate-800">Toutes les formations</h1>
          <p className="text-slate-500 mt-1">{courses.length} formation{courses.length > 1 ? 's' : ''} disponible{courses.length > 1 ? 's' : ''}</p>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <BookOpen size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Aucune formation disponible pour le moment</p>
            <p className="text-slate-400 text-sm mt-1">Revenez bientôt !</p>
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
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full text-white shadow-md ${course.price === 0 ? 'bg-green-500' : 'bg-orange-500'}`}>
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
                    <span className="flex items-center gap-1"><Play size={11} />{course.totalLessons || 0} lecons</span>
                    <span className="flex items-center gap-1">
                      {course.accessType === 'lifetime' ? <><Globe size={11} />A vie</> : <><Clock size={11} />{course.accessDuration}j</>}
                    </span>
                  </div>
                  <Link
                    href={'/register'}
                    className="block w-full text-center bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all"
                  >
                    {course.price === 0 ? "S'inscrire gratuitement" : 'Acheter la formation'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}