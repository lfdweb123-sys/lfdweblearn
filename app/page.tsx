// app/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { logout } from '@/lib/firebase/auth'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  BookOpen, Shield, Zap, Globe, Users,
  ArrowRight, CheckCircle, Menu, X, Play,
  Award, TrendingUp, Heart, Mail, Phone,
  MapPin, Facebook, Twitter, Instagram, Youtube,
  ChevronDown, LogOut, Settings, LayoutDashboard
} from 'lucide-react'

const NAV_LINKS = [
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Comment ça marche', href: '#how' },
  { label: 'Tarifs', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

const HERO_STATS = [
  { value: '100%', label: 'Gratuit pour débuter' },
  { value: 'Mobile Money', label: 'Paiement intégré' },
  { value: 'Anti-DL', label: 'Contenu protégé' },
]

const PAYMENT_METHODS = ['MTN Mobile Money', 'Moov Money', 'Wave', 'Orange Money', 'Feexpay']

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Créez vos formations',
    description: 'Vidéos, PDFs, audios, images. Organisez en modules et leçons avec une interface intuitive.',
    color: 'bg-sky-50 text-sky-600',
  },
  {
    icon: Shield,
    title: 'Contenu 100% protégé',
    description: 'Streaming sécurisé anti-téléchargement. Tokens signés, watermark dynamique et protection avancée.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: Zap,
    title: 'Paiement Mobile Money',
    description: 'Intégration Feexpay complète. Acceptez MTN, Moov, Wave et Orange Money instantanément.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: Globe,
    title: 'Votre propre domaine',
    description: 'Sous-domaine gratuit inclus. Connectez votre domaine personnalisé pour une image professionnelle.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Users,
    title: 'Espace élève complet',
    description: 'Tableau de bord, progression, historique des achats. Expérience optimale pour vos apprenants.',
    color: 'bg-teal-50 text-teal-600',
  },
  {
    icon: TrendingUp,
    title: 'Analytiques et revenus',
    description: 'Suivez vos ventes, vos élèves et vos performances en temps réel depuis votre tableau de bord.',
    color: 'bg-amber-50 text-amber-600',
  },
]

const STEPS = [
  {
    title: 'Créez votre compte',
    description: 'Inscrivez-vous gratuitement et activez votre espace formateur en quelques secondes.',
  },
  {
    title: 'Créez votre formation',
    description: 'Ajoutez vos modules, uploadez vidéos, PDFs et contenus pédagogiques facilement.',
  },
  {
    title: 'Personnalisez votre page',
    description: 'Configurez couleurs, logo et domaine pour une identité visuelle professionnelle.',
  },
  {
    title: 'Vendez et encaissez',
    description: 'Partagez votre lien, acceptez Mobile Money et suivez vos revenus en temps réel.',
  },
]

const PLANS = [
  {
    name: 'Starter',
    price: 'Gratuit',
    period: 'Pour toujours',
    featured: false,
    cta: 'Commencer gratuitement',
    features: [
      'Formations illimitées',
      'Sous-domaine inclus',
      'Paiement Mobile Money',
      'Espace élève complet',
      'Support email',
    ],
  },
  {
    name: 'Pro',
    price: '9 900 FCFA',
    period: 'Par mois',
    featured: true,
    cta: 'Essayer 14 jours gratuit',
    features: [
      'Tout du plan Starter',
      'Domaine personnalisé',
      'Analytiques avancées',
      'Certificats automatiques',
      'Support prioritaire 24/7',
    ],
  },
]

const FAQS = [
  {
    q: 'Est-ce vraiment gratuit pour commencer ?',
    a: 'Oui, le plan Starter est entièrement gratuit et sans limite de temps. Vous pouvez créer autant de formations que vous voulez.',
  },
  {
    q: 'Quels moyens de paiement sont acceptés ?',
    a: 'Nous acceptons MTN Mobile Money, Moov Money, Wave, Orange Money via Feexpay. Les paiements sont instantanés et sécurisés.',
  },
  {
    q: 'Comment protéger mes vidéos contre le téléchargement ?',
    a: 'Toutes vos vidéos sont streamées via Bunny.net avec des tokens signés et un filigrane dynamique. Impossible de les télécharger.',
  },
  {
    q: 'Puis-je utiliser mon propre nom de domaine ?',
    a: 'Oui, avec le plan Pro vous pouvez connecter votre domaine personnalisé. Un sous-domaine gratuit est inclus dans tous les plans.',
  },
  {
    q: "Comment recevoir l'argent de mes ventes ?",
    a: "Les paiements sont collectés sur votre compte Feexpay directement. Vous gardez le contrôle total de vos revenus.",
  },
]

const SOCIALS = [
  { label: 'Facebook', icon: Facebook, href: '#' },
  { label: 'Twitter', icon: Twitter, href: '#' },
  { label: 'Instagram', icon: Instagram, href: '#' },
  { label: 'Youtube', icon: Youtube, href: '#' },
]

const FOOTER_PLATFORM = [
  { label: 'Créer une formation', href: '/register' },
  { label: 'Se connecter', href: '/login' },
  { label: 'Tarifs', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

const FOOTER_LEGAL = [
  { label: 'Mentions légales', href: '/mentions-legales' },
  { label: 'Politique de confidentialité', href: '/confidentialite' },
  { label: "Conditions d'utilisation", href: '/conditions-utilisation' },
  { label: 'Politique de remboursement', href: '/remboursement' },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const { isAuthenticated, userProfile, isInstructor } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    setProfileOpen(false)
    setMenuOpen(false)
    toast.success('Déconnecté')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between">

            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-8 h-8 bg-sky-600 rounded-xl flex items-center justify-center shadow-sm">
                <BookOpen size={16} className="text-white" />
              </div>
              <span className="font-bold text-lg">
                <span className="text-sky-600">LFD</span>
                <span className="text-orange-500"> Web Learn</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm text-slate-600 hover:text-sky-600 font-medium transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated && userProfile ? (
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-xs">
                      {userProfile.displayName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-slate-800 leading-none">
                        {userProfile.displayName?.split(' ')[0]}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {userProfile.role === 'instructor' ? 'Formateur'
                          : userProfile.role === 'admin' ? 'Admin'
                          : 'Élève'}
                      </p>
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setProfileOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-slate-100 shadow-xl py-2 z-50">
                        <div className="px-4 py-3 border-b border-slate-100">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {userProfile.displayName}
                          </p>
                          <p className="text-xs text-slate-400 truncate">{userProfile.email}</p>
                        </div>
                        <Link
                          href="/dashboard"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-sky-50 hover:text-sky-600 transition-all"
                        >
                          <LayoutDashboard size={15} />
                          Mon tableau de bord
                        </Link>
                        {isInstructor && (
                          <Link
                            href="/instructor"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-sky-50 hover:text-sky-600 transition-all"
                          >
                            <Settings size={15} />
                            Espace formateur
                          </Link>
                        )}
                        <div className="border-t border-slate-100 mt-1 pt-1">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-all"
                          >
                            <LogOut size={15} />
                            Déconnexion
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm font-medium text-slate-600 hover:text-sky-600 transition-colors px-3 py-2"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/register"
                    className="text-sm font-semibold bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-sm"
                  >
                    Commencer gratuitement
                  </Link>
                </>
              )}
            </div>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
            >
              {menuOpen
                ? <X size={20} className="text-slate-600" />
                : <Menu size={20} className="text-slate-600" />
              }
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-1 shadow-lg">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-600 rounded-xl transition-all"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              {isAuthenticated && userProfile ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl">
                    <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-sm">
                      {userProfile.displayName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{userProfile.displayName}</p>
                      <p className="text-xs text-slate-400">
                        {userProfile.role === 'instructor' ? 'Formateur'
                          : userProfile.role === 'admin' ? 'Admin'
                          : 'Élève'}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                  >
                    <LayoutDashboard size={16} />
                    Mon tableau de bord
                  </Link>
                  {isInstructor && (
                    <Link
                      href="/instructor"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-white bg-sky-600 rounded-xl hover:bg-sky-700 transition-all"
                    >
                      <Settings size={16} />
                      Espace formateur
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-red-500 border border-red-100 rounded-xl hover:bg-red-50 transition-all"
                  >
                    <LogOut size={16} />
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block text-center px-4 py-3 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMenuOpen(false)}
                    className="block text-center px-4 py-3 text-sm font-semibold bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-all"
                  >
                    Commencer gratuitement
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-orange-50 py-16 sm:py-24">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-sky-200 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-100 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white border border-sky-200 rounded-full px-4 py-2 text-sky-700 text-sm font-medium mb-6 shadow-sm">
              <Zap size={14} className="text-orange-500" />
              Plateforme N°1 de formation en ligne pour l&apos;Afrique
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
              Créez et vendez vos{' '}
              <span className="text-sky-600">formations</span>
              <br className="hidden sm:block" />
              {' '}en ligne{' '}
              <span className="text-orange-500">facilement</span>
            </h1>
            <p className="text-slate-500 text-base sm:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
              Partagez votre expertise, construisez votre audience et générez
              des revenus grâce au Mobile Money. Conçu pour l&apos;Afrique.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-sky-200 text-base"
                >
                  <LayoutDashboard size={18} />
                  Mon tableau de bord
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-sky-200 text-base"
                >
                  Créer mon espace gratuitement
                  <ArrowRight size={18} />
                </Link>
              )}
              <Link
                href="#how"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:border-sky-300 font-medium px-8 py-4 rounded-2xl transition-all text-base shadow-sm"
              >
                <Play size={16} className="text-sky-500" />
                Voir comment ça marche
              </Link>
            </div>

            <div className="mt-14 grid grid-cols-3 gap-4 max-w-lg mx-auto">
              {HERO_STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-slate-800">{s.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* LOGOS CONFIANCE */}
      <section className="py-10 bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-center text-xs font-medium text-slate-400 uppercase tracking-widest mb-6">
            Paiements acceptés
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12">
            {PAYMENT_METHODS.map((m) => (
              <div key={m} className="text-sm font-bold text-slate-400 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                {m}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-16 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-sky-600 uppercase tracking-widest">Fonctionnalités</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mt-2 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Une plateforme complète pour créer, vendre et gérer vos formations en ligne
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat) => {
              const Icon = feat.icon
              return (
                <div
                  key={feat.title}
                  className="group bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${feat.color}`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2 text-base">{feat.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{feat.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* COMMENT CA MARCHE */}
      <section id="how" className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-sky-600 uppercase tracking-widest">Processus</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mt-2 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-slate-500">Lancez votre formation en 4 étapes simples</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex items-start gap-5 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-sky-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md shadow-sky-200">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">{step.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-16 sm:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-sky-600 uppercase tracking-widest">Tarifs</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mt-2 mb-4">
              Simple et transparent
            </h2>
            <p className="text-slate-500">Commencez gratuitement, évoluez selon vos besoins</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border relative ${
                  plan.featured
                    ? 'bg-sky-600 border-sky-600 text-white shadow-2xl shadow-sky-200 scale-105'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                    Populaire
                  </span>
                )}
                <h3 className={`text-xl font-bold mb-1 ${plan.featured ? 'text-white' : 'text-slate-800'}`}>
                  {plan.name}
                </h3>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-4xl font-bold ${plan.featured ? 'text-white' : 'text-slate-800'}`}>
                    {plan.price}
                  </span>
                </div>
                <p className={`text-sm mb-6 ${plan.featured ? 'text-sky-200' : 'text-slate-400'}`}>
                  {plan.period}
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((planFeat) => (
                    <li key={planFeat} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle size={16} className={plan.featured ? 'text-sky-200 flex-shrink-0' : 'text-green-500 flex-shrink-0'} />
                      <span className={plan.featured ? 'text-sky-100' : 'text-slate-600'}>{planFeat}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                    plan.featured
                      ? 'bg-white text-sky-600 hover:bg-sky-50'
                      : 'bg-sky-600 text-white hover:bg-sky-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-sky-600 uppercase tracking-widest">FAQ</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mt-2 mb-4">
              Questions fréquentes
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-medium text-slate-800 text-sm pr-4">{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-slate-400 flex-shrink-0 transition-transform ${faqOpen === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {faqOpen === i && (
                  <div className="px-5 pb-5">
                    <p className="text-slate-500 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-sky-600 to-sky-700">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Award size={32} className="text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Prêt à partager votre expertise ?
          </h2>
          <p className="text-sky-100 mb-10 text-lg max-w-xl mx-auto">
            Rejoignez des milliers de formateurs africains qui transmettent
            leur savoir sur LFD Web Learn
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg text-base"
              >
                <LayoutDashboard size={18} />
                Mon tableau de bord
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg text-base"
                >
                  Créer mon compte gratuitement
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-medium px-8 py-4 rounded-2xl transition-all text-base"
                >
                  J&apos;ai déjà un compte
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-sky-600 rounded-xl flex items-center justify-center">
                  <BookOpen size={16} className="text-white" />
                </div>
                <span className="font-bold text-white">
                  <span className="text-sky-400">LFD</span>
                  <span className="text-orange-400"> Web Learn</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed mb-4">
                La plateforme de formation en ligne professionnelle dédiée à l&apos;Afrique.
                Par La faveur infinie de Dieu.
              </p>
              <div className="flex items-center gap-3">
                {SOCIALS.map((s) => {
                  const Icon = s.icon
                  return (
                    <Link
                      key={s.label}
                      href={s.href}
                      className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-sky-600 flex items-center justify-center transition-all"
                    >
                      <Icon size={16} className="text-slate-400 hover:text-white" />
                    </Link>
                  )
                })}
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Plateforme</h4>
              <ul className="space-y-2.5">
                {FOOTER_PLATFORM.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Légal</h4>
              <ul className="space-y-2.5">
                {FOOTER_LEGAL.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2.5 text-sm">
                  <Mail size={15} className="text-sky-400 flex-shrink-0" />
                  contact@lfdweblearn.com
                </li>
                <li className="flex items-center gap-2.5 text-sm">
                  <Phone size={15} className="text-sky-400 flex-shrink-0" />
                  +229 XX XX XX XX
                </li>
                <li className="flex items-center gap-2.5 text-sm">
                  <MapPin size={15} className="text-sky-400 flex-shrink-0" />
                  Cotonou, Bénin
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-center sm:text-left">
              © 2024 LFD Web Learn —{' '}
              <span className="text-sky-400">La faveur infinie de Dieu</span>.
              Tous droits réservés.
            </p>
            <div className="flex items-center gap-1 text-sm">
              <span>Fait avec</span>
              <Heart size={14} className="text-red-400 mx-1" />
              <span>pour l&apos;Afrique</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}