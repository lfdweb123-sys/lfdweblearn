// app/instructor/courses/page.tsx
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { queryDocuments } from '@/lib/firebase/firestore'
import { where, orderBy } from 'firebase/firestore'
import { BookOpen, Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import type { Course } from '@/types'
import { formatPrice } from '@/lib/utils'
import { updateDocument, deleteDocument } from '@/lib/firebase/firestore'
import toast from 'react-hot-toast'

export default function InstructorCoursesPage() {
  const { userProfile } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCourses = async () => {
    if (!userProfile?.id) return
    try {
      const data = await queryDocuments<Course>('courses', [
        where('instructorId', '==', userProfile.id),
        orderBy('createdAt', 'desc'),
      ])
      setCourses(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCourses() }, [userProfile?.id])

  const togglePublish = async (course: Course) => {
    const newStatus = course.status === 'published' ? 'draft' : 'published'
    try {
      await updateDocument('courses', course.id, { status: newStatus })
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, status: newStatus } : c))
      )
      toast.success(newStatus === 'published' ? 'Formation publiée' : 'Formation dépubliée')
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const deleteCourse = async (courseId: string) => {
    if (!confirm('Supprimer cette formation ? Cette action est irréversible.')) return
    try {
      await deleteDocument('courses', courseId)
      setCourses((prev) => prev.filter((c) => c.id !== courseId))
      toast.success('Formation supprimée')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mes formations</h1>
          <p className="text-slate-500 text-sm mt-1">
            {courses.length} formation{courses.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/instructor/courses/new"
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
        >
          <Plus size={16} />
          Nouvelle formation
        </Link>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse">
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-slate-100 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-48" />
                  <div className="h-3 bg-slate-100 rounded w-64" />
                  <div className="h-3 bg-slate-100 rounded w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <BookOpen size={48} className="text-slate-200 mx-auto mb-4" />
          <p className="text-slate-600 font-medium text-lg">Aucune formation</p>
          <p className="text-slate-400 text-sm mb-6">
            Créez votre première formation et commencez à enseigner
          </p>
          <Link
            href="/instructor/courses/new"
            className="inline-flex items-center gap-2 bg-sky-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-sky-700 transition-all"
          >
            <Plus size={16} />
            Créer une formation
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4">
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen size={28} className="text-sky-300" />
                  )}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-800 truncate">
                      {course.title}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                      course.status === 'published'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {course.status === 'published' ? 'Publié' : 'Brouillon'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 truncate mb-2">
                    {course.shortDescription || course.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>{course.totalLessons || 0} leçons</span>
                    <span>
                      {course.price === 0
                        ? 'Gratuit'
                        : formatPrice(course.price, course.currency)}
                    </span>
                    <span>
                      {course.accessType === 'lifetime'
                        ? 'Accès à vie'
                        : `${course.accessDuration} jours`}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => togglePublish(course)}
                    title={course.status === 'published' ? 'Dépublier' : 'Publier'}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
                  >
                    {course.status === 'published' ? (
                      <EyeOff size={16} className="text-slate-400" />
                    ) : (
                      <Eye size={16} className="text-green-500" />
                    )}
                  </button>
                  <Link
                    href={`/instructor/courses/${course.id}/edit`}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-sky-50 hover:border-sky-200 transition-all"
                  >
                    <Pencil size={16} className="text-slate-400" />
                  </Link>
                  <button
                    onClick={() => deleteCourse(course.id)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-200 transition-all"
                  >
                    <Trash2 size={16} className="text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}