// app/admin/users/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { queryDocuments, updateDocument, deleteDocument } from '@/lib/firebase/firestore'
import type { User } from '@/types'
import toast from 'react-hot-toast'
import { Search, Trash2, Ban, CheckCircle, Edit2, X, Save } from 'lucide-react'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filtered, setFiltered] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

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
    if (!search.trim()) { setFiltered(users); return }
    const q = search.toLowerCase()
    setFiltered(users.filter((u) =>
      u.displayName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    ))
  }, [search, users])

  const changeRole = async (userId: string, newRole: 'student' | 'instructor' | 'admin') => {
    try {
      await updateDocument('users', userId, { role: newRole })
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u))
      toast.success('Role mis a jour')
    } catch {
      toast.error('Erreur')
    }
  }

  const toggleDisable = async (user: User) => {
    const disabled = !(user as any).disabled
    try {
      await updateDocument('users', user.id, { disabled })
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, disabled } as any : u))
      toast.success(disabled ? 'Compte desactive' : 'Compte reactive')
    } catch {
      toast.error('Erreur')
    }
  }

  const startEdit = (user: User) => {
    setEditingId(user.id)
    setEditName(user.displayName || '')
    setEditEmail(user.email || '')
  }

  const saveEdit = async (userId: string) => {
    try {
      await updateDocument('users', userId, {
        displayName: editName.trim(),
        email: editEmail.trim(),
      })
      setUsers((prev) => prev.map((u) =>
        u.id === userId ? { ...u, displayName: editName.trim(), email: editEmail.trim() } : u
      ))
      setEditingId(null)
      toast.success('Utilisateur modifie')
    } catch {
      toast.error('Erreur')
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      await deleteDocument('users', userId)
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      setConfirmDelete(null)
      toast.success('Utilisateur supprime')
    } catch {
      toast.error('Erreur')
    }
  }

  const ROLE_COLORS: Record<string, string> = {
    student: 'bg-slate-100 text-slate-600',
    instructor: 'bg-sky-50 text-sky-700',
    admin: 'bg-red-50 text-red-700',
  }

  const ROLE_LABELS: Record<string, string> = {
    student: 'Eleve',
    instructor: 'Formateur',
    admin: 'Admin',
  }

  const activeCount = users.filter((u) => !(u as any).disabled).length
  const disabledCount = users.filter((u) => (u as any).disabled).length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Utilisateurs</h1>
        <p className="text-slate-500 text-sm mt-1">{users.length} utilisateur{users.length > 1 ? 's' : ''}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: users.length, color: 'text-slate-800' },
          { label: 'Actifs', value: activeCount, color: 'text-green-600' },
          { label: 'Desactives', value: disabledCount, color: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={'text-2xl font-bold ' + s.color}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
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
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">Aucun utilisateur trouve</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Utilisateur', 'Role', 'Statut', 'Inscrit le', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-slate-400 px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((user) => {
                  const isDisabled = (user as any).disabled
                  const isEditing = editingId === user.id

                  return (
                    <tr key={user.id} className={'transition-all ' + (isDisabled ? 'opacity-50 bg-slate-50' : 'hover:bg-slate-50')}>

                      {/* Utilisateur */}
                      <td className="px-5 py-3">
                        {isEditing ? (
                          <div className="space-y-1.5">
                            <input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Nom"
                              className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                            />
                            <input
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                              placeholder="Email"
                              className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 font-semibold text-sm flex-shrink-0">
                              {user.displayName?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">{user.displayName}</p>
                              <p className="text-xs text-slate-400">{user.email}</p>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3">
                        <select
                          value={user.role}
                          onChange={(e) => changeRole(user.id, e.target.value as 'student' | 'instructor' | 'admin')}
                          className={'text-xs px-2.5 py-1.5 rounded-lg font-medium border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-sky-500 ' + (ROLE_COLORS[user.role] || ROLE_COLORS.student)}
                        >
                          <option value="student">Eleve</option>
                          <option value="instructor">Formateur</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>

                      {/* Statut */}
                      <td className="px-5 py-3">
                        <span className={'text-xs px-2.5 py-1 rounded-full font-medium ' + (isDisabled ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600')}>
                          {isDisabled ? 'Desactive' : 'Actif'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3 text-xs text-slate-400">
                        {(user as any).createdAt?.seconds
                          ? new Date((user as any).createdAt.seconds * 1000).toLocaleDateString('fr-FR')
                          : '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveEdit(user.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 hover:bg-green-100 transition-all"
                                title="Sauvegarder"
                              >
                                <Save size={14} className="text-green-600" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 transition-all"
                                title="Annuler"
                              >
                                <X size={14} className="text-slate-500" />
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Modifier */}
                              <button
                                onClick={() => startEdit(user)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sky-50 transition-all"
                                title="Modifier"
                              >
                                <Edit2 size={14} className="text-sky-500" />
                              </button>

                              {/* Activer / Desactiver */}
                              <button
                                onClick={() => toggleDisable(user)}
                                className={'w-8 h-8 flex items-center justify-center rounded-lg transition-all ' + (isDisabled ? 'hover:bg-green-50' : 'hover:bg-orange-50')}
                                title={isDisabled ? 'Reactiver' : 'Desactiver'}
                              >
                                {isDisabled
                                  ? <CheckCircle size={14} className="text-green-500" />
                                  : <Ban size={14} className="text-orange-500" />
                                }
                              </button>

                              {/* Supprimer */}
                              {confirmDelete === user.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => deleteUser(user.id)}
                                    className="text-xs bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600 transition-all"
                                  >
                                    Confirmer
                                  </button>
                                  <button
                                    onClick={() => setConfirmDelete(null)}
                                    className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-200 transition-all"
                                  >
                                    Annuler
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDelete(user.id)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-all"
                                  title="Supprimer"
                                >
                                  <Trash2 size={14} className="text-red-400" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
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