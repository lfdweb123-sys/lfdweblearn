// components/payment/PaymentButton.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ShoppingCart, Loader, X, Phone } from 'lucide-react'
import type { Course } from '@/types'
import { formatPrice } from '@/lib/utils'

interface PaymentButtonProps {
  course: Course
  onSuccess?: () => void
}

export default function PaymentButton({ course, onSuccess }: PaymentButtonProps) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
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
      setShowModal(true)
    } catch {
      toast.error('Erreur lors de l\'initialisation du paiement')
    } finally {
      setLoading(false)
    }
  }

  const handleFeexpayRedirect = () => {
    if (!paymentData) return
    // Construire l'URL Feexpay inline (sans SDK)
    const params = new URLSearchParams({
      amount: String(paymentData.amount),
      currency: paymentData.currency,
      description: 'Formation: ' + paymentData.courseTitle,
      token: process.env.NEXT_PUBLIC_FEEXPAY_API_KEY || '',
      id: paymentData.shopId,
      customId: paymentData.customId,
      mode: 'LIVE',
      callback_url: window.location.origin + '/api/payments/webhook',
      email: paymentData.userEmail,
      fullname: paymentData.userFullname,
    })
    // Ouvrir Feexpay dans une popup
    const popup = window.open(
      'https://feexpay.me/pay?' + params.toString(),
      'FeexPay',
      'width=500,height=600,scrollbars=yes'
    )
    // Vérifier la fermeture de la popup
    const timer = setInterval(async () => {
      if (popup?.closed) {
        clearInterval(timer)
        setShowModal(false)
        toast.loading('Verification du paiement...', { id: 'verify' })
        await checkPayment(paymentData.customId)
      }
    }, 1000)
  }

  const checkPayment = async (customId: string) => {
    let attempts = 0
    const check = async () => {
      attempts++
      try {
        const res = await fetch('/api/payments/verify?customId=' + customId, {
          credentials: 'include',
        })
        const data = await res.json()
        if (data.hasAccess) {
          toast.success('Paiement confirme ! Acces debloque.', { id: 'verify' })
          onSuccess?.()
          router.push('/dashboard')
        } else if (attempts < 8) {
          setTimeout(check, 2500)
        } else {
          toast.success('Paiement recu. Acces disponible sous peu.', { id: 'verify', duration: 6000 })
          router.push('/dashboard')
        }
      } catch {
        toast.error('Erreur de verification', { id: 'verify' })
      }
    }
    setTimeout(check, 3000)
  }

  return (
    <>
      <button
        onClick={handleInitiate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-2xl transition-all disabled:opacity-50 text-lg shadow-lg shadow-orange-200"
      >
        {loading ? (
          <Loader size={22} className="animate-spin" />
        ) : (
          <>
            <ShoppingCart size={22} />
            Acheter - {formatPrice(course.price, course.currency)}
          </>
        )}
      </button>

      {showModal && paymentData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Finaliser le paiement</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-slate-600 mb-1">Formation</p>
              <p className="font-semibold text-slate-800">{paymentData.courseTitle}</p>
              <p className="text-2xl font-bold text-sky-600 mt-2">
                {formatPrice(paymentData.amount, paymentData.currency)}
              </p>
            </div>

            <button
              onClick={handleFeexpayRedirect}
              className="w-full flex items-center justify-center gap-3 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-xl transition-all mb-3"
            >
              <Phone size={20} />
              Payer par Mobile Money
            </button>

            <p className="text-xs text-slate-400 text-center">
              Vous serez redirige vers Feexpay pour finaliser le paiement
            </p>

            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-3 text-sm text-slate-400 hover:text-slate-600 transition-colors py-2"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function EnrollFreeButton({
  course,
  onSuccess,
}: {
  course: Course
  onSuccess?: () => void
}) {
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
      className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-2xl transition-all disabled:opacity-50 text-lg"
    >
      {loading ? <Loader size={22} className="animate-spin" /> : "S'inscrire gratuitement"}
    </button>
  )
}