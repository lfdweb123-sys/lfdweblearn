// app/confidentialite/page.tsx
import Link from 'next/link'
import { BookOpen, ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Politique de confidentialité — LFD Web Learn' }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-slate-800 mb-3">{title}</h2>
      <div className="text-slate-600 text-sm leading-relaxed">{children}</div>
    </div>
  )
}

export default function Confidentialite() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center">
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
          Retour
        </Link>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-10 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-8 pb-6 border-b border-slate-100">
            Politique de confidentialité
          </h1>
          <Section title="Collecte des données">
            <p>LFD Web Learn collecte les données personnelles suivantes lors de votre inscription : nom, adresse email, et informations de paiement. Ces données sont nécessaires au fonctionnement du service.</p>
          </Section>
          <Section title="Utilisation des données">
            <p>Vos données sont utilisées exclusivement pour :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Gérer votre compte et vos accès aux formations</li>
              <li>Traiter vos paiements via Feexpay</li>
              <li>Vous envoyer des notifications relatives à votre compte</li>
            </ul>
          </Section>
          <Section title="Protection des données">
            <p>Vos données sont stockées de manière sécurisée sur Firebase (Google Cloud). Nous n'vendons jamais vos données à des tiers. Vous pouvez demander la suppression de votre compte à tout moment en nous contactant.</p>
          </Section>
          <Section title="Cookies">
            <p>Nous utilisons des cookies techniques nécessaires au fonctionnement du site (authentification, session). Aucun cookie publicitaire n'est utilisé.</p>
          </Section>
          <Section title="Vos droits">
            <p>Conformément aux lois en vigueur, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Contactez-nous à : contact@lfdweblearn.com</p>
          </Section>
          <Section title="Contact">
            <p>La faveur infinie de Dieu — contact@lfdweblearn.com — Cotonou, Bénin</p>
          </Section>
        </div>
      </main>
    </div>
  )
}