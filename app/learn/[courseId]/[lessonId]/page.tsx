// app/learn/[courseId]/[lessonId]/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getDocument, queryDocuments, updateDocument } from '@/lib/firebase/firestore'
import { where } from 'firebase/firestore'
import type { Course, Enrollment, Lesson, Module } from '@/types'
import VideoPlayer from '@/components/player/VideoPlayer'
import PDFViewer from '@/components/player/PDFViewer'
import AudioPlayer from '@/components/player/AudioPlayer'
import {
  ChevronLeft, ChevronRight, CheckCircle,
  Circle, Lock, BookOpen, ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function LearnPage() {
  const { courseId, lessonId } = useParams<{
    courseId: string
    lessonId: string
  }>()
  const { firebaseUser, userProfile } = useAuth()
  const router = useRouter()

  const [course, setCourse] = useState<Course | null>(null)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [allLessons, setAllLessons] = useState<Lesson[]>([])

  // ── Charger la formation et vérifier l'accès ─────────────
  useEffect(() => {
    const load = async () => {
      if (!courseId || !lessonId || !firebaseUser) return

      try {
        const [courseData, enrollments] = await Promise.all([
          getDocument<Course>('courses', courseId),
          queryDocuments<Enrollment>('enrollments', [
            where('userId', '==', firebaseUser.uid),
            where('courseId', '==', courseId),
          ]),
        ])

        if (!courseData) { router.push('/dashboard'); return }

        setCourse(courseData)

        const activeEnrollment = enrollments.find(
          (e) => e.status === 'active'
        )

        // Vérifier accès (inscrit, formateur ou admin)
        const isInstructor = courseData.instructorId === firebaseUser.uid
        const isAdmin = userProfile?.role === 'admin'

        if (!activeEnrollment && !isInstructor && !isAdmin) {
          setAccessDenied(true)
          setLoading(false)
          return
        }

        setEnrollment(activeEnrollment || null)

        // Aplatir tous les modules en liste de leçons
        const lessons = courseData.modules.flatMap((m: Module) =>
          m.lessons.map((l: Lesson) => ({ ...l, moduleTitle: m.title }))
        )
        setAllLessons(lessons)

        // Trouver la leçon courante
        const lesson = lessons.find((l: Lesson) => l.id === lessonId)
        if (!lesson) { router.push('/dashboard'); return }
        setCurrentLesson(lesson)

        // Obtenir URL signée pour les vidéos
        if (lesson.bunnyVideoId) {
          const token = await firebaseUser.getIdToken()
          const res = await fetch(
            `/api/media/signed-url?courseId=${courseId}&videoId=${lesson.bunnyVideoId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
              credentials: 'include',
            }
          )
          if (res.ok) {
            const { signedUrl: url } = await res.json()
            setSignedUrl(url)
          }
        } else if (lesson.mediaUrl) {
          setSignedUrl(lesson.mediaUrl)
        }
      } catch (error) {
        console.error('Erreur chargement leçon:', error)
        toast.error('Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [courseId, lessonId, firebaseUser, userProfile])

  // ── Marquer leçon comme complétée ───────────────────────
  const markComplete = useCallback(async () => {
    if (!enrollment || !currentLesson) return

    const completed = enrollment.progress.completedLessons || []
    if (completed.includes(currentLesson.id)) return

    const newCompleted = [...completed, currentLesson.id]
    const percentage = Math.round(
      (newCompleted.length / allLessons.length) * 100
    )

    try {
      await updateDocument('enrollments', enrollment.id, {
        progress: {
          ...enrollment.progress,
          completedLessons: newCompleted,
          lastLessonId: currentLesson.id,
          percentage,
        },
      })
      setEnrollment((prev) =>
        prev
          ? {
              ...prev,
              progress: {
                ...prev.progress,
                completedLessons: newCompleted,
                percentage,
              },
            }
          : prev
      )
    } catch (error) {
      console.error('Erreur progression:', error)
    }
  }, [enrollment, currentLesson, allLessons])

  // ── Navigation leçon précédente / suivante ───────────────
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId)
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson =
    currentIndex < allLessons.length - 1
      ? allLessons[currentIndex + 1]
      : null

  const navigateTo = (lesson: Lesson) => {
    router.push(`/learn/${courseId}/${lesson.id}`)
  }

  // ── Accès refusé ─────────────────────────────────────────
  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-sm p-8">
          <Lock size={48} className="text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Accès restreint
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            Vous devez acheter cette formation pour accéder à ce contenu.
          </p>
          <Link
            href={`/courses/${courseId}`}
            className="bg-sky-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-sky-700 transition-all"
          >
            Voir la formation
          </Link>
        </div>
      </div>
    )
  }

  // ── Chargement ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isCompleted = enrollment?.progress.completedLessons?.includes(
    currentLesson?.id || ''
  )

  return (
    <div
      className="min-h-screen bg-slate-900 flex"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Sidebar — liste des leçons */}
      <aside className="w-80 bg-slate-800 flex flex-col h-screen sticky top-0 overflow-hidden">
        {/* Header sidebar */}
        <div className="p-4 border-b border-slate-700">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors mb-3"
          >
            <ArrowLeft size={16} />
            Retour
          </Link>
          <h2 className="text-white font-semibold text-sm truncate">
            {course?.title}
          </h2>
          {enrollment && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Progression</span>
                <span>{enrollment.progress.percentage}%</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all"
                  style={{ width: `${enrollment.progress.percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Liste modules + leçons */}
        <div className="flex-1 overflow-y-auto py-2">
          {course?.modules.map((module: Module) => (
            <div key={module.id}>
              <p className="text-slate-400 text-xs font-medium px-4 py-2 uppercase tracking-wider">
                {module.title}
              </p>
              {module.lessons.map((lesson: Lesson) => {
                const isActive = lesson.id === lessonId
                const isDone =
                  enrollment?.progress.completedLessons?.includes(lesson.id)

                return (
                  <button
                    key={lesson.id}
                    onClick={() => navigateTo(lesson)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                      isActive
                        ? 'bg-sky-600/20 border-r-2 border-sky-500'
                        : 'hover:bg-slate-700/50'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle
                        size={16}
                        className="text-green-400 flex-shrink-0"
                      />
                    ) : (
                      <Circle
                        size={16}
                        className={`flex-shrink-0 ${
                          isActive ? 'text-sky-400' : 'text-slate-600'
                        }`}
                      />
                    )}
                    <span
                      className={`text-sm truncate ${
                        isActive
                          ? 'text-white font-medium'
                          : isDone
                          ? 'text-slate-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {lesson.title}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 flex flex-col overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h1 className="text-white font-semibold truncate max-w-lg">
            {currentLesson?.title}
          </h1>
          <div className="flex items-center gap-3 flex-shrink-0">
            {!isCompleted && (
              <button
                onClick={markComplete}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-green-400 transition-colors border border-slate-600 px-3 py-1.5 rounded-lg"
              >
                <CheckCircle size={16} />
                Marquer terminé
              </button>
            )}
            {isCompleted && (
              <span className="flex items-center gap-2 text-sm text-green-400 border border-green-800 px-3 py-1.5 rounded-lg">
                <CheckCircle size={16} />
                Terminé
              </span>
            )}
          </div>
        </div>

        {/* Player */}
        <div className="flex-1 p-6">
          {currentLesson?.type === 'video' && signedUrl ? (
            <VideoPlayer
              signedUrl={signedUrl}
              title={currentLesson.title}
              onProgress={(pct) => { if (pct >= 90) markComplete() }}
              onComplete={markComplete}
            />
          ) : currentLesson?.type === 'pdf' && signedUrl ? (
            <PDFViewer url={signedUrl} title={currentLesson.title} />
          ) : currentLesson?.type === 'audio' && signedUrl ? (
            <AudioPlayer
              url={signedUrl}
              title={currentLesson.title}
              onComplete={markComplete}
            />
          ) : currentLesson?.type === 'image' && signedUrl ? (
            <div
              className="flex items-center justify-center bg-slate-800 rounded-2xl p-4"
              onContextMenu={(e) => e.preventDefault()}
            >
              <img
                src={signedUrl}
                alt={currentLesson.title}
                className="max-h-[70vh] object-contain rounded-xl select-none pointer-events-none"
                draggable={false}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-slate-800 rounded-2xl">
              <div className="text-center">
                <BookOpen size={40} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">
                  Contenu non disponible
                </p>
              </div>
            </div>
          )}

          {/* Description leçon */}
          {currentLesson?.description && (
            <div className="mt-6 bg-slate-800 rounded-2xl p-5">
              <h3 className="text-white font-medium mb-2">Description</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {currentLesson.description}
              </p>
            </div>
          )}
        </div>

        {/* Navigation précédent / suivant */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700">
          {prevLesson ? (
            <button
              onClick={() => navigateTo(prevLesson)}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
            >
              <ChevronLeft size={18} />
              <span className="truncate max-w-xs">{prevLesson.title}</span>
            </button>
          ) : (
            <div />
          )}

          {nextLesson ? (
            <button
              onClick={() => navigateTo(nextLesson)}
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
            >
              <span className="truncate max-w-xs">{nextLesson.title}</span>
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={markComplete}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
            >
              <CheckCircle size={18} />
              Terminer la formation
            </button>
          )}
        </div>
      </main>
    </div>
  )
}