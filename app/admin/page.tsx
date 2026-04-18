// app/admin/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { adminDb } from '@/lib/firebase/admin'
import { queryDocuments } from '@/lib/firebase/firestore'
import { Users, BookOpen, CreditCard, TrendingUp, AlertCircle } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { User, Course, Payment } from '@/types'

interface AdminStats {
  totalUsers: number
  totalInstructors: number
  totalCourses: number
  totalRevenue: number
  pendingPayments: number
  recentPayments: Payment[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalInstructors: 0,
    totalCourses: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    recentPayments: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, courses, payments] = await Promise.all([
          queryDocuments<User>('users', []),
          queryDocuments<Course>('courses', []),
          queryDocuments<Payment>('payments', []),
        ])

        const successPayments = payments.filter((p) => p.status === 'success')
        const pendingPayments = payments.filter((p) => p.status === 'pending')
        const revenue = successPayments.reduce((s, p) => s + p.amount, 0)
        const instructors = users.filter((u) => u.role === 'instructor' || u.role === 'admin')

        setStats({
          totalUsers: users.length,
          totalInstructors: instructors.length,
          totalCourses: courses.length,
          totalRevenue: revenue,
          pendingPayments: pendingPayments.length,
          recentPayments: payments
            .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
            .slice(0, 8),
        })
      } catch (error) {
        console.error('Erreur admin stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statCards = [
    {
      label: 'Utilisateurs',
      value: stats.totalUsers,
      sub: `${stats.totalInstructors} formateurs`,
      icon: Users,
      color: 'bg-sky-50 text-sky-600 border-sky-100',
    },
    {
      label: 'Formations',
      value: stats.totalCourses,
      sub: 'Total créées',
      icon: BookOpen,
      color: 'bg-purple-50 text-purple-600 border-purple-100',
    },
    {
      label: 'Revenus totaux',
      value: formatPrice(stats.totalRevenue),
      sub: 'Paiements confirmés',
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600 border-green-100',
    },
    {
      label: 'Paiements en attente',
      value: stats.pendingPayments,
      sub: 'À vérifier',
      icon: AlertCircle,
      color: 'bg-orange-50 text-orange-600 border-orange-100',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Vue d'ensemble
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Tableau de bord administrateur
        </p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.label}
                className={`bg-white rounded-2xl p-5 border hover:shadow-md transition-all ${card.color.split(' ')[2]}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-500">
                    {card.label}
                  </span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${card.color.split(' ').slice(0, 2).join(' ')}`}>
                    <Icon size={15} />
                  </div>
                </div>
                <p className="text-xl font-bold text-slate-800">{card.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Paiements récents */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Paiements récents</h2>
        </div>
        {stats.recentPayments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Aucun paiement pour le moment
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Référence', 'Montant', 'Statut', 'Date'].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-medium text-slate-400 px-5 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.recentPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50 transition-all">
                    <td className="px-5 py-3 text-sm font-mono text-slate-600 text-xs">
                      {payment.feexpayRef || payment.id?.slice(0, 12) + '...'}
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-slate-800">
                      {formatPrice(payment.amount, payment.currency)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        payment.status === 'success'
                          ? 'bg-green-50 text-green-700'
                          : payment.status === 'pending'
                          ? 'bg-orange-50 text-orange-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {payment.status === 'success'
                          ? 'Réussi'
                          : payment.status === 'pending'
                          ? 'En attente'
                          : 'Échoué'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">
                      {payment.createdAt?.seconds
                        ? new Date(payment.createdAt.seconds * 1000).toLocaleDateString('fr-FR')
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