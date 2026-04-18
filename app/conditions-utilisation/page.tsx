// app/conditions-utilisation/page.tsx
import Link from 'next/link'
import { BookOpen, ArrowLeft } from 'lucide-react'

export const metadata = { title: "Conditions d'utilisation — LFD Web Learn" }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-slate-800 mb-3">{title}</h2>
      <div className="text-slate-600 text-sm leading-relaxed">{children}</div>
    </div>
  )
}

export default function ConditionsUtilisation() {
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
            Conditions d'utilisation
          </h1>
          <Section title="Acceptation des conditions">
            <p>En utilisant LFD Web Learn, vous acceptez les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.</p>
          </Section>
          <Section title="Description du service">
            <p>LFD Web Learn est une plateforme de formation en ligne permettant aux formateurs de créer et vendre des formations, et aux élèves d'y accéder après paiement.</p>
          </Section>
          <Section title="Compte utilisateur">
            <p>Vous êtes responsable de la confidentialité de vos identifiants de connexion. Toute activité réalisée depuis votre compte est sous votre responsabilité.</p>
          </Section>
          <Section title="Contenu des formateurs">
            <p>Les formateurs sont seuls responsables du contenu qu'ils publient. LFD Web Learn se réserve le droit de supprimer tout contenu contraire aux bonnes moeurs, illégal ou trompeur.</p>
          </Section>
          <Section title="Paiements">
            <p>Les paiements sont traités par Feexpay. Une fois un achat effectué, l'accès à la formation est accordé automatiquement après confirmation du paiement.</p>
          </Section>
          <Section title="Propriété intellectuelle">
            <p>Le contenu des formations appartient aux formateurs. Les élèves obtiennent un droit d'accès personnel et non cessible aux formations achetées.</p>
          </Section>
          <Section title="Modification des CGU">
            <p>LFD Web Learn se réserve le droit de modifier ces conditions à tout moment. Les utilisateurs seront informés par email de toute modification substantielle.</p>
          </Section>
        </div>
      </main>
    </div>
  )
}