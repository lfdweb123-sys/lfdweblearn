// components/payment/PaymentButton.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ShoppingCart, Loader } from 'lucide-react'
import type { Course } from '@/types'
import { formatPrice } from '@/lib/utils'

// Import dynamique du SDK Feexpay
import dynamic from 'next/dynamic'

const FeexPayProvider = dynamic(
  () => import('@feexpay/react-sdk').then((m) => m.FeexPayProvider),
  { ssr: false }
)

const FeexPayButton = dynamic(
  () => import('@feexpay/react-sdk').then((m) => m.FeexPayButton),
  { ssr: false }
)

interface PaymentButtonProps {
  course: Course
  onSuccess?: () => void
}

export default function PaymentButton({
  course,
  onSuccess,
}: PaymentButtonProps) {
  const { firebaseUser, userProfile, isAuthenticated } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [paymentData, setPaymentData] = useState<{
    customId: string
    amount: number
    currency: string
    shopId: string
    userEmail: string
    userFullname: string
    courseTitle: string
  } | null>(null)
  const [showPayment, setShowPayment] = useState(false)

  // Si formation gratuite
  if (course.price === 0) {
    return (
      <EnrollFreeButton
        courseId={course.id}
        instructorId={course.instructorId}
        accessType={course.accessType}
        accessDuration={course.accessDuration}
        onSuccess={onSuccess}
      />
    )
  }

  const handleInitiatePayment = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/courses/${course.id}`)
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
          toast.error('Vous êtes déjà inscrit à cette formation')
          router.push('/dashboard')
          return
        }
        throw new Error(data.error)
      }

      setPaymentData(data)
      setShowPayment(true)
    } catch (error) {
      toast.error('Erreur lors de l\'initialisation du paiement')
    } finally {
      setLoading(false)
    }
  }

  // Callback après paiement Feexpay
  const handlePaymentCallback = async (response: {
    status: string
    reference?: string
  }) => {
    if (response.status === 'SUCCESS' || response.status === 'success') {
      toast.loading('Vérification du paiement...', { id: 'verify' })

      // Polling pour vérifier que le webhook a été reçu
      let attempts = 0
      const maxAttempts = 10

      const checkPayment = async () => {
        attempts++
        try {
          const res = await fetch(
            `/api/payments/verify?customId=${paymentData?.customId}`,
            { credentials: 'include' }
          )
          const data = await res.json()

          if (data.hasAccess) {
            toast.success('Paiement confirmé ! Accès débloqué.', {
              id: 'verify',
            })
            setShowPayment(false)
            onSuccess?.()
            router.push(`/dashboard`)
          } else if (attempts < maxAttempts) {
            setTimeout(checkPayment, 2000)
          } else {
            toast.success(
              'Paiement reçu. Votre accès sera disponible dans quelques instants.',
              { id: 'verify', duration: 6000 }
            )
            router.push('/dashboard')
          }
        } catch {
          toast.error('Erreur de vérification', { id: 'verify' })
        }
      }

      setTimeout(checkPayment, 3000)
    } else {
      toast.error('Paiement échoué ou annulé')
      setShowPayment(false)
    }
  }

  return (
    <div>
      {!showPayment ? (
        <button
          onClick={handleInitiatePayment}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-2xl transition-all disabled:opacity-50 text-lg shadow-lg shadow-orange-200"
        >
          {loading ? (
            <Loader size={22} className="animate-spin" />
          ) : (
            <>
              <ShoppingCart size={22} />
              Acheter — {formatPrice(course.price, course.currency)}
            </>
          )}
        </button>
      ) : paymentData ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500 text-center mb-4">
            Finalisez votre paiement Mobile Money
          </p>
          {/* Import CSS Feexpay */}
          <style>{`@import url('https://cdn.jsdelivr.net/npm/@feexpay/react-sdk/dist/style.css');`}</style>
          <FeexPayProvider>
            <FeexPayButton
              amount={paymentData.amount}
              description={`Formation: ${paymentData.courseTitle}`}
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
              callback={handlePaymentCallback}
              buttonText={`Payer ${formatPrice(paymentData.amount, paymentData.currency)}`}
              buttonClass="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-xl transition-all"
            />
          </FeexPayProvider>
          <button
            onClick={() => setShowPayment(false)}
            className="w-full mt-3 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Annuler
          </button>
        </div>
      ) : null}
    </div>
  )
}

// ── Inscription formation gratuite ───────────────────────────
function EnrollFreeButton({
  courseId,
  instructorId,
  accessType,
  accessDuration,
  onSuccess,
}: {
  courseId: string
  instructorId: string
  accessType: string
  accessDuration?: number
  onSuccess?: () => void
}) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/courses/${courseId}`)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/enrollments/free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ courseId, instructorId, accessType, accessDuration }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          toast.error('Vous êtes déjà inscrit')
          router.push('/dashboard')
          return
        }
        throw new Error(data.error)
      }

      toast.success('Inscription réussie !')
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
      className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-2xl transition-all disabled:opacity-50 text-lg"
    >
      {loading ? (
        <Loader size={22} className="animate-spin" />
      ) : (
        'S\'inscrire gratuitement'
      )}
    </button>
  )
}