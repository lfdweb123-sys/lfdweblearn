// app/admin/courses/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { queryDocuments, updateDocument, deleteDocument } from '@/lib/firebase/firestore'
import { orderBy } from 'firebase/firestore'
import type { Course } from '@/types'
import { formatPrice } from '@/lib/utils'
import { BookOpen, Search, Eye, EyeOff, Trash2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [filtered, setFiltered] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await queryDocuments<Course>('courses', [
          orderBy('createdAt', 'desc'),
        ])
        setCourses(data)
        setFiltered(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  useEffect(() => {
    let result = courses
    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((c) => c.title.toLowerCase().includes(q))
    }
    setFiltered(result)
  }, [search, statusFilter, courses])

  const togglePublish = async (course: Course) => {
    const newStatus = course.status === 'published' ? 'draft' : 'published'
    try {
      await updateDocument('courses', course.id!, { status: newStatus })
      setCourses((prev) => prev.map((c) => c.id === course.id ? { ...c, status: newStatus } : c))
      toast.success(newStatus === 'published' ? 'Formation publiee' : 'Formation depubliee')
    } catch {
      toast.error('Erreur')
    }
  }

  const deleteCourse = async (courseId: string) => {
    if (!confirm('Supprimer cette formation ?')) return
    try {
      await deleteDocument('courses', courseId)
      setCourses((prev) => prev.filter((c) => c.id !== courseId))
      toast.success('Formation supprimee')
    } catch {
      toast.error('Erreur')
    }
  }

  const publishedCount = courses.filter((c) => c.status === 'published').length
  const draftCount = courses.filter((c) => c.status === 'draft').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Toutes les formations</h1>
        <p className="text-slate-500 text-sm mt-1">{courses.length} formation{courses.length > 1 ? 's' : ''} au total</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: courses.length, color: 'bg-sky-50 text-sky-600' },
          { label: 'Publiees', value: publishedCount, color: 'bg-green-50 text-green-600' },
          { label: 'Brouillons', value: draftCount, color: 'bg-slate-50 text-slate-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une formation..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {(['all', 'published', 'draft'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              {s === 'all' ? 'Tout' : s === 'published' ? 'Publiees' : 'Brouillons'}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse h-16 bg-slate-50 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Aucune formation trouvee</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Formation', 'Prix', 'Lecons', 'Statut', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-slate-400 px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50 transition-all">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-sky-50 flex-shrink-0">
                          {course.thumbnail ? (
                            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen size={16} className="text-sky-300" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800 line-clamp-1">{course.title}</p>
                          <p className="text-xs text-slate-400">{course.instructorId?.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={'text-sm font-semibold ' + (course.price === 0 ? 'text-green-600' : 'text-slate-800')}>
                        {course.price === 0 ? 'Gratuit' : formatPrice(course.price, course.currency)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">
                      {course.totalLessons || 0}
                    </td>
                    <td className="px-5 py-3">
                      <span className={'text-xs px-2.5 py-1 rounded-full font-medium ' + (
                        course.status === 'published'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                      )}>
                        {course.status === 'published' ? 'Publiee' : 'Brouillon'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => togglePublish(course)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-all"
                          title={course.status === 'published' ? 'Depublier' : 'Publier'}
                        >
                          {course.status === 'published'
                            ? <EyeOff size={15} className="text-slate-400" />
                            : <Eye size={15} className="text-sky-500" />
                          }
                        </button>
                        <button
                          onClick={() => deleteCourse(course.id!)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-all"
                          title="Supprimer"
                        >
                          <Trash2 size={15} className="text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}