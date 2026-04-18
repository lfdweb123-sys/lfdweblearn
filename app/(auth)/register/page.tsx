// app/(auth)/register/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { registerWithEmail, loginWithGoogle } from '@/lib/firebase/auth'
import { cn } from '@/lib/utils'

const registerSchema = z
  .object({
    displayName: z.string().min(2, 'Minimum 2 caractères'),
    email: z.string().email('Email invalide'),
    password: z.string().min(6, 'Minimum 6 caractères'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    try {
      await registerWithEmail(data.email, data.password, data.displayName)
      toast.success('Compte créé avec succès !')
      router.push('/dashboard')
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : ''
      if (msg.includes('email-already-in-use')) {
        toast.error('Cet email est déjà utilisé')
      } else {
        toast.error('Erreur lors de la création du compte')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    try {
      await loginWithGoogle()
      toast.success('Compte créé avec succès !')
      router.push('/dashboard')
    } catch {
      toast.error('Connexion Google échouée')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-3xl font-bold text-sky-600">LFD</span>
            <span className="text-3xl font-bold text-orange-500"> Web Learn</span>
          </Link>
          <p className="mt-2 text-slate-500 text-sm">
            Créez votre compte gratuitement
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <h1 className="text-2xl font-bold text-slate-800 mb-6">Inscription</h1>

          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 border border-slate-200 rounded-xl py-3 px-4 text-slate-700 font-medium hover:bg-slate-50 transition-all mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuer avec Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-slate-400 text-sm">ou</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nom complet
              </label>
              <input
                {...register('displayName')}
                type="text"
                placeholder="Jean Dupont"
                className={cn(
                  'w-full px-4 py-3 rounded-xl border text-slate-800 placeholder-slate-400',
                  'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all',
                  errors.displayName ? 'border-red-400 bg-red-50' : 'border-slate-200'
                )}
              />
              {errors.displayName && (
                <p className="text-red-500 text-xs mt-1">{errors.displayName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="vous@exemple.com"
                className={cn(
                  'w-full px-4 py-3 rounded-xl border text-slate-800 placeholder-slate-400',
                  'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all',
                  errors.email ? 'border-red-400 bg-red-50' : 'border-slate-200'
                )}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mot de passe
              </label>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className={cn(
                  'w-full px-4 py-3 rounded-xl border text-slate-800 placeholder-slate-400',
                  'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all',
                  errors.password ? 'border-red-400 bg-red-50' : 'border-slate-200'
                )}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Confirmer le mot de passe
              </label>
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder="••••••••"
                className={cn(
                  'w-full px-4 py-3 rounded-xl border text-slate-800 placeholder-slate-400',
                  'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all',
                  errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-slate-200'
                )}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-sky-600 font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}