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
    bg: '#0284c7',
    color: 'white',
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
    bg: 'white',
    color: '#0284c7',
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
        <div style={{ background: 'linear-gradient(to right, #0ea5e9, #0284c7)', borderRadius: '16px', padding: '20px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Crown size={20} />
              <span style={{ fontWeight: 'bold', fontSize: '18px' }}>Abonnement Pro actif</span>
            </div>
            <p style={{ color: '#bae6fd', fontSize: '14px' }}>
              Plan {currentSubscription.planId === 'yearly' ? 'Annuel' : 'Mensuel'}
            </p>
          </div>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: '600' }}>
            Actif
          </div>
        </div>
      )}

      {!paymentData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {PLANS.map((plan) => {
            const Icon = plan.icon
            const cardBg = plan.featured ? '#0284c7' : 'white'
            const cardBorder = plan.featured ? '#0284c7' : '#e2e8f0'
            const titleColor = plan.featured ? 'white' : '#1e293b'
            const subColor = plan.featured ? '#bae6fd' : '#94a3b8'
            const featureColor = plan.featured ? '#e0f2fe' : '#475569'
            const checkColor = plan.featured ? '#bae6fd' : '#22c55e'

            return (
              <div
                key={plan.id}
                style={{
                  backgroundColor: cardBg,
                  border: '1px solid ' + cardBorder,
                  borderRadius: '16px',
                  padding: '24px',
                  position: 'relative',
                  boxShadow: plan.featured ? '0 25px 50px rgba(2,132,199,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                {plan.featured && (
                  <span style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#f97316',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    padding: '6px 16px',
                    borderRadius: '999px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    whiteSpace: 'nowrap',
                  }}>
                    Meilleure valeur
                  </span>
                )}

                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  backgroundColor: plan.featured ? 'rgba(255,255,255,0.2)' : '#f0f9ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '16px',
                }}>
                  <Icon size={22} color={plan.featured ? 'white' : '#0284c7'} />
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: titleColor, marginBottom: '4px' }}>
                  {plan.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '28px', fontWeight: 'bold', color: titleColor }}>
                    {formatPrice(plan.price, plan.currency)}
                  </span>
                  <span style={{ fontSize: '14px', color: subColor, marginBottom: '4px' }}>/{plan.period}</span>
                </div>
                <p style={{ fontSize: '12px', color: subColor, marginBottom: '20px' }}>{plan.description}</p>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {plan.features.map((feature) => (
                    <li key={feature} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                      <Check size={15} color={checkColor} style={{ flexShrink: 0 }} />
                      <span style={{ color: featureColor }}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loading || isActive}
                  style={{
                    width: '100%',
                    backgroundColor: plan.bg,
                    color: plan.color,
                    fontWeight: 'bold',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: plan.featured ? 'none' : '2px solid #0284c7',
                    cursor: loading || isActive ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: loading || isActive ? 0.6 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {loading && selectedPlan === plan.id ? <Loader size={16} /> : null}
                  {isActive ? 'Deja abonne' : 'Choisir ce plan'}
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', maxWidth: '420px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Crown size={32} color="#0284c7" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>Finaliser votre abonnement</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
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
            style={{ width: '100%', marginTop: '12px', fontSize: '13px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
          >
            Annuler
          </button>
        </div>
      )}

      <div style={{ backgroundColor: '#f8fafc', borderRadius: '16px', padding: '24px' }}>
        <h3 style={{ fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>Questions frequentes</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { q: 'Puis-je annuler a tout moment ?', a: 'Oui, vous pouvez annuler votre abonnement a tout moment depuis votre espace formateur.' },
            { q: 'Quels moyens de paiement acceptez-vous ?', a: 'Nous acceptons MTN Mobile Money, Moov Money, Wave et Orange Money via Feexpay.' },
            { q: 'Que se passe-t-il si je ne renouvelle pas ?', a: 'Votre compte passe en plan gratuit. Vos formations et eleves restent accessibles.' },
          ].map((faq) => (
            <div key={faq.q} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', marginBottom: '4px' }}>{faq.q}</p>
              <p style={{ fontSize: '12px', color: '#64748b' }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}