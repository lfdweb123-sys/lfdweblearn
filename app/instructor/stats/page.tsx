// app/instructor/stats/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { queryDocuments } from '@/lib/firebase/firestore'
import { where, orderBy } from 'firebase/firestore'
import type { Course, Enrollment, Payment } from '@/types'
import { formatPrice } from '@/lib/utils'
import {
  TrendingUp, Users, BookOpen, DollarSign,
  BarChart3, Award, Clock, CheckCircle
} from 'lucide-react'

export default function InstructorStatsPage() {
  const { userProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [payments, setPayments] = useState<Payment[]>([])

  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile?.id) return
      try {
        const [c, e, p] = await Promise.all([
          queryDocuments<Course>('courses', [
            where('instructorId', '==', userProfile.id),
          ]),
          queryDocuments<Enrollment>('enrollments', [
            where('instructorId', '==', userProfile.id),
          ]),
          queryDocuments<Payment>('payments', [
            where('instructorId', '==', userProfile.id),
            where('status', '==', 'success'),
            orderBy('createdAt', 'desc'),
          ]),
        ])
        setCourses(c)
        setEnrollments(e)
        setPayments(p)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [userProfile?.id])

  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0)
  const publishedCourses = courses.filter((c) => c.status === 'published').length
  const activeStudents = enrollments.filter((e) => e.status === 'active').length
  const completedStudents = enrollments.filter((e) => e.progress.percentage === 100).length
  const avgProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((s, e) => s + e.progress.percentage, 0) / enrollments.length)
    : 0

  // Revenus par formation
  const revenuePerCourse = courses.map((course) => {
    const coursePayments = payments.filter((p) => p.courseId === course.id)
    const courseEnrollments = enrollments.filter((e) => e.courseId === course.id)
    return {
      id: course.id,
      title: course.title,
      revenue: coursePayments.reduce((s, p) => s + p.amount, 0),
      students: courseEnrollments.length,
      currency: course.currency,
      status: course.status,
    }
  }).sort((a, b) => b.revenue - a.revenue)

  const STATS = [
    {
      label: 'Revenus totaux',
      value: formatPrice(totalRevenue, 'XOF'),
      icon: DollarSign,
      color: 'bg-green-50 text-green-600',
      border: 'border-green-100',
    },
    {
      label: 'Élèves actifs',
      value: activeStudents,
      icon: Users,
      color: 'bg-sky-50 text-sky-600',
      border: 'border-sky-100',
    },
    {
      label: 'Formations publiées',
      value: publishedCourses,
      icon: BookOpen,
      color: 'bg-purple-50 text-purple-600',
      border: 'border-purple-100',
    },
    {
      label: 'Progression moyenne',
      value: avgProgress + '%',
      icon: TrendingUp,
      color: 'bg-orange-50 text-orange-600',
      border: 'border-orange-100',
    },
    {
      label: 'Formations terminées',
      value: completedStudents,
      icon: CheckCircle,
      color: 'bg-teal-50 text-teal-600',
      border: 'border-teal-100',
    },
    {
      label: 'Paiements reçus',
      value: payments.length,
      icon: Award,
      color: 'bg-amber-50 text-amber-600',
      border: 'border-amber-100',
    },
  ]

  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Statistiques</h1>
        <p className="text-slate-500 text-sm mt-1">
          Vue d'ensemble de vos performances
        </p>
      </div>

      {/* Stats cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {STATS.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className={`bg-white rounded-2xl border p-5 hover:shadow-md transition-all ${stat.border}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-500">{stat.label}</span>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.color}`}>
                    <Icon size={17} />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-slate-800">{stat.value}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Revenus par formation */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center gap-2 p-5 border-b border-slate-100">
          <BarChart3 size={18} className="text-sky-500" />
          <h2 className="font-semibold text-slate-800">Performances par formation</h2>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse h-14 bg-slate-50 rounded-xl" />
            ))}
          </div>
        ) : revenuePerCourse.length === 0 ? (
          <div className="p-12 text-center">
            <BarChart3 size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Aucune donnée disponible</p>
            <p className="text-slate-400 text-sm mt-1">
              Créez et publiez des formations pour voir vos statistiques
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {revenuePerCourse.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-all">
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={18} className="text-sky-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                      item.status === 'published'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {item.status === 'published' ? 'Publié' : 'Brouillon'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {item.students} élève{item.students > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-slate-800">
                    {formatPrice(item.revenue, item.currency)}
                  </p>
                  <p className="text-xs text-slate-400">revenus</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Derniers paiements */}
      {payments.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center gap-2 p-5 border-b border-slate-100">
            <DollarSign size={18} className="text-green-500" />
            <h2 className="font-semibold text-slate-800">Derniers paiements reçus</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {payments.slice(0, 8).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                    <CheckCircle size={15} className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs font-mono text-slate-500">
                      {payment.feexpayRef || payment.id?.slice(0, 12) + '...'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {payment.createdAt?.seconds
                        ? new Date(payment.createdAt.seconds * 1000).toLocaleDateString('fr-FR')
                        : '—'}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-bold text-green-600">
                  +{formatPrice(payment.amount, payment.currency)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}