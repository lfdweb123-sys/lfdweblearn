// app/(public)/page.tsx
import Link from 'next/link'
import { BookOpen, Shield, Zap, Globe, Users, Star, ArrowRight, CheckCircle } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ─────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sky-600 rounded-xl flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-800">
              <span className="text-sky-600">LFD</span>
              <span className="text-orange-500"> Web Learn</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-6 text-sm text-slate-600">
            <a href="#features" className="hover:text-sky-600 transition-colors">
              Fonctionnalités
            </a>
            <a href="#pricing" className="hover:text-sky-600 transition-colors">
              Tarifs
            </a>
            <a href="#how" className="hover:text-sky-600 transition-colors">
              Comment ça marche
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-slate-600 hover:text-sky-600 transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all"
            >
              Commencer
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-orange-50" />
        <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-28">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-200 rounded-full px-4 py-1.5 text-sky-700 text-sm font-medium mb-6">
              <Zap size={14} className="text-orange-500" />
              La plateforme de formation N°1 en Afrique
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-800 leading-tight mb-6">
              Créez et vendez vos{' '}
              <span className="text-sky-600">formations</span> en ligne
              <br />
              <span className="text-orange-500">facilement</span>
            </h1>

            <p className="text-slate-500 text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
              Partagez votre expertise, construisez votre audience et générez
              des revenus grâce à Mobile Money. Conçu pour l'Afrique.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-sky-200 text-base w-full sm:w-auto justify-center"
              >
                Créer mon espace gratuitement
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 border border-slate-200 text-slate-700 hover:border-sky-300 font-medium px-8 py-4 rounded-2xl transition-all text-base w-full sm:w-auto justify-center"
              >
                <BookOpen size={18} />
                Voir les formations
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 mt-12 text-sm text-slate-400">
              {[
                { value: '100%', label: 'Gratuit pour commencer' },
                { value: 'Mobile Money', label: 'Paiement accepté' },
                { value: 'Sécurisé', label: 'Contenu protégé' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-bold text-slate-700 text-base">{stat.value}</p>
                  <p className="text-xs mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────── */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Une plateforme complète pour créer, vendre et gérer vos
              formations en ligne
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${feature.color}`}
                  >
                    <Icon size={22} />
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ──────────────────────────── */}
      <section id="how" className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">
              Comment ça marche ?
            </h2>
            <p className="text-slate-500">
              Lancez votre formation en 4 étapes simples
            </p>
          </div>

          <div className="space-y-6">
            {STEPS.map((step, index) => (
              <div
                key={step.title}
                className="flex items-start gap-6 bg-white rounded-2xl p-6 border border-slate-100"
              >
                <div className="w-12 h-12 bg-sky-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">
                    {step.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────── */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">
              Tarifs simples et transparents
            </h2>
            <p className="text-slate-500">
              Commencez gratuitement, évoluez selon vos besoins
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border ${
                  plan.featured
                    ? 'bg-sky-600 border-sky-600 text-white'
                    : 'bg-white border-slate-200'
                }`}
              >
                {plan.featured && (
                  <span className="inline-block bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                    Populaire
                  </span>
                )}
                <h3
                  className={`text-xl font-bold mb-1 ${
                    plan.featured ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`text-3xl font-bold mb-1 ${
                    plan.featured ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  {plan.price}
                </p>
                <p
                  className={`text-sm mb-6 ${
                    plan.featured ? 'text-sky-200' : 'text-slate-400'
                  }`}
                >
                  {plan.period}
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle
                        size={16}
                        className={
                          plan.featured ? 'text-sky-200' : 'text-green-500'
                        }
                      />
                      <span
                        className={
                          plan.featured ? 'text-sky-100' : 'text-slate-600'
                        }
                      >
                        {f}
                      </span>
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

      {/* ── CTA Final ──────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-sky-600 to-sky-700">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à lancer votre formation ?
          </h2>
          <p className="text-sky-100 mb-8 text-lg">
            Rejoignez des milliers de formateurs africains qui partagent
            leur expertise sur LFD Web Learn
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg text-base"
          >
            Créer mon compte gratuitement
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="bg-slate-900 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-sky-600 rounded-lg flex items-center justify-center">
                <BookOpen size={14} className="text-white" />
              </div>
              <span className="font-bold text-white">
                <span className="text-sky-400">LFD</span>
                <span className="text-orange-400"> Web Learn</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <Link href="/login" className="hover:text-white transition-colors">
                Connexion
              </Link>
              <Link href="/register" className="hover:text-white transition-colors">
                Inscription
              </Link>
            </div>
            <p className="text-slate-500 text-sm">
              © 2024 LFD Web Learn. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ── Data ─────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: BookOpen,
    title: 'Créez vos formations',
    description: 'Vidéos, PDFs, audios, images. Organisez en modules et leçons avec une interface intuitive.',
    color: 'bg-sky-50 text-sky-600',
  },
  {
    icon: Shield,
    title: 'Contenu protégé',
    description: 'Streaming sécurisé anti-téléchargement. Tokens signés, watermark et protection DRM simple.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: Zap,
    title: 'Paiement Mobile Money',
    description: 'Intégration Feexpay complète. Acceptez les paiements MTN, Moov, et Wave en quelques secondes.',
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
    description: 'Tableau de bord, progression, historique des achats. Expérience d\'apprentissage optimale.',
    color: 'bg-teal-50 text-teal-600',
  },
  {
    icon: Star,
    title: 'Multi-formateurs',
    description: 'Chaque formateur a sa propre vitrine personnalisable avec couleurs, logo et contenu.',
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
    description: 'Ajoutez vos modules, uploadez vos vidéos, PDFs et autres contenus pédagogiques.',
  },
  {
    title: 'Personnalisez votre page',
    description: 'Configurez vos couleurs, votre logo et votre domaine pour une image professionnelle.',
  },
  {
    title: 'Vendez et encaissez',
    description: 'Partagez votre lien, acceptez les paiements Mobile Money et suivez vos revenus.',
  },
]

const PLANS = [
  {
    name: 'Gratuit',
    price: '0 FCFA',
    period: 'pour toujours',
    featured: false,
    cta: 'Commencer gratuitement',
    features: [
      'Formations illimitées',
      'Sous-domaine inclus',
      'Paiement Mobile Money',
      'Espace élève',
      'Support email',
    ],
  },
  {
    name: 'Pro',
    price: '9 900 FCFA',
    period: 'par mois',
    featured: true,
    cta: 'Essayer 14 jours gratuit',
    features: [
      'Tout du plan Gratuit',
      'Domaine personnalisé',
      'Analytiques avancées',
      'Support prioritaire',
      'Certificats automatiques',
    ],
  },
]
