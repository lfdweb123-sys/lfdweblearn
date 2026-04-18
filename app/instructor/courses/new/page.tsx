// app/instructor/courses/new/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import {
  BookOpen, DollarSign, Clock, Globe,
  ChevronRight, Upload, X
} from 'lucide-react'
import Image from 'next/image'

const courseSchema = z.object({
  title: z.string().min(5, 'Minimum 5 caractères'),
  description: z.string().min(20, 'Minimum 20 caractères'),
  shortDescription: z.string().max(160, 'Maximum 160 caractères').optional(),
  price: z.number().min(0, 'Prix invalide'),
  currency: z.enum(['XOF', 'XAF', 'EUR']),
  accessType: z.enum(['lifetime', 'limited']),
  accessDuration: z.number().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  language: z.string().default('Français'),
})

type CourseForm = z.infer<typeof courseSchema>

export default function NewCoursePage() {
  const { userProfile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [thumbnailUploading, setThumbnailUploading] = useState(false)
  const [isFree, setIsFree] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      currency: 'XOF',
      accessType: 'lifetime',
      level: 'beginner',
      language: 'Français',
      price: 0,
    },
  })

  const accessType = watch('accessType')

  // Upload thumbnail vers Cloudinary
  const handleThumbnailUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Fichier image requis')
      return
    }
    setThumbnailUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append(
        'upload_preset',
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
      )
      formData.append('folder', 'lfd-web-learn/thumbnails')

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      )
      const data = await res.json()
      setThumbnail(data.secure_url)
      toast.success('Image uploadée')
    } catch {
      toast.error("Erreur lors de l'upload")
    } finally {
      setThumbnailUploading(false)
    }
  }

  const onSubmit = async (data: CourseForm) => {
    if (!userProfile?.id) return
    setLoading(true)
    try {
      const courseData = {
        ...data,
        price: isFree ? 0 : data.price,
        instructorId: userProfile.id,
        status: 'draft',
        thumbnail: thumbnail || null,
        modules: [],
        totalLessons: 0,
        totalDuration: 0,
        tags: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, 'courses'), courseData)
      toast.success('Formation créée ! Ajoutez vos modules.')
      router.push(`/instructor/courses/${docRef.id}/edit`)
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Nouvelle formation
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Remplissez les informations de base de votre formation
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Thumbnail */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Upload size={18} className="text-sky-500" />
            Image de couverture
          </h2>

          <div
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
              thumbnail
                ? 'border-sky-200 bg-sky-50'
                : 'border-slate-200 hover:border-sky-300 hover:bg-sky-50'
            )}
            onClick={() => document.getElementById('thumbnail-input')?.click()}
          >
            {thumbnailUploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-500">Upload en cours...</p>
              </div>
            ) : thumbnail ? (
              <div className="relative inline-block">
                <img
                  src={thumbnail}
                  alt="Thumbnail"
                  className="w-48 h-28 object-cover rounded-lg mx-auto"
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setThumbnail(null) }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload size={32} className="text-slate-300" />
                <p className="text-sm text-slate-500">
                  Cliquez pour uploader une image
                </p>
                <p className="text-xs text-slate-400">PNG, JPG — Max 5MB</p>
              </div>
            )}
          </div>
          <input
            id="thumbnail-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleThumbnailUpload(file)
            }}
          />
        </div>

        {/* Infos générales */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <BookOpen size={18} className="text-sky-500" />
            Informations générales
          </h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Titre de la formation *
            </label>
            <input
              {...register('title')}
              placeholder="Ex: Maîtriser React en 30 jours"
              className={cn(
                'w-full px-4 py-3 rounded-xl border text-slate-800 placeholder-slate-400',
                'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all',
                errors.title ? 'border-red-400' : 'border-slate-200'
              )}
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description courte
              <span className="text-slate-400 font-normal ml-1">(visible sur la carte)</span>
            </label>
            <input
              {...register('shortDescription')}
              placeholder="Résumé en une phrase..."
              maxLength={160}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description complète *
            </label>
            <textarea
              {...register('description')}
              rows={5}
              placeholder="Décrivez votre formation en détail..."
              className={cn(
                'w-full px-4 py-3 rounded-xl border text-slate-800 placeholder-slate-400 resize-none',
                'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all',
                errors.description ? 'border-red-400' : 'border-slate-200'
              )}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Niveau
              </label>
              <select
                {...register('level')}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-white"
              >
                <option value="beginner">Débutant</option>
                <option value="intermediate">Intermédiaire</option>
                <option value="advanced">Avancé</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Langue
              </label>
              <input
                {...register('language')}
                placeholder="Français"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Prix */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <DollarSign size={18} className="text-sky-500" />
            Prix et accès
          </h2>

          {/* Gratuit / Payant */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setIsFree(false); setValue('price', 5000) }}
              className={cn(
                'flex-1 py-3 rounded-xl border text-sm font-medium transition-all',
                !isFree
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'
              )}
            >
              Payant
            </button>
            <button
              type="button"
              onClick={() => { setIsFree(true); setValue('price', 0) }}
              className={cn(
                'flex-1 py-3 rounded-xl border text-sm font-medium transition-all',
                isFree
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-green-300'
              )}
            >
              Gratuit
            </button>
          </div>

          {!isFree && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Prix *
                </label>
                <input
                  {...register('price', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  placeholder="5000"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border text-slate-800 placeholder-slate-400',
                    'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all',
                    errors.price ? 'border-red-400' : 'border-slate-200'
                  )}
                />
                {errors.price && (
                  <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Devise
                </label>
                <select
                  {...register('currency')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="XOF">XOF (FCFA)</option>
                  <option value="XAF">XAF (FCFA)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>
          )}

          {/* Type d'accès */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Type d'accès
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setValue('accessType', 'lifetime')}
                className={cn(
                  'flex-1 flex items-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all',
                  accessType === 'lifetime'
                    ? 'bg-sky-50 text-sky-700 border-sky-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-sky-200'
                )}
              >
                <Globe size={16} />
                À vie
              </button>
              <button
                type="button"
                onClick={() => setValue('accessType', 'limited')}
                className={cn(
                  'flex-1 flex items-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all',
                  accessType === 'limited'
                    ? 'bg-orange-50 text-orange-700 border-orange-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-orange-200'
                )}
              >
                <Clock size={16} />
                Durée limitée
              </button>
            </div>
          </div>

          {accessType === 'limited' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Durée d'accès (en jours)
              </label>
              <input
                {...register('accessDuration', { valueAsNumber: true })}
                type="number"
                min="1"
                placeholder="30"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
            </div>
          )}
        </div>

        {/* Bouton submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-4 rounded-xl transition-all disabled:opacity-50 text-base"
        >
          {loading ? (
            <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <>
              Créer la formation
              <ChevronRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  )
}