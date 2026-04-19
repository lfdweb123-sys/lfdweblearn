// app/admin/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { queryDocuments } from '@/lib/firebase/firestore'
import { Users, BookOpen, TrendingUp, AlertCircle, Globe, RefreshCw } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { User, Course, Payment } from '@/types'
import toast from 'react-hot-toast'

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
  const [migrating, setMigrating] = useState(false)
  const [migrateResult, setMigrateResult] = useState<string | null>(null)

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

  const handleMigrateDomains = async () => {
    setMigrating(true)
    setMigrateResult(null)
    try {
      const res = await fetch('/api/admin/migrate-domains', {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erreur migration')
        return
      }
      const message = data.migrated + ' domaine(s) migre(s) vers Vercel'
      setMigrateResult(message)
      toast.success(message)
    } catch {
      toast.error('Erreur reseau')
    } finally {
      setMigrating(false)
    }
  }

  const statCards = [
    {
      label: 'Utilisateurs',
      value: stats.totalUsers,
      sub: stats.totalInstructors + ' formateurs',
      icon: Users,
      color: 'bg-sky-50 text-sky-600 border-sky-100',
    },
    {
      label: 'Formations',
      value: stats.totalCourses,
      sub: 'Total creees',
      icon: BookOpen,
      color: 'bg-purple-50 text-purple-600 border-purple-100',
    },
    {
      label: 'Revenus totaux',
      value: formatPrice(stats.totalRevenue),
      sub: 'Paiements confirmes',
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600 border-green-100',
    },
    {
      label: 'Paiements en attente',
      value: stats.pendingPayments,
      sub: 'A verifier',
      icon: AlertCircle,
      color: 'bg-orange-50 text-orange-600 border-orange-100',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Vue d'ensemble</h1>
        <p className="text-slate-500 text-sm mt-1">Tableau de bord administrateur</p>
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
                className={'bg-white rounded-2xl p-5 border hover:shadow-md transition-all ' + card.color.split(' ')[2]}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-500">{card.label}</span>
                  <div className={'w-8 h-8 rounded-xl flex items-center justify-center ' + card.color.split(' ').slice(0, 2).join(' ')}>
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

      {/* Migration domaines */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Globe size={18} className="text-sky-500" />
              <h3 className="font-semibold text-slate-800">Migration des domaines</h3>
            </div>
            <p className="text-slate-500 text-sm">
              Ajouter automatiquement tous les sous-domaines formateurs sur Vercel
            </p>
            {migrateResult && (
              <p className="text-green-600 text-xs mt-1.5 font-medium">{migrateResult}</p>
            )}
          </div>
          <button
            onClick={handleMigrateDomains}
            disabled={migrating}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 flex-shrink-0"
          >
            {migrating ? (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <RefreshCw size={15} />
            )}
            {migrating ? 'Migration...' : 'Migrer'}
          </button>
        </div>
      </div>

      {/* Paiements recents */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Paiements recents</h2>
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
                  {['Reference', 'Montant', 'Statut', 'Date'].map((h) => (
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
                      <span className={'text-xs px-2.5 py-1 rounded-full font-medium ' + (
                        payment.status === 'success'
                          ? 'bg-green-50 text-green-700'
                          : payment.status === 'pending'
                          ? 'bg-orange-50 text-orange-700'
                          : 'bg-red-50 text-red-700'
                      )}>
                        {payment.status === 'success'
                          ? 'Reussi'
                          : payment.status === 'pending'
                          ? 'En attente'
                          : 'Echoue'}
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