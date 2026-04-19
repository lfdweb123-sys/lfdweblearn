// app/(auth)/forgot-password/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { resetPassword } from '@/lib/firebase/auth'
import toast from 'react-hot-toast'
import { BookOpen, ArrowLeft, Mail } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Email invalide'),
})

type Form = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: Form) => {
    setLoading(true)
    try {
      await resetPassword(data.email)
      setSent(true)
      toast.success('Email envoyé !')
    } catch {
      toast.error('Aucun compte trouvé avec cet email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 justify-center">
            <div className="w-9 h-9 bg-sky-600 rounded-xl flex items-center justify-center">
              <BookOpen size={18} className="text-white" />
            </div>
            <span className="text-2xl font-bold">
              <span className="text-sky-600">LFD</span>
              <span className="text-orange-500"> Web Learn</span>
            </span>
          </Link>
          <p className="mt-2 text-slate-500 text-sm">
            Réinitialisation du mot de passe
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <Mail size={28} className="text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Email envoyé !</h2>
              <p className="text-slate-500 text-sm">
                Vérifiez votre boîte mail et suivez le lien pour réinitialiser votre mot de passe.
              </p>
              <Link
                href="/login"
                className="block w-full text-center bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl transition-all mt-4"
              >
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <Link href="/login" className="text-slate-400 hover:text-slate-600 transition-colors">
                  <ArrowLeft size={20} />
                </Link>
                <h1 className="text-xl font-bold text-slate-800">Mot de passe oublié</h1>
              </div>
              <p className="text-slate-500 text-sm mb-6">
                Entrez votre email et nous vous enverrons un lien de réinitialisation.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="vous@exemple.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    'Envoyer le lien'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}