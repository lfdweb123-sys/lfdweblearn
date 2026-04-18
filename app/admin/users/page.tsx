// app/admin/users/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { queryDocuments, updateDocument } from '@/lib/firebase/firestore'
import type { User } from '@/types'
import toast from 'react-hot-toast'
import { Search, Shield, User as UserIcon, BookOpen } from 'lucide-react'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filtered, setFiltered] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await queryDocuments<User>('users', [])
        setUsers(data)
        setFiltered(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(users)
      return
    }
    const q = search.toLowerCase()
    setFiltered(
      users.filter(
        (u) =>
          u.displayName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
      )
    )
  }, [search, users])

  const changeRole = async (
    userId: string,
    newRole: 'student' | 'instructor' | 'admin'
  ) => {
    try {
      await updateDocument('users', userId, { role: newRole })
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      )
      toast.success('Rôle mis à jour')
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const ROLE_COLORS = {
    student: 'bg-slate-100 text-slate-600',
    instructor: 'bg-sky-50 text-sky-700',
    admin: 'bg-red-50 text-red-700',
  }

  const ROLE_LABELS = {
    student: 'Élève',
    instructor: 'Formateur',
    admin: 'Admin',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Utilisateurs</h1>
          <p className="text-slate-500 text-sm mt-1">
            {users.length} utilisateur{users.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou email..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
        />
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-3 items-center">
                <div className="w-9 h-9 bg-slate-100 rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-slate-100 rounded w-32" />
                  <div className="h-3 bg-slate-100 rounded w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Utilisateur', 'Rôle', 'Inscrit le', 'Actions'].map((h) => (
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
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50 transition-all"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 font-semibold text-sm">
                        {user.displayName?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {user.displayName}
                        </p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        ROLE_COLORS[user.role] || ROLE_COLORS.student
                      }`}
                    >
                      {ROLE_LABELS[user.role] || 'Élève'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400">
                    {user.createdAt?.seconds
                      ? new Date(user.createdAt.seconds * 1000).toLocaleDateString('fr-FR')
                      : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        changeRole(
                          user.id,
                          e.target.value as 'student' | 'instructor' | 'admin'
                        )
                      }
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
                    >
                      <option value="student">Élève</option>
                      <option value="instructor">Formateur</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}