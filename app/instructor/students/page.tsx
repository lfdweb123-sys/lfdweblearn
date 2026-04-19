// app/instructor/students/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { queryDocuments } from '@/lib/firebase/firestore'
import { where, orderBy } from 'firebase/firestore'
import type { Enrollment } from '@/types'
import { Users, Search, BookOpen, TrendingUp, Clock, CheckCircle } from 'lucide-react'

interface StudentData extends Enrollment {
  userName?: string
  userEmail?: string
  courseTitle?: string
}

export default function InstructorStudentsPage() {
  const { userProfile } = useAuth()
  const [students, setStudents] = useState<StudentData[]>([])
  const [filtered, setFiltered] = useState<StudentData[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStudents = async () => {
      if (!userProfile?.id) return
      try {
        const enrollments = await queryDocuments<Enrollment>('enrollments', [
          where('instructorId', '==', userProfile.id),
          orderBy('enrolledAt', 'desc'),
        ])

        // Enrichir avec les données utilisateurs et formations
        const enriched = await Promise.all(
          enrollments.map(async (enrollment) => {
            try {
              const [users, courses] = await Promise.all([
                queryDocuments<{ id: string; displayName: string; email: string }>('users', [
                  where('__name__', '==', enrollment.userId),
                ]),
                queryDocuments<{ id: string; title: string }>('courses', [
                  where('__name__', '==', enrollment.courseId),
                ]),
              ])
              return {
                ...enrollment,
                userName: users[0]?.displayName || 'Utilisateur',
                userEmail: users[0]?.email || '',
                courseTitle: courses[0]?.title || 'Formation',
              }
            } catch {
              return enrollment
            }
          })
        )
        setStudents(enriched)
        setFiltered(enriched)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchStudents()
  }, [userProfile?.id])

  useEffect(() => {
    if (!search.trim()) { setFiltered(students); return }
    const q = search.toLowerCase()
    setFiltered(
      students.filter(
        (s) =>
          s.userName?.toLowerCase().includes(q) ||
          s.userEmail?.toLowerCase().includes(q) ||
          s.courseTitle?.toLowerCase().includes(q)
      )
    )
  }, [search, students])

  const activeCount = students.filter((s) => s.status === 'active').length
  const expiredCount = students.filter((s) => s.status === 'expired').length
  const completedCount = students.filter((s) => s.progress.percentage === 100).length

  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Mes élèves</h1>
        <p className="text-slate-500 text-sm mt-1">
          {students.length} élève{students.length > 1 ? 's' : ''} inscrits
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Actifs', value: activeCount, icon: Users, color: 'bg-sky-50 text-sky-600' },
          { label: 'Terminé', value: completedCount, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
          { label: 'Expirés', value: expiredCount, icon: Clock, color: 'bg-red-50 text-red-600' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-500">{stat.label}</span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <Icon size={18} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un élève ou une formation..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
        />
      </div>

      {/* Liste */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4 items-center">
                <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-40" />
                  <div className="h-3 bg-slate-100 rounded w-56" />
                </div>
                <div className="h-3 bg-slate-100 rounded w-20" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Aucun élève trouvé</p>
            <p className="text-slate-400 text-sm mt-1">
              Vos élèves apparaîtront ici après leur inscription
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Élève', 'Formation', 'Progression', 'Statut', 'Inscrit le'].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-slate-400 px-5 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-all">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 font-bold text-sm flex-shrink-0">
                          {student.userName?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{student.userName}</p>
                          <p className="text-xs text-slate-400">{student.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <BookOpen size={14} className="text-slate-300 flex-shrink-0" />
                        <span className="text-sm text-slate-600 truncate max-w-[160px]">
                          {student.courseTitle}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-sky-500 rounded-full"
                            style={{ width: student.progress.percentage + '%' }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">
                          {student.progress.percentage}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        student.status === 'active'
                          ? 'bg-green-50 text-green-700'
                          : student.status === 'expired'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {student.status === 'active' ? 'Actif'
                          : student.status === 'expired' ? 'Expiré'
                          : 'Annulé'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">
                      {student.enrolledAt?.seconds
                        ? new Date(student.enrolledAt.seconds * 1000).toLocaleDateString('fr-FR')
                        : '—'}
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