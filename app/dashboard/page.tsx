// app/dashboard/page.tsx
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { queryDocuments } from '@/lib/firebase/firestore'
import { where, orderBy } from 'firebase/firestore'
import { useContentProtection } from '@/hooks/useContentProtection'
import { useRouter } from 'next/navigation'
import { logout } from '@/lib/firebase/auth'
import type { Enrollment, Course } from '@/types'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  BookOpen, CheckCircle, Lock, Play,
  TrendingUp, User, LogOut, Settings,
  ChevronRight, Plus, Award, Shield
} from 'lucide-react'

interface EnrolledCourse extends Enrollment {
  courseData?: Course
}

export default function DashboardPage() {
  const { userProfile, firebaseUser, isInstructor } = useAuth()
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<EnrolledCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [activatingInstructor, setActivatingInstructor] = useState(false)

  useContentProtection({ disableRightClick: true })

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!firebaseUser?.uid) return
      try {
        const data = await queryDocuments<Enrollment>('enrollments', [
          where('userId', '==', firebaseUser.uid),
          orderBy('enrolledAt', 'desc'),
        ])
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

  const handleLogout = async () => {
    await logout()
    router.push('/')
    toast.success('Deconnecte')
  }

  const activateInstructor = async () => {
    setActivatingInstructor(true)
    try {
      const res = await fetch('/api/instructor/activate', {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) {
        toast.success('Compte formateur active !')
        window.location.href = '/instructor'
      } else {
        toast.error("Erreur lors de l'activation")
      }
    } catch {
      toast.error('Erreur reseau')
    } finally {
      setActivatingInstructor(false)
    }
  }

  const activeCount = enrollments.filter((e) => e.status === 'active').length
  const completedCount = enrollments.filter((e) => e.progress.percentage === 100).length
  const avgProgress =
    enrollments.length > 0
      ? Math.round(
          enrollments.reduce((s, e) => s + e.progress.percentage, 0) /
            enrollments.length
        )
      : 0

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sky-600 rounded-xl flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <span className="font-bold text-base hidden sm:block">
              <span className="text-sky-600">LFD</span>
              <span className="text-orange-500"> Web Learn</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">

            {/* Badge role — cliquable selon le role */}
            {userProfile?.role === 'admin' ? (
              <Link
                href="/admin"
                className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-red-50 text-red-700 hover:bg-red-100 transition-all"
              >
                <Shield size={12} />
                Admin
              </Link>
            ) : userProfile?.role === 'instructor' ? (
              <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-sky-50 text-sky-700">
                <User size={12} />
                Formateur
              </span>
            ) : (
              <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">
                <User size={12} />
                Eleve
              </span>
            )}

            {/* Lien admin mobile */}
            {userProfile?.role === 'admin' && (
              <Link
                href="/admin"
                className="sm:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 hover:bg-red-100 transition-all"
              >
                <Shield size={16} className="text-red-600" />
              </Link>
            )}

            {/* Espace formateur desktop */}
            {isInstructor && (
              <Link
                href="/instructor"
                className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 px-3 py-1.5 rounded-lg transition-all"
              >
                <Settings size={12} />
                Espace formateur
              </Link>
            )}

            {/* Espace formateur mobile */}
            {isInstructor && (
              <Link
                href="/instructor"
                className="sm:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-sky-600 hover:bg-sky-700 transition-all"
              >
                <Settings size={16} className="text-white" />
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-500 border border-slate-200 px-3 py-1.5 rounded-lg transition-all"
            >
              <LogOut size={12} />
              <span className="hidden sm:block">Deconnexion</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Bienvenue */}
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
              label: 'Terminees',
              value: completedCount,
              icon: CheckCircle,
              color: 'text-green-600 bg-green-50',
            },
            {
              label: 'Progression moyenne',
              value: avgProgress + '%',
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
                  <div className={'w-9 h-9 rounded-xl flex items-center justify-center ' + stat.color}>
                    <Icon size={18} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              </div>
            )
          })}
        </div>

        {/* Devenir formateur si role student */}
        {userProfile?.role === 'student' && (
          <div className="bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg mb-1">
                Devenez formateur sur LFD Web Learn
              </h3>
              <p className="text-sky-100 text-sm">
                Partagez vos connaissances et generez des revenus en Afrique
              </p>
            </div>
            <button
              onClick={activateInstructor}
              disabled={activatingInstructor}
              className="flex-shrink-0 flex items-center gap-2 bg-white text-sky-600 hover:bg-sky-50 font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 text-sm"
            >
              {activatingInstructor ? (
                <span className="animate-spin h-4 w-4 border-2 border-sky-600 border-t-transparent rounded-full" />
              ) : (
                <>
                  <Award size={16} />
                  Activer le mode formateur
                </>
              )}
            </button>
          </div>
        )}

        {/* Mes formations */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Mes formations</h2>
            <Link
              href="/courses"
              className="text-sm text-sky-600 hover:underline flex items-center gap-1"
            >
              Voir le catalogue
              <ChevronRight size={14} />
            </Link>
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
                href="/courses"
                className="inline-flex items-center gap-2 bg-sky-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-sky-700 transition-all"
              >
                <Plus size={16} />
                Voir les formations
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {enrollments.map((enrollment) => {
                const course = enrollment.courseData
                const isExpired = enrollment.status === 'expired'
                const firstLesson = course?.modules?.[0]?.lessons?.[0]?.id
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
                            Expire
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-sky-500 rounded-full transition-all"
                            style={{ width: enrollment.progress.percentage + '%' }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {enrollment.progress.percentage}%
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 mt-1">
                        {enrollment.progress.completedLessons?.length || 0}
                        {' / '}
                        {course?.totalLessons || 0} lecons
                        {enrollment.accessType === 'limited' &&
                          enrollment.expiresAt && (
                            <span className="ml-2">
                              - Expire le{' '}
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
                        href={'/learn/' + enrollment.courseId + '/' + (lastLesson || firstLesson)}
                        className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-xs font-medium transition-all flex-shrink-0"
                      >
                        <Play size={14} />
                        {enrollment.progress.percentage > 0 ? 'Continuer' : 'Commencer'}
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
    </div>
  )
}