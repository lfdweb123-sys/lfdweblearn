// app/dashboard/page.tsx
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { queryDocuments } from '@/lib/firebase/firestore'
import { where, orderBy } from 'firebase/firestore'
import { useContentProtection } from '@/hooks/useContentProtection'
import type { Enrollment, Course } from '@/types'
import Link from 'next/link'
import {
  BookOpen, Clock, CheckCircle,
  Lock, Play, TrendingUp
} from 'lucide-react'

interface EnrolledCourse extends Enrollment {
  courseData?: Course
}

export default function DashboardPage() {
  const { userProfile, firebaseUser } = useAuth()
  const [enrollments, setEnrollments] = useState<EnrolledCourse[]>([])
  const [loading, setLoading] = useState(true)

  useContentProtection({ disableRightClick: true })

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!firebaseUser?.uid) return
      try {
        const data = await queryDocuments<Enrollment>('enrollments', [
          where('userId', '==', firebaseUser.uid),
          orderBy('enrolledAt', 'desc'),
        ])

        // Enrichir avec les données des formations
        const enriched = await Promise.all(
          data.map(async (enrollment) => {
            try {
              const courses = await queryDocuments<Course>('courses', [
                where('__name__', '==', enrollment.courseId),
              ])
              return { ...enrollment, courseData: courses[0] }
            } catch {
              return enrollment
            }
          })
        )
        setEnrollments(enriched)
      } catch (error) {
        console.error('Erreur chargement formations:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchEnrollments()
  }, [firebaseUser?.uid])

  const activeCount = enrollments.filter((e) => e.status === 'active').length
  const completedCount = enrollments.filter(
    (e) => e.progress.percentage === 100
  ).length
  const avgProgress =
    enrollments.length > 0
      ? Math.round(
          enrollments.reduce((s, e) => s + e.progress.percentage, 0) /
            enrollments.length
        )
      : 0

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Bonjour, {userProfile?.displayName?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Continuez votre apprentissage
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Formations actives',
            value: activeCount,
            icon: BookOpen,
            color: 'text-sky-600 bg-sky-50',
          },
          {
            label: 'Terminées',
            value: completedCount,
            icon: CheckCircle,
            color: 'text-green-600 bg-green-50',
          },
          {
            label: 'Progression moyenne',
            value: `${avgProgress}%`,
            icon: TrendingUp,
            color: 'text-orange-600 bg-orange-50',
          },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-slate-100 p-5"
            >
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

      {/* Formations */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Mes formations</h2>
        </div>

        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="w-16 h-16 bg-slate-100 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-48" />
                  <div className="h-3 bg-slate-100 rounded w-32" />
                  <div className="h-2 bg-slate-100 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Aucune formation</p>
            <p className="text-slate-400 text-sm mb-4">
              Explorez notre catalogue de formations
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-sky-700 transition-all"
            >
              Voir les formations
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {enrollments.map((enrollment) => {
              const course = enrollment.courseData
              const isExpired = enrollment.status === 'expired'
              const firstLesson =
                course?.modules?.[0]?.lessons?.[0]?.id
              const lastLesson = enrollment.progress.lastLessonId

              return (
                <div
                  key={enrollment.id}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-all"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {course?.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen size={22} className="text-sky-300" />
                    )}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-slate-800 truncate text-sm">
                        {course?.title || 'Formation'}
                      </p>
                      {isExpired && (
                        <span className="flex items-center gap-1 text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full flex-shrink-0">
                          <Lock size={10} />
                          Expiré
                        </span>
                      )}
                    </div>

                    {/* Barre de progression */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full transition-all"
                          style={{
                            width: `${enrollment.progress.percentage}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {enrollment.progress.percentage}%
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1">
                      {enrollment.progress.completedLessons?.length || 0} /{' '}
                      {course?.totalLessons || 0} leçons
                      {enrollment.accessType === 'limited' &&
                        enrollment.expiresAt && (
                          <span className="ml-2">
                            · Expire le{' '}
                            {new Date(
                              enrollment.expiresAt.seconds * 1000
                            ).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                    </p>
                  </div>

                  {/* Bouton */}
                  {!isExpired && (lastLesson || firstLesson) ? (
                    <Link
                      href={`/learn/${enrollment.courseId}/${lastLesson || firstLesson}`}
                      className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-xs font-medium transition-all flex-shrink-0"
                    >
                      <Play size={14} />
                      {enrollment.progress.percentage > 0
                        ? 'Continuer'
                        : 'Commencer'}
                    </Link>
                  ) : (
                    <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 flex-shrink-0">
                      <Lock size={16} className="text-slate-400" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}