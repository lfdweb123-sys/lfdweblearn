// app/admin/payments/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { queryDocuments } from '@/lib/firebase/firestore'
import { orderBy } from 'firebase/firestore'
import type { Payment } from '@/types'
import { formatPrice } from '@/lib/utils'
import { Search, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [filtered, setFiltered] = useState<Payment[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'success' | 'pending' | 'failed'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const data = await queryDocuments<Payment>('payments', [
          orderBy('createdAt', 'desc'),
        ])
        setPayments(data)
        setFiltered(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchPayments()
  }, [])

  useEffect(() => {
    let result = payments
    if (filter !== 'all') {
      result = result.filter((p) => p.status === filter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.feexpayRef?.toLowerCase().includes(q) ||
          p.userId?.toLowerCase().includes(q) ||
          p.courseId?.toLowerCase().includes(q)
      )
    }
    setFiltered(result)
  }, [filter, search, payments])

  const totalSuccess = payments
    .filter((p) => p.status === 'success')
    .reduce((s, p) => s + p.amount, 0)

  const STATUS_CONFIG = {
    success: { label: 'Réussi', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    pending: { label: 'En attente', icon: Clock, color: 'text-orange-600 bg-orange-50' },
    failed: { label: 'Échoué', icon: XCircle, color: 'text-red-600 bg-red-50' },
    refunded: { label: 'Remboursé', icon: XCircle, color: 'text-slate-600 bg-slate-100' },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Paiements</h1>
          <p className="text-slate-500 text-sm mt-1">
            {payments.length} transaction{payments.length > 1 ? 's' : ''} ·{' '}
            <span className="text-green-600 font-medium">
              {formatPrice(totalSuccess)} encaissés
            </span>
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par référence..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'success', 'pending', 'failed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === s
                  ? 'bg-sky-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-sky-300'
              }`}
            >
              {s === 'all' ? 'Tous' : s === 'success' ? 'Réussis' : s === 'pending' ? 'En attente' : 'Échoués'}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse h-12 bg-slate-50 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Aucun paiement trouvé
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Référence', 'Montant', 'Devise', 'Statut', 'Vérifié', 'Date'].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-slate-400 px-5 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((payment) => {
                  const statusConfig = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending
                  const StatusIcon = statusConfig.icon
                  return (
                    <tr key={payment.id} className="hover:bg-slate-50 transition-all">
                      <td className="px-5 py-3 text-xs font-mono text-slate-600">
                        {payment.feexpayRef || payment.id?.slice(0, 14) + '...'}
                      </td>
                      <td className="px-5 py-3 text-sm font-bold text-slate-800">
                        {formatPrice(payment.amount, payment.currency)}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {payment.currency}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig.color}`}>
                          <StatusIcon size={11} />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs ${payment.webhookVerified ? 'text-green-600' : 'text-slate-400'}`}>
                          {payment.webhookVerified ? '✓ Vérifié' : 'En attente'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-400">
                        {payment.createdAt?.seconds
                          ? new Date(payment.createdAt.seconds * 1000).toLocaleDateString('fr-FR')
                          : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}