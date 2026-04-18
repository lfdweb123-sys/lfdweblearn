// app/instructor/page.tsx
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { queryDocuments } from '@/lib/firebase/firestore'
import { where } from 'firebase/firestore'
import { BookOpen, Users, TrendingUp, DollarSign, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Course, Enrollment, Payment } from '@/types'
import { formatPrice } from '@/lib/utils'

interface Stats {
  totalCourses: number
  totalStudents: number
  totalRevenue: number
  publishedCourses: number
}

export default function InstructorDashboard() {
  const { userProfile } = useAuth()
  const [stats, setStats] = useState<Stats>({
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    publishedCourses: 0,
  })
  const [recentCourses, setRecentCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userProfile?.id) return

    const fetchStats = async () => {
      try {
        const [courses, enrollments, payments] = await Promise.all([
          queryDocuments<Course>('courses', [
            where('instructorId', '==', userProfile.id),
          ]),
          queryDocuments<Enrollment>('enrollments', [
            where('instructorId', '==', userProfile.id),
          ]),
          queryDocuments<Payment>('payments', [
            where('instructorId', '==', userProfile.id),
            where('status', '==', 'success'),
          ]),
        ])

        const revenue = payments.reduce((sum, p) => sum + p.amount, 0)
        const published = courses.filter((c) => c.status === 'published').length

        setStats({
          totalCourses: courses.length,
          totalStudents: enrollments.length,
          totalRevenue: revenue,
          publishedCourses: published,
        })

        setRecentCourses(courses.slice(0, 3))
      } catch (error) {
        console.error('Erreur chargement stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [userProfile?.id])

  const statCards = [
    {
      label: 'Formations',
      value: stats.totalCourses,
      sub: `${stats.publishedCourses} publiées`,
      icon: BookOpen,
      color: 'bg-sky-50 text-sky-600',
      border: 'border-sky-100',
    },
    {
      label: 'Élèves inscrits',
      value: stats.totalStudents,
      sub: 'Total inscriptions',
      icon: Users,
      color: 'bg-orange-50 text-orange-600',
      border: 'border-orange-100',
    },
    {
      label: 'Revenus',
      value: formatPrice(stats.totalRevenue),
      sub: 'Paiements confirmés',
      icon: DollarSign,
      color: 'bg-green-50 text-green-600',
      border: 'border-green-100',
    },
    {
      label: 'Croissance',
      value: '+0%',
      sub: 'Ce mois-ci',
      icon: TrendingUp,
      color: 'bg-purple-50 text-purple-600',
      border: 'border-purple-100',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Titre */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Tableau de bord
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gérez vos formations et suivez vos performances
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

      {/* Stats cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-24 mb-3" />
              <div className="h-8 bg-slate-100 rounded w-16 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-20" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.label}
                className={`bg-white rounded-2xl p-5 border ${card.border} hover:shadow-md transition-all`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-500">
                    {card.label}
                  </span>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.color}`}>
                    <Icon size={18} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800">
                  {card.value}
                </p>
                <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Formations récentes */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Formations récentes</h2>
          <Link
            href="/instructor/courses"
            className="text-sm text-sky-600 hover:underline flex items-center gap-1"
          >
            Voir tout <ArrowRight size={14} />
          </Link>
        </div>

        {recentCourses.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Aucune formation</p>
            <p className="text-slate-400 text-sm mb-4">
              Créez votre première formation
            </p>
            <Link
              href="/instructor/courses/new"
              className="inline-flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-sky-700 transition-all"
            >
              <Plus size={16} />
              Créer une formation
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentCourses.map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                    <BookOpen size={18} className="text-sky-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {course.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      {course.totalLessons || 0} leçons ·{' '}
                      {course.price === 0
                        ? 'Gratuit'
                        : formatPrice(course.price, course.currency)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      course.status === 'published'
                        ? 'bg-green-50 text-green-700'
                        : course.status === 'draft'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-orange-50 text-orange-700'
                    }`}
                  >
                    {course.status === 'published'
                      ? 'Publié'
                      : course.status === 'draft'
                      ? 'Brouillon'
                      : 'Archivé'}
                  </span>
                  <Link
                    href={`/instructor/courses/${course.id}/edit`}
                    className="text-xs text-sky-600 hover:underline"
                  >
                    Modifier
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Devenir formateur (si rôle student) */}
      {userProfile?.role === 'student' && (
        <div className="bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl p-6 text-white">
          <h3 className="font-bold text-lg mb-1">
            Devenez formateur sur LFD Web Learn
          </h3>
          <p className="text-sky-100 text-sm mb-4">
            Partagez vos connaissances et générez des revenus en Afrique
          </p>
          <button className="bg-white text-sky-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-sky-50 transition-all">
            Activer le mode formateur
          </button>
        </div>
      )}
    </div>
  )
}