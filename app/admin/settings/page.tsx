// app/admin/settings/page.tsx
'use client'

import { useState } from 'react'
import { Settings, Globe, Shield, Bell, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const tabs = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'security', label: 'Securite', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'domain', label: 'Domaine', icon: Globe },
] as const

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'domain'>('general')
  const [saving, setSaving] = useState(false)
  const [siteName, setSiteName] = useState('LFD Web Learn')
  const [siteDesc, setSiteDesc] = useState('La plateforme de formation en ligne pour l Afrique')
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [paymentNotifs, setPaymentNotifs] = useState(true)

  const handleSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    toast.success('Parametres sauvegardes')
    setSaving(false)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Parametres</h1>
          <p className="text-slate-500 text-sm mt-1">Configuration generale de la plateforme</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
        >
          {saving ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Save size={16} />}
          Sauvegarder
        </button>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
          <h2 className="font-semibold text-slate-800">Informations du site</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom du site</label>
            <input
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={siteDesc}
              onChange={(e) => setSiteDesc(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all resize-none"
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200">
            <div>
              <p className="text-sm font-medium text-red-800">Mode maintenance</p>
              <p className="text-xs text-red-600 mt-0.5">Desactive l acces public au site</p>
            </div>
            <button
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={cn('w-11 h-6 rounded-full transition-all relative', maintenanceMode ? 'bg-red-500' : 'bg-slate-200')}
            >
              <span className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all', maintenanceMode ? 'left-5' : 'left-0.5')} />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
          <h2 className="font-semibold text-slate-800">Securite</h2>
          <div className="space-y-3">
            {[
              { label: 'Authentification 2FA obligatoire', desc: 'Forcer la 2FA pour tous les admins' },
              { label: 'Blocage apres 5 tentatives', desc: 'Bloquer le compte apres echecs consecutifs' },
              { label: 'Sessions securisees HTTPS', desc: 'Forcer HTTPS sur toutes les connexions' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                </div>
                <div className="w-11 h-6 rounded-full bg-sky-500 relative cursor-pointer">
                  <span className="absolute top-0.5 left-5 w-5 h-5 bg-white rounded-full shadow" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
          <h2 className="font-semibold text-slate-800">Notifications</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-sm font-medium text-slate-800">Notifications email</p>
                <p className="text-xs text-slate-400 mt-0.5">Recevoir les alertes par email</p>
              </div>
              <button
                onClick={() => setEmailNotifs(!emailNotifs)}
                className={cn('w-11 h-6 rounded-full transition-all relative', emailNotifs ? 'bg-sky-500' : 'bg-slate-200')}
              >
                <span className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all', emailNotifs ? 'left-5' : 'left-0.5')} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-sm font-medium text-slate-800">Alertes paiements</p>
                <p className="text-xs text-slate-400 mt-0.5">Notifier chaque nouveau paiement</p>
              </div>
              <button
                onClick={() => setPaymentNotifs(!paymentNotifs)}
                className={cn('w-11 h-6 rounded-full transition-all relative', paymentNotifs ? 'bg-sky-500' : 'bg-slate-200')}
              >
                <span className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all', paymentNotifs ? 'left-5' : 'left-0.5')} />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'domain' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
          <h2 className="font-semibold text-slate-800">Configuration domaine</h2>
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-mono text-green-800">lfdweblearn.com</span>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-auto">Actif</span>
          </div>
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-mono text-green-800">*.lfdweblearn.com</span>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-auto">Wildcard actif</span>
          </div>
          <p className="text-xs text-slate-400">
            Les sous-domaines formateurs sont geres automatiquement via Vercel et Hostinger API.
          </p>
        </div>
      )}
    </div>
  )
}