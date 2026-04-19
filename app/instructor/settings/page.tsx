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
  Eye, Link2, Image as ImageIcon, X, ExternalLink
} from 'lucide-react'

const PRESET_COLORS = [
  { primary: '#0284c7', secondary: '#f97316', label: 'Bleu et Orange' },
  { primary: '#7c3aed', secondary: '#f59e0b', label: 'Violet et Ambre' },
  { primary: '#059669', secondary: '#3b82f6', label: 'Vert et Bleu' },
  { primary: '#dc2626', secondary: '#1d4ed8', label: 'Rouge et Bleu' },
  { primary: '#0f172a', secondary: '#f97316', label: 'Sombre et Orange' },
  { primary: '#0891b2', secondary: '#84cc16', label: 'Cyan et Vert' },
]

const DOMAIN_PROVIDERS = [
  { name: 'Hostinger', url: 'https://www.hostinger.fr/enregistrement-nom-de-domaine', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { name: 'OVH', url: 'https://www.ovh.com/fr/domaines/', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { name: 'LWS', url: 'https://www.lws.fr/nom-de-domaine.php', color: 'bg-green-50 text-green-700 border-green-200' },
  { name: 'GoDaddy', url: 'https://fr.godaddy.com/domains', color: 'bg-orange-50 text-orange-700 border-orange-200' },
]

export default function InstructorSettingsPage() {
  const { userProfile, refreshProfile } = useAuth()
  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'branding' | 'domain' | 'profile'>('profile')
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

  const uploadImage = async (
    file: File,
    folder: string,
    onStart: () => void,
    onEnd: () => void,
    onSuccess: (url: string) => void
  ) => {
    if (!file.type.startsWith('image/')) { toast.error('Image requise'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image trop lourde (max 5MB)'); return }
    onStart()
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
      formData.append('folder', 'lfd-web-learn/' + folder)
      const res = await fetch(
        'https://api.cloudinary.com/v1_1/' + process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME + '/image/upload',
        { method: 'POST', body: formData }
      )
      const data = await res.json()
      onSuccess(data.secure_url)
      toast.success('Image uploadee')
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
        branding: { displayName, bio, primaryColor, secondaryColor, logo, coverImage, favicon: logo },
      })
      toast.success('Parametres sauvegardes !')
      await refreshProfile()
    } catch {
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

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'lfdweblearn.com'
  const slug = instructor?.slug || 'votre-slug'
  const publicUrl = 'https://' + slug + '.' + rootDomain
  const publicLabel = slug + '.' + rootDomain
  const subdomainLabel = (instructor?.slug || slugify(displayName || 'votre-nom')) + '.' + rootDomain
  const verifyValue = 'lfd-verify=' + (instructor?.slug || 'votre-slug')

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Parametres</h1>
          <p className="text-slate-500 text-sm mt-1">Personnalisez votre espace formateur</p>
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

      {/* ── Profil ── */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
          <h2 className="font-semibold text-slate-800">Informations publiques</h2>

          <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3">
            <Link2 size={16} className="text-slate-400" />
            <span className="text-sm text-slate-500">Votre page publique :</span>
            <a href={publicUrl} target="_blank" rel="noreferrer" className="text-sm text-sky-600 hover:underline font-medium">
              {publicLabel}
            </a>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom affiche</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Votre nom ou nom de votre ecole"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Biographie</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Presentez-vous a vos futurs eleves..."
              maxLength={500}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all resize-none"
            />
            <p className="text-xs text-slate-400 text-right mt-1">{bio.length}/500</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Image de couverture</label>
            <div
              className={cn('relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer hover:border-sky-300 transition-all', coverImage ? 'border-sky-200' : 'border-slate-200')}
              style={{ height: 160 }}
              onClick={() => document.getElementById('cover-input')?.click()}
            >
              {coverUploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white">
                  <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : coverImage ? (
                <>
                  <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                  <button type="button" onClick={(e) => { e.stopPropagation(); setCoverImage(null) }} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <X size={12} />
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <ImageIcon size={28} className="text-slate-300" />
                  <p className="text-sm text-slate-400">Cliquez pour uploader (1200x400 recommande)</p>
                </div>
              )}
            </div>
            <input id="cover-input" type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadImage(file, 'covers', () => setCoverUploading(true), () => setCoverUploading(false), setCoverImage) }} />
          </div>
        </div>
      )}

      {/* ── Apparence ── */}
      {activeTab === 'branding' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Logo</h2>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-sky-300 transition-all flex-shrink-0" onClick={() => document.getElementById('logo-input')?.click()}>
                {logoUploading ? (
                  <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                ) : logo ? (
                  <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Upload size={20} className="text-slate-300" />
                )}
              </div>
              <div>
                <button onClick={() => document.getElementById('logo-input')?.click()} className="text-sm text-sky-600 font-medium hover:underline">Uploader un logo</button>
                <p className="text-xs text-slate-400 mt-1">PNG transparent recommande - 200x200px</p>
                {logo && <button onClick={() => setLogo(null)} className="text-xs text-red-400 hover:underline mt-1 block">Supprimer</button>}
              </div>
              <input id="logo-input" type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadImage(file, 'logos', () => setLogoUploading(true), () => setLogoUploading(false), setLogo) }} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Couleurs</h2>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {PRESET_COLORS.map((preset) => (
                <button key={preset.primary} onClick={() => { setPrimaryColor(preset.primary); setSecondaryColor(preset.secondary) }} className={cn('flex items-center gap-2 p-3 rounded-xl border transition-all text-left', primaryColor === preset.primary && secondaryColor === preset.secondary ? 'border-sky-400 bg-sky-50' : 'border-slate-200 hover:border-slate-300')}>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.primary }} />
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.secondary }} />
                  </div>
                  <span className="text-xs text-slate-600">{preset.label}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Couleur principale</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer" />
                  <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Couleur secondaire</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer" />
                  <input type="text" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Apercu</h2>
            <div className="rounded-xl overflow-hidden border border-slate-100">
              <div className="p-4 flex items-center gap-3" style={{ backgroundColor: primaryColor }}>
                {logo ? <img src={logo} alt="Logo" className="w-8 h-8 object-contain" /> : <div className="w-8 h-8 bg-white/20 rounded-lg" />}
                <span className="text-white font-bold text-sm">{displayName || 'Votre nom'}</span>
              </div>
              {coverImage && <img src={coverImage} alt="Cover" className="w-full h-24 object-cover" />}
              <div className="p-4 bg-slate-50">
                <p className="text-xs text-slate-600 mb-3">{bio || 'Votre biographie apparaitra ici...'}</p>
                <button className="text-xs text-white font-semibold px-4 py-2 rounded-lg" style={{ backgroundColor: secondaryColor }}>Voir les formations</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Domaine ── */}
      {activeTab === 'domain' && (
        <div className="space-y-5">

          {/* Sous-domaine gratuit inclus */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-semibold text-slate-800 mb-1">Votre sous-domaine gratuit</h2>
            <p className="text-slate-500 text-sm mb-4">
              Genere automatiquement — inclus dans tous les plans
            </p>
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
              <span className="text-sm font-mono text-green-800 break-all">{subdomainLabel}</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Ce sous-domaine est actif et pointe vers votre page publique. Aucune configuration requise.
            </p>
          </div>

          {/* Domaine personnalise */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-semibold text-slate-800 mb-1">Domaine personnalise</h2>
            <p className="text-slate-500 text-sm mb-4">
              Connectez votre propre domaine acheté chez un registrar
            </p>

            {/* Achat domaine */}
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
                Acheter un nom de domaine chez :
              </p>
              <div className="flex flex-wrap gap-2">
                {DOMAIN_PROVIDERS.map((provider) => (
                  
                    key={provider.name}
                    href={provider.url}
                    target="_blank"
                    rel="noreferrer"
                    className={'inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all hover:opacity-80 ' + provider.color}
                  >
                    {provider.name}
                    <ExternalLink size={11} />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Votre domaine personnalise
              </label>
              <input
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value.toLowerCase().trim())}
                placeholder="formations.votresite.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              />
              <p className="text-xs text-slate-400 mt-1">
                Exemple : formations.monsiteweb.com ou cours.monentreprise.com
              </p>
            </div>

            {/* Instructions DNS */}
            {customDomain && (
              <div className="mt-4 bg-slate-50 rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-slate-700">
                  Configuration DNS a faire chez votre registrar
                </p>
                <p className="text-xs text-slate-500">
                  Connectez-vous a votre compte Hostinger, OVH, LWS ou autre et ajoutez ces enregistrements dans la gestion DNS de votre domaine :
                </p>

                <div className="space-y-2">
                  {/* CNAME */}
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <span className="text-xs font-semibold text-slate-500 uppercase block mb-2">
                      Enregistrement CNAME
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <p className="text-slate-400">Nom / Hote / Sous-domaine</p>
                        <p className="text-slate-800 mt-0.5 font-bold">{customDomain.split('.')[0]}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Valeur / Cible / Pointe vers</p>
                        <p className="text-slate-800 mt-0.5 font-bold">cname.vercel-dns.com</p>
                      </div>
                    </div>
                  </div>

                  {/* TXT */}
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <span className="text-xs font-semibold text-slate-500 uppercase block mb-2">
                      Enregistrement TXT (verification)
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <p className="text-slate-400">Nom / Hote</p>
                        <p className="text-slate-800 mt-0.5 font-bold">@</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Valeur</p>
                        <p className="text-slate-800 mt-0.5 break-all font-bold">{verifyValue}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2">
                  La propagation DNS peut prendre de 30 minutes a 48h selon votre registrar.
                </p>
              </div>
            )}
          </div>

          {/* Etapes Vercel */}
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5">
            <h3 className="font-semibold text-sky-800 mb-3 text-sm flex items-center gap-2">
              <Globe size={15} />
              Apres avoir configure le DNS, activez le domaine sur Vercel
            </h3>
            <ol className="space-y-2 text-xs text-sky-700">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-sky-200 text-sky-800 rounded-full flex items-center justify-center font-bold flex-shrink-0 mt-0.5">1</span>
                Sauvegardez d'abord votre domaine ci-dessus
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-sky-200 text-sky-800 rounded-full flex items-center justify-center font-bold flex-shrink-0 mt-0.5">2</span>
                Allez sur vercel.com et connectez-vous
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-sky-200 text-sky-800 rounded-full flex items-center justify-center font-bold flex-shrink-0 mt-0.5">3</span>
                Ouvrez votre projet lfdweblearn → Settings → Domains
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-sky-200 text-sky-800 rounded-full flex items-center justify-center font-bold flex-shrink-0 mt-0.5">4</span>
                Cliquez "Add Domain" et entrez votre domaine exact
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-sky-200 text-sky-800 rounded-full flex items-center justify-center font-bold flex-shrink-0 mt-0.5">5</span>
                Vercel verifiera automatiquement le DNS configure chez votre registrar
              </li>
            </ol>
            
              href="https://vercel.com/docs/projects/domains/add-a-domain"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-sky-600 font-medium hover:underline"
            >
              <ExternalLink size={12} />
              Documentation officielle Vercel
            </a>
          </div>
        </div>
      )}

      <div className="flex justify-end pb-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50"
        >
          {saving ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Save size={16} />}
          Sauvegarder les parametres
        </button>
      </div>
    </div>
  )
}