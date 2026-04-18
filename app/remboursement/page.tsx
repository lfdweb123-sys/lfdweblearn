// app/remboursement/page.tsx
import Link from 'next/link'
import { BookOpen, ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Politique de remboursement — LFD Web Learn' }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-slate-800 mb-3">{title}</h2>
      <div className="text-slate-600 text-sm leading-relaxed">{children}</div>
    </div>
  )
}

export default function Remboursement() {
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
            Politique de remboursement
          </h1>
          <Section title="Délai de remboursement">
            <p>Vous disposez d'un délai de <strong>7 jours</strong> après votre achat pour demander un remboursement, à condition de ne pas avoir accédé à plus de 20% du contenu de la formation.</p>
          </Section>
          <Section title="Conditions de remboursement">
            <ul className="list-disc list-inside space-y-2">
              <li>La demande doit être effectuée dans les 7 jours suivant l'achat</li>
              <li>Moins de 20% du contenu doit avoir été consulté</li>
              <li>La demande doit être motivée (problème technique, contenu non conforme)</li>
            </ul>
          </Section>
          <Section title="Procédure">
            <p>Pour demander un remboursement, contactez-nous à <strong>contact@lfdweblearn.com</strong> en indiquant votre email, la formation achetée et la raison de votre demande. Nous traitons les demandes sous 3 à 5 jours ouvrés.</p>
          </Section>
          <Section title="Remboursement effectif">
            <p>Le remboursement est effectué via le même moyen de paiement utilisé lors de l'achat (Mobile Money). Le délai de réception dépend de votre opérateur.</p>
          </Section>
          <Section title="Exceptions">
            <p>Aucun remboursement ne sera accordé pour les formations gratuites, ni pour les formations dont plus de 20% du contenu a été consulté.</p>
          </Section>
          <Section title="Contact">
            <p>La faveur infinie de Dieu — contact@lfdweblearn.com — Cotonou, Bénin</p>
          </Section>
        </div>
      </main>
    </div>
  )
}