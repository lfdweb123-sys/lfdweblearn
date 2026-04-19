// app/instructor/subscription/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getDocument } from '@/lib/firebase/firestore'
import { formatPrice } from '@/lib/utils'
import { Check, Zap, Crown, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'
import '@feexpay/react-sdk/style.css'

const FeexPayProvider = dynamic(
  () => import('@feexpay/react-sdk').then((m) => m.FeexPayProvider),
  { ssr: false }
)
const FeexPayButton = dynamic(
  () => import('@feexpay/react-sdk').then((m) => m.FeexPayButton),
  { ssr: false }
)

const PLANS = [
  {
    id: 'monthly',
    name: 'Pro Mensuel',
    price: 9900,
    currency: 'XOF',
    period: 'mois',
    description: 'Facturation mensuelle',
    features: [
      'Formations illimitees',
      'Domaine personnalise',
      'Analytiques avancees',
      'Certificats automatiques',
      'Support prioritaire 24/7',
      'Integrations avancees',
    ],
    featured: false,
    icon: Zap,
  },
  {
    id: 'yearly',
    name: 'Pro Annuel',
    price: 99000,
    currency: 'XOF',
    period: 'an',
    description: 'Economisez 2 mois — Facturation annuelle',
    features: [
      'Tout du plan mensuel',
      '2 mois offerts',
      'Acces early features',
      'Badge formateur premium',
      'Onboarding dedie',
      'Support VIP direct',
    ],
    featured: true,
    icon: Crown,
  },
]

export default function InstructorSubscriptionPage() {
  const { userProfile, firebaseUser } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [currentSubscription, setCurrentSubscription] = useState<any>(null)

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!userProfile?.id) return
      try {
        const sub = await getDocument('subscriptions', userProfile.id)
        setCurrentSubscription(sub)
      } catch {}
    }
    fetchSubscription()
  }, [userProfile?.id])

  const handleSelectPlan = async (planId: string) => {
    if (!firebaseUser) return
    setLoading(true)
    setSelectedPlan(planId)
    try {
      const res = await fetch('/api/subscriptions/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ planId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPaymentData(data)
    } catch {
      toast.error('Erreur lors de l initialisation')
      setSelectedPlan(null)
    } finally {
      setLoading(false)
    }
  }

  const handleCallback = async (response: { status: string }) => {
    if (response.status === 'SUCCESS' || response.status === 'success') {
      toast.loading('Activation en cours...', { id: 'sub' })
      await new Promise((r) => setTimeout(r, 3000))
      toast.success('Abonnement Pro active !', { id: 'sub' })
      setCurrentSubscription({ status: 'active', planId: selectedPlan })
      setPaymentData(null)
      setSelectedPlan(null)
    } else {
      toast.error('Paiement echoue ou annule')
      setPaymentData(null)
      setSelectedPlan(null)
    }
  }

  const isActive = currentSubscription?.status === 'active'

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Abonnement Pro</h1>
        <p className="text-slate-500 text-sm mt-1">
          Debloquez toutes les fonctionnalites pour developper votre activite
        </p>
      </div>

      {isActive && (
        <div className="bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl p-5 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown size={20} />
              <span className="font-bold text-lg">Abonnement Pro actif</span>
            </div>
            <p className="text-sky-100 text-sm">
              Plan {currentSubscription.planId === 'yearly' ? 'Annuel' : 'Mensuel'}
            </p>
          </div>
          <div className="bg-white/20 px-4 py-2 rounded-xl text-sm font-semibold">Actif</div>
        </div>
      )}

      {!paymentData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {PLANS.map((plan) => {
            const Icon = plan.icon
            return (
              <div
                key={plan.id}
                className={'rounded-2xl p-6 border relative ' + (
                  plan.featured
                    ? 'bg-sky-600 border-sky-600 text-white shadow-2xl shadow-sky-200'
                    : 'bg-white border-slate-200'
                )}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                    Meilleure valeur
                  </span>
                )}
                <div className={'w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ' + (plan.featured ? 'bg-white/20' : 'bg-sky-50')}>
                  <Icon size={22} className={plan.featured ? 'text-white' : 'text-sky-600'} />
                </div>
                <h3 className={'text-xl font-bold mb-1 ' + (plan.featured ? 'text-white' : 'text-slate-800')}>{plan.name}</h3>
                <div className="flex items-end gap-1 mb-1">
                  <span className={'text-3xl font-bold ' + (plan.featured ? 'text-white' : 'text-slate-800')}>
                    {formatPrice(plan.price, plan.currency)}
                  </span>
                  <span className={'text-sm mb-1 ' + (plan.featured ? 'text-sky-200' : 'text-slate-400')}>/{plan.period}</span>
                </div>
                <p className={'text-xs mb-5 ' + (plan.featured ? 'text-sky-200' : 'text-slate-400')}>{plan.description}</p>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check size={15} className={plan.featured ? 'text-sky-200 flex-shrink-0' : 'text-green-500 flex-shrink-0'} />
                      <span className={plan.featured ? 'text-sky-100' : 'text-slate-600'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loading || isActive}
                  className={'w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 ' + (
                    plan.featured
                      ? 'bg-white text-sky-600 hover:bg-sky-50'
                      : 'bg-sky-600 text-white hover:bg-sky-700'
                  )}
                >
                  {loading && selectedPlan === plan.id ? <Loader size={16} className="animate-spin" /> : null}
                  {isActive ? 'Deja abonne' : 'Choisir ce plan'}
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md mx-auto">
          <div className="text-center mb-6">
            <Crown size={32} className="text-sky-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">Finaliser votre abonnement</h3>
            <p className="text-slate-500 text-sm mt-1">
              Plan {paymentData.planName} — {formatPrice(paymentData.amount, paymentData.currency)}
            </p>
          </div>
          <FeexPayProvider>
            <FeexPayButton
              amount={paymentData.amount}
              description={'Abonnement LFD Web Learn - ' + paymentData.planName}
              token={process.env.NEXT_PUBLIC_FEEXPAY_API_KEY || ''}
              id={paymentData.shopId}
              customId={paymentData.customId}
              callback_info={{
                email: paymentData.userEmail,
                fullname: paymentData.userFullname,
              }}
              mode="LIVE"
              case="MOBILE"
              currency={paymentData.currency}
              callback={handleCallback}
              buttonText={'Payer ' + formatPrice(paymentData.amount, paymentData.currency)}
              buttonClass="feexpay-pay-btn"
            />
          </FeexPayProvider>
          <button
            onClick={() => { setPaymentData(null); setSelectedPlan(null) }}
            className="w-full mt-4 text-sm text-slate-400 hover:text-slate-600 py-2 transition-colors"
          >
            Annuler
          </button>
        </div>
      )}

      <div className="bg-slate-50 rounded-2xl p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Questions frequentes</h3>
        <div className="space-y-3">
          {[
            { q: 'Puis-je annuler a tout moment ?', a: 'Oui, vous pouvez annuler votre abonnement a tout moment depuis votre espace formateur.' },
            { q: 'Quels moyens de paiement acceptez-vous ?', a: 'Nous acceptons MTN Mobile Money, Moov Money, Wave et Orange Money via Feexpay.' },
            { q: 'Que se passe-t-il si je ne renouvelle pas ?', a: 'Votre compte passe en plan gratuit. Vos formations et eleves restent accessibles.' },
          ].map((faq) => (
            <div key={faq.q} className="bg-white rounded-xl p-4 border border-slate-200">
              <p className="text-sm font-medium text-slate-800 mb-1">{faq.q}</p>
              <p className="text-xs text-slate-500">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}