// app/instructor/settings/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getDocument, setDocument } from '@/lib/firebase/firestore'
import { slugify } from '@/lib/utils'
import type { Instructor } from '@/types'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import {
  Palette, Globe, Upload, Save,
  Eye, Link2, Image as ImageIcon, X
} from 'lucide-react'

const PRESET_COLORS = [
  { primary: '#0284c7', secondary: '#f97316', label: 'Bleu & Orange' },
  { primary: '#7c3aed', secondary: '#f59e0b', label: 'Violet & Ambre' },
  { primary: '#059669', secondary: '#3b82f6', label: 'Vert & Bleu' },
  { primary: '#dc2626', secondary: '#1d4ed8', label: 'Rouge & Bleu' },
  { primary: '#0f172a', secondary: '#f97316', label: 'Sombre & Orange' },
  { primary: '#0891b2', secondary: '#84cc16', label: 'Cyan & Vert' },
]

export default function InstructorSettingsPage() {
  const { userProfile, refreshProfile } = useAuth()
  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'branding' | 'domain' | 'profile'>('profile')

  // Formulaire
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#0284c7')
  const [secondaryColor, setSecondaryColor] = useState('#f97316')
  const [logo, setLogo] = useState<string | null>(null)
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [customDomain, setCustomDomain] = useState('')
  const [logoUploading, setLogoUploading] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)

  useEffect(() => {
    const fetchInstructor = async () => {
      if (!userProfile?.id) return
      try {
        const data = await getDocument<Instructor>('instructors', userProfile.id)
        if (data) {
          setInstructor(data)
          setDisplayName(data.branding.displayName || userProfile.displayName)
          setBio(data.branding.bio || '')
          setPrimaryColor(data.branding.primaryColor || '#0284c7')
          setSecondaryColor(data.branding.secondaryColor || '#f97316')
          setLogo(data.branding.logo || null)
          setCoverImage(data.branding.coverImage || null)
          setCustomDomain(data.customDomain || '')
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchInstructor()
  }, [userProfile?.id])

  // Upload image vers Cloudinary
  const uploadImage = async (
    file: File,
    folder: string,
    onStart: () => void,
    onEnd: () => void,
    onSuccess: (url: string) => void
  ) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Image requise')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop lourde (max 5MB)')
      return
    }
    onStart()
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
      formData.append('folder', `lfd-web-learn/${folder}`)

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      )
      const data = await res.json()
      onSuccess(data.secure_url)
      toast.success('Image uploadée')
    } catch {
      toast.error("Erreur d'upload")
    } finally {
      onEnd()
    }
  }

  const handleSave = async () => {
    if (!userProfile?.id) return
    setSaving(true)
    try {
      const slug = instructor?.slug || slugify(displayName)

      await setDocument('instructors', userProfile.id, {
        slug,
        customDomain: customDomain.trim() || null,
        branding: {
          displayName,
          bio,
          primaryColor,
          secondaryColor,
          logo,
          coverImage,
          favicon: logo,
        },
      })

      toast.success('Paramètres sauvegardés !')
      await refreshProfile()
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profil', icon: Eye },
    { id: 'branding', label: 'Apparence', icon: Palette },
    { id: 'domain', label: 'Domaine', icon: Globe },
  ] as const

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Paramètres</h1>
          <p className="text-slate-500 text-sm mt-1">
            Personnalisez votre espace formateur
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
        >
          {saving ? (
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Save size={16} />
          )}
          Sauvegarder
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === id
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab Profil ──────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
          <h2 className="font-semibold text-slate-800">Informations publiques</h2>

          {/* Lien public */}
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3">
            <Link2 size={16} className="text-slate-400" />
            <span className="text-sm text-slate-500">Votre page publique :</span>
            
              href={`https://${instructor?.slug || 'votre-slug'}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`}
              target="_blank"
              className="text-sm text-sky-600 hover:underline font-medium"
            >
              {instructor?.slug || 'votre-slug'}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'lfdweblearn.com'}
            </a>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nom affiché *
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Votre nom ou nom de votre école"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Biographie
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Présentez-vous à vos futurs élèves..."
              maxLength={500}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all resize-none"
            />
            <p className="text-xs text-slate-400 text-right mt-1">
              {bio.length}/500
            </p>
          </div>

          {/* Image de couverture */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Image de couverture
            </label>
            <div
              className={cn(
                'relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer hover:border-sky-300 transition-all',
                coverImage ? 'border-sky-200' : 'border-slate-200'
              )}
              style={{ height: 160 }}
              onClick={() => document.getElementById('cover-input')?.click()}
            >
              {coverUploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white">
                  <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : coverImage ? (
                <>
                  <img
                    src={coverImage}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setCoverImage(null) }}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X size={12} />
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <ImageIcon size={28} className="text-slate-300" />
                  <p className="text-sm text-slate-400">
                    Cliquez pour uploader (1200×400 recommandé)
                  </p>
                </div>
              )}
            </div>
            <input
              id="cover-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadImage(
                  file, 'covers',
                  () => setCoverUploading(true),
                  () => setCoverUploading(false),
                  setCoverImage
                )
              }}
            />
          </div>
        </div>
      )}

      {/* ── Tab Apparence ───────────────────────────────── */}
      {activeTab === 'branding' && (
        <div className="space-y-5">
          {/* Logo */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Logo</h2>
            <div className="flex items-center gap-6">
              {/* Preview logo */}
              <div
                className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-sky-300 transition-all flex-shrink-0"
                onClick={() => document.getElementById('logo-input')?.click()}
              >
                {logoUploading ? (
                  <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                ) : logo ? (
                  <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Upload size={20} className="text-slate-300" />
                )}
              </div>
              <div>
                <button
                  onClick={() => document.getElementById('logo-input')?.click()}
                  className="text-sm text-sky-600 font-medium hover:underline"
                >
                  Uploader un logo
                </button>
                <p className="text-xs text-slate-400 mt-1">
                  PNG transparent recommandé — 200×200px
                </p>
                {logo && (
                  <button
                    onClick={() => setLogo(null)}
                    className="text-xs text-red-400 hover:underline mt-1 block"
                  >
                    Supprimer
                  </button>
                )}
              </div>
              <input
                id="logo-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadImage(
                    file, 'logos',
                    () => setLogoUploading(true),
                    () => setLogoUploading(false),
                    setLogo
                  )
                }}
              />
            </div>
          </div>

          {/* Couleurs */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Couleurs</h2>

            {/* Presets */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.primary}
                  onClick={() => {
                    setPrimaryColor(preset.primary)
                    setSecondaryColor(preset.secondary)
                  }}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-xl border transition-all text-left',
                    primaryColor === preset.primary && secondaryColor === preset.secondary
                      ? 'border-sky-400 bg-sky-50'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <div className="flex gap-1">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: preset.secondary }}
                    />
                  </div>
                  <span className="text-xs text-slate-600">{preset.label}</span>
                </button>
              ))}
            </div>

            {/* Couleurs custom */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Couleur principale
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Couleur secondaire
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Aperçu en temps réel */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Aperçu</h2>
            <div
              className="rounded-xl overflow-hidden border border-slate-100"
              style={{ fontFamily: 'sans-serif' }}
            >
              {/* Header preview */}
              <div
                className="p-4 flex items-center gap-3"
                style={{ backgroundColor: primaryColor }}
              >
                {logo ? (
                  <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
                ) : (
                  <div className="w-8 h-8 bg-white/20 rounded-lg" />
                )}
                <span className="text-white font-bold text-sm">
                  {displayName || 'Votre nom'}
                </span>
              </div>
              {/* Cover preview */}
              {coverImage && (
                <img
                  src={coverImage}
                  alt="Cover"
                  className="w-full h-24 object-cover"
                />
              )}
              {/* Content preview */}
              <div className="p-4 bg-slate-50">
                <p className="text-xs text-slate-600 mb-3">
                  {bio || 'Votre biographie apparaîtra ici...'}
                </p>
                <button
                  className="text-xs text-white font-semibold px-4 py-2 rounded-lg"
                  style={{ backgroundColor: secondaryColor }}
                >
                  Voir les formations
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab Domaine ─────────────────────────────────── */}
      {activeTab === 'domain' && (
        <div className="space-y-5">
          {/* Sous-domaine auto */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-semibold text-slate-800 mb-1">
              Votre sous-domaine
            </h2>
            <p className="text-slate-500 text-sm mb-4">
              Généré automatiquement à partir de votre nom
            </p>
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm font-mono text-green-800">
                {instructor?.slug || slugify(displayName || 'votre-nom')}.
                {process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'lfdweblearn.com'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Ce sous-domaine est actif et pointe vers votre page publique.
            </p>
          </div>

          {/* Domaine personnalisé */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-semibold text-slate-800 mb-1">
              Domaine personnalisé
            </h2>
            <p className="text-slate-500 text-sm mb-4">
              Connectez votre propre nom de domaine
            </p>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Votre domaine
              </label>
              <input
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value.toLowerCase().trim())}
                placeholder="formations.votresite.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              />
            </div>

            {/* Instructions DNS */}
            {customDomain && (
              <div className="mt-4 bg-slate-50 rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-slate-700">
                  Configuration DNS requise
                </p>
                <p className="text-xs text-slate-500">
                  Ajoutez ces enregistrements chez votre registrar DNS :
                </p>

                <div className="space-y-2">
                  {/* CNAME */}
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-500 uppercase">
                        CNAME
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <p className="text-slate-400">Nom / Host</p>
                        <p className="text-slate-800 mt-0.5">
                          {customDomain.split('.')[0]}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Valeur / Target</p>
                        <p className="text-slate-800 mt-0.5">
                          cname.vercel-dns.com
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* TXT verification */}
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-500 uppercase">
                        TXT (vérification)
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <p className="text-slate-400">Nom / Host</p>
                        <p className="text-slate-800 mt-0.5">@</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Valeur</p>
                        <p className="text-slate-800 mt-0.5 break-all">
                          lfd-verify={instructor?.slug || 'votre-slug'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400">
                  La propagation DNS peut prendre jusqu'à 48h. Sauvegardez
                  d'abord, puis ajoutez votre domaine dans Vercel Dashboard.
                </p>
              </div>
            )}
          </div>

          {/* Vercel instructions */}
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5">
            <h3 className="font-semibold text-sky-800 mb-2 text-sm">
              Étapes pour activer le domaine sur Vercel
            </h3>
            <ol className="space-y-1.5 text-xs text-sky-700">
              <li>1. Sauvegardez votre domaine personnalisé ci-dessus</li>
              <li>2. Allez sur vercel.com → votre projet → Settings → Domains</li>
              <li>3. Cliquez "Add Domain" et entrez votre domaine</li>
              <li>4. Suivez les instructions DNS de Vercel</li>
              <li>5. Attendez la propagation (jusqu'à 48h)</li>
            </ol>
          </div>
        </div>
      )}

      {/* Bouton save bas de page */}
      <div className="flex justify-end pb-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50"
        >
          {saving ? (
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Save size={16} />
          )}
          Sauvegarder les paramètres
        </button>
      </div>
    </div>
  )
}