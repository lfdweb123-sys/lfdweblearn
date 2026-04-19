// components/payment/PaymentButton.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ShoppingCart, Loader } from 'lucide-react'
import type { Course } from '@/types'
import { formatPrice } from '@/lib/utils'
import dynamic from 'next/dynamic'
import '@feexpay/react-sdk/style.css'

const FeexPayProvider = dynamic(
  () => import('@feexpay/react-sdk').then((m) => m.FeexPayProvider),
  { ssr: false }
)
const FeexPayButton = dynamic(
  () => import('@feexpay/react-sdk').then((m) => m.FeexPayButton),
  {
    ssr: false,
    loading: () => (
      <button
        disabled
        style={{ width: '100%', backgroundColor: '#0284c7', color: 'white', fontWeight: 'bold', padding: '12px 16px', borderRadius: '12px', border: 'none', cursor: 'not-allowed', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
      >
        <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        Chargement...
      </button>
    )
  }
)

interface PaymentButtonProps {
  course: Course
  onSuccess?: () => void
}

export default function PaymentButton({ course, onSuccess }: PaymentButtonProps) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentData, setPaymentData] = useState<{
    customId: string
    amount: number
    currency: string
    shopId: string
    userEmail: string
    userFullname: string
    courseTitle: string
  } | null>(null)

  if (course.price === 0) {
    return <EnrollFreeButton course={course} onSuccess={onSuccess} />
  }

  const handleInitiate = async () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/courses/' + course.id)
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ courseId: course.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409) {
          toast.error('Vous etes deja inscrit')
          router.push('/dashboard')
          return
        }
        throw new Error(data.error)
      }
      setPaymentData(data)
      setShowPayment(true)
    } catch {
      toast.error("Erreur lors de l'initialisation du paiement")
    } finally {
      setLoading(false)
    }
  }

  const handleCallback = async (response: { status: string }) => {
    if (response.status === 'SUCCESS' || response.status === 'success') {
      toast.loading('Verification du paiement...', { id: 'verify' })
      let attempts = 0
      const check = async () => {
        attempts++
        try {
          const res = await fetch(
            '/api/payments/verify?customId=' + paymentData?.customId,
            { credentials: 'include' }
          )
          const data = await res.json()
          if (data.hasAccess) {
            toast.success('Paiement confirme ! Acces debloque.', { id: 'verify' })
            setShowPayment(false)
            onSuccess?.()
            router.push('/dashboard')
          } else if (attempts < 10) {
            setTimeout(check, 2000)
          } else {
            toast.success('Paiement recu. Acces disponible sous peu.', { id: 'verify', duration: 6000 })
            router.push('/dashboard')
          }
        } catch {
          toast.error('Erreur de verification', { id: 'verify' })
        }
      }
      setTimeout(check, 3000)
    } else {
      toast.error('Paiement echoue ou annule')
      setShowPayment(false)
    }
  }

  const btnStyle = {
    width: '100%',
    backgroundColor: '#0284c7',
    color: 'white',
    fontWeight: 'bold',
    padding: '12px 16px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'block',
    textAlign: 'center' as const,
  }

  return (
    <div>
      {!showPayment ? (
        <button
          onClick={handleInitiate}
          disabled={loading}
          style={{
            width: '100%',
            backgroundColor: loading ? '#f97316aa' : '#f97316',
            color: 'white',
            fontWeight: 'bold',
            padding: '12px 20px',
            borderRadius: '12px',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(249,115,22,0.3)',
          }}
        >
          {loading ? (
            <Loader size={18} />
          ) : (
            <>
              <ShoppingCart size={18} />
              Acheter · {formatPrice(course.price, course.currency)}
            </>
          )}
        </button>
      ) : paymentData ? (
        <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '16px' }}>
          <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', marginBottom: '12px' }}>
            Finalisez votre paiement Mobile Money
          </p>
          <FeexPayProvider>
            <div style={{ width: '100%' }}>
              <FeexPayButton
                amount={paymentData.amount}
                description={'Formation: ' + paymentData.courseTitle}
                token={process.env.NEXT_PUBLIC_FEEXPAY_API_KEY || ''}
                id={paymentData.shopId}
                customId={paymentData.customId}
                callback_info={{
                  email: paymentData.userEmail,
                  fullname: paymentData.userFullname,
                  courseId: course.id,
                }}
                mode="LIVE"
                case="MOBILE"
                currency={paymentData.currency as 'XOF' | 'XAF'}
                callback={handleCallback}
                buttonText={'Payer ' + formatPrice(paymentData.amount, paymentData.currency)}
                buttonClass="feexpay-pay-btn"
              />
            </div>
          </FeexPayProvider>
          <button
            onClick={() => setShowPayment(false)}
            style={{ width: '100%', marginTop: '10px', fontSize: '13px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
          >
            Annuler
          </button>
        </div>
      ) : null}
    </div>
  )
}

function EnrollFreeButton({ course, onSuccess }: { course: Course; onSuccess?: () => void }) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/courses/' + course.id)
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/enrollments/free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseId: course.id,
          instructorId: course.instructorId,
          accessType: course.accessType,
          accessDuration: course.accessDuration,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409) {
          toast.error('Vous etes deja inscrit')
          router.push('/dashboard')
          return
        }
        throw new Error(data.error)
      }
      toast.success('Inscription reussie !')
      onSuccess?.()
      router.push('/dashboard')
    } catch {
      toast.error("Erreur lors de l'inscription")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleEnroll}
      disabled={loading}
      style={{
        width: '100%',
        backgroundColor: loading ? '#16a34aaa' : '#16a34a',
        color: 'white',
        fontWeight: 'bold',
        padding: '12px 20px',
        borderRadius: '12px',
        border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      }}
    >
      {loading ? <Loader size={18} /> : "S'inscrire gratuitement"}
    </button>
  )
}