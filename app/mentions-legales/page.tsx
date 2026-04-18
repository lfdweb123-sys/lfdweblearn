// app/mentions-legales/page.tsx
import Link from 'next/link'
import { BookOpen, ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Mentions légales — LFD Web Learn' }

export default function MentionsLegales() {
  return (
    <LegalLayout title="Mentions légales">
      <Section title="Éditeur du site">
        <p>Le site LFD Web Learn est édité par <strong>La faveur infinie de Dieu</strong>, entreprise basée à Cotonou, Bénin.</p>
        <p className="mt-2">Email : contact@lfdweblearn.com</p>
      </Section>
      <Section title="Hébergement">
        <p>Le site est hébergé par <strong>Vercel Inc.</strong>, 340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis.</p>
      </Section>
      <Section title="Propriété intellectuelle">
        <p>L'ensemble du contenu de ce site (textes, images, vidéos, logos) est la propriété exclusive de La faveur infinie de Dieu et est protégé par les lois sur la propriété intellectuelle. Toute reproduction est interdite sans autorisation préalable.</p>
      </Section>
      <Section title="Responsabilité">
        <p>LFD Web Learn s'efforce d'assurer l'exactitude des informations diffusées sur ce site. Cependant, elle ne peut garantir l'exhaustivité et l'absence d'erreur de ces informations.</p>
      </Section>
    </LegalLayout>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-slate-800 mb-3">{title}</h2>
      <div className="text-slate-600 text-sm leading-relaxed">{children}</div>
    </div>
  )
}

function LegalLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sky-600 rounded-xl flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <span className="font-bold"><span className="text-sky-600">LFD</span><span className="text-orange-500"> Web Learn</span></span>
          </Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-sky-600 mb-8 transition-colors">
          <ArrowLeft size={16} />
          Retour à l'accueil
        </Link>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-10 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-8 pb-6 border-b border-slate-100">{title}</h1>
          {children}
        </div>
        <p className="text-center text-xs text-slate-400 mt-8">
          © 2024 LFD Web Learn — La faveur infinie de Dieu
        </p>
      </main>
    </div>
  )
}