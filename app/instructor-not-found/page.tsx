// app/instructor-not-found/page.tsx
import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export default function InstructorNotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <BookOpen size={28} className="text-sky-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Page introuvable
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          Ce formateur n'existe pas ou son domaine n'est pas encore configure.
        </p>
        <Link
          href="https://lfdweblearn.com"
          className="inline-flex items-center gap-2 bg-sky-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-sky-700 transition-all"
        >
          Retour a LFD Web Learn
        </Link>
      </div>
    </div>
  )
}