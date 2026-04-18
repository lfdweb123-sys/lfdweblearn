// app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { loginWithEmail, loginWithGoogle } from '@/lib/firebase/auth'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      await loginWithEmail(data.email, data.password)
      toast.success('Connexion réussie !')
      router.push(redirect)
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'Erreur de connexion'
      if (msg.includes('user-not-found') || msg.includes('wrong-password')) {
        toast.error('Email ou mot de passe incorrect')
      } else {
        toast.error('Une erreur est survenue')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    try {
      await loginWithGoogle()
      toast.success('Connexion réussie !')
      router.push(redirect)
    } catch {
      toast.error('Connexion Google échouée')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-3xl font-bold text-sky-600">LFD</span>
            <span className="text-3xl font-bold text-orange-500"> Web Learn</span>
          </Link>
          <p className="mt-2 text-slate-500 text-sm">
            Connectez-vous à votre espace
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <h1 className="text-2xl font-bold text-slate-800 mb-6">Connexion</h1>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 border border-slate-200 rounded-xl py-3 px-4 text-slate-700 font-medium hover:bg-slate-50 transition-all mb-6 disabled:opacity-50"
          >
            {googleLoading ? (
              <span className="animate-spin h-5 w-5 border-2 border-slate-400 border-t-transparent rounded-full" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continuer avec Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-slate-400 text-sm">ou</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent',
                  'transition-all',
                  errors.email ? 'border-red-400 bg-red-50' : 'border-slate-200'
                )}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">
                  Mot de passe
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-sky-600 hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className={cn(
                  'w-full px-4 py-3 rounded-xl border text-slate-800 placeholder-slate-400',
                  'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent',
                  'transition-all',
                  errors.password ? 'border-red-400 bg-red-50' : 'border-slate-200'
                )}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-sky-600 font-medium hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}