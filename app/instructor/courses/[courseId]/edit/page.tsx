// app/instructor/courses/[courseId]/edit/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getDocument, updateDocument } from '@/lib/firebase/firestore'
import type { Course, Module, Lesson, LessonType } from '@/types'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import {
  Plus, Trash2, ChevronDown, ChevronUp,
  Video, FileText, Music, Image as ImageIcon,
  File, GripVertical, Check, ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

const LESSON_TYPES: { type: LessonType; label: string; icon: React.ElementType }[] = [
  { type: 'video', label: 'Video', icon: Video },
  { type: 'pdf', label: 'PDF', icon: FileText },
  { type: 'audio', label: 'Audio', icon: Music },
  { type: 'image', label: 'Image', icon: ImageIcon },
  { type: 'file', label: 'Fichier', icon: File },
]

export default function EditCoursePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { userProfile } = useAuth()
  const router = useRouter()

  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedModule, setExpandedModule] = useState<string | null>(null)

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return
      const data = await getDocument<Course>('courses', courseId)
      if (!data) { router.push('/instructor/courses'); return }
      if (data.instructorId !== userProfile?.id) {
        router.push('/instructor/courses'); return
      }
      setCourse(data)
      setModules(data.modules || [])
      setLoading(false)
    }
    if (userProfile?.id) fetchCourse()
  }, [courseId, userProfile?.id])

  const saveModules = async (updatedModules: Module[]) => {
    if (!courseId) return
    setSaving(true)
    try {
      const totalLessons = updatedModules.reduce((sum, m) => sum + m.lessons.length, 0)
      await updateDocument('courses', courseId, { modules: updatedModules, totalLessons })
      setModules(updatedModules)
      toast.success('Sauvegarde OK')
    } catch {
      toast.error('Erreur de sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const addModule = () => {
    const newModule: Module = {
      id: `mod_${Date.now()}`,
      title: `Module ${modules.length + 1}`,
      order: modules.length,
      lessons: [],
      isActive: true,
    }
    const updated = [...modules, newModule]
    setModules(updated)
    setExpandedModule(newModule.id)
    saveModules(updated)
  }

  const deleteModule = (moduleId: string) => {
    if (!confirm('Supprimer ce module et toutes ses lecons ?')) return
    const updated = modules.filter((m) => m.id !== moduleId)
    saveModules(updated)
  }

  const updateModuleTitle = (moduleId: string, title: string) => {
    setModules((prev) => prev.map((m) => (m.id === moduleId ? { ...m, title } : m)))
  }

  const addLesson = (moduleId: string) => {
    const newLesson: Lesson = {
      id: `les_${Date.now()}`,
      courseId: courseId!,
      moduleId,
      title: 'Nouvelle lecon',
      type: 'video',
      order: modules.find((m) => m.id === moduleId)?.lessons.length || 0,
      isPreview: false,
    }
    const updated = modules.map((m) =>
      m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m
    )
    saveModules(updated)
  }

  const updateLesson = (moduleId: string, lessonId: string, changes: Partial<Lesson>) => {
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? { ...m, lessons: m.lessons.map((l) => l.id === lessonId ? { ...l, ...changes } : l) }
          : m
      )
    )
  }

  const deleteLesson = (moduleId: string, lessonId: string) => {
    const updated = modules.map((m) =>
      m.id === moduleId
        ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) }
        : m
    )
    saveModules(updated)
  }

  const uploadLessonMedia = async (
    moduleId: string,
    lessonId: string,
    file: File,
    type: LessonType
  ) => {
    const toastId = toast.loading('Upload en cours...')
    try {
      if (type === 'video') {
        const res = await fetch('/api/media/upload-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId, title: file.name }),
        })
        const { uploadUrl, videoId } = await res.json()
        await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        })
        const videoUrl = `https://iframe.mediadelivery.net/embed/${process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID}/${videoId}`

        // Mettre a jour et sauvegarder immediatement avec l etat courant
        setModules((currentModules) => {
          const updated = currentModules.map((m) =>
            m.id === moduleId
              ? {
                  ...m,
                  lessons: m.lessons.map((l) =>
                    l.id === lessonId ? { ...l, bunnyVideoId: videoId, mediaUrl: videoUrl } : l
                  ),
                }
              : m
          )
          saveModules(updated)
          return updated
        })
      } else {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
        formData.append('folder', `lfd-web-learn/lessons/${type}`)

        const resourceType = type === 'audio' ? 'video' : type === 'pdf' ? 'raw' : 'image'
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
          { method: 'POST', body: formData }
        )
        const data = await res.json()
        const mediaUrl = data.secure_url

        // Mettre a jour et sauvegarder immediatement avec l etat courant
        setModules((currentModules) => {
          const updated = currentModules.map((m) =>
            m.id === moduleId
              ? {
                  ...m,
                  lessons: m.lessons.map((l) =>
                    l.id === lessonId ? { ...l, mediaUrl } : l
                  ),
                }
              : m
          )
          saveModules(updated)
          return updated
        })
      }

      toast.success('Fichier uploade !', { id: toastId })
    } catch {
      toast.error("Erreur d'upload", { id: toastId })
    }
  }

  const publishCourse = async () => {
    if (!courseId) return
    if (modules.length === 0) { toast.error('Ajoutez au moins un module'); return }
    setSaving(true)
    try {
      await updateDocument('courses', courseId, { status: 'published' })
      toast.success('Formation publiee !')
      router.push('/instructor/courses')
    } catch {
      toast.error('Erreur lors de la publication')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/instructor/courses"
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
          >
            <ArrowLeft size={16} className="text-slate-500" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800 truncate max-w-md">{course?.title}</h1>
            <p className="text-slate-400 text-sm">
              {modules.reduce((s, m) => s + m.lessons.length, 0)} lecons au total
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => saveModules(modules)}
            disabled={saving}
            className="flex items-center gap-2 border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            {saving ? (
              <span className="animate-spin h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full" />
            ) : (
              <Check size={16} />
            )}
            Sauvegarder
          </button>
          <button
            onClick={publishCourse}
            disabled={saving}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
          >
            Publier
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {modules.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 border-dashed p-12 text-center">
            <p className="text-slate-400 mb-2">Aucun module pour l instant</p>
            <p className="text-slate-300 text-sm">Ajoutez votre premier module ci-dessous</p>
          </div>
        )}

        {modules.map((module) => (
          <div key={module.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <GripVertical size={16} className="text-slate-300 cursor-grab" />
              <input
                value={module.title}
                onChange={(e) => updateModuleTitle(module.id, e.target.value)}
                onBlur={() => saveModules(modules)}
                className="flex-1 text-sm font-semibold text-slate-800 bg-transparent border-none outline-none focus:bg-slate-50 px-2 py-1 rounded-lg"
              />
              <span className="text-xs text-slate-400 flex-shrink-0">
                {module.lessons.length} lecon{module.lessons.length > 1 ? 's' : ''}
              </span>
              <button
                onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 transition-all"
              >
                {expandedModule === module.id
                  ? <ChevronUp size={16} className="text-slate-400" />
                  : <ChevronDown size={16} className="text-slate-400" />
                }
              </button>
              <button
                onClick={() => deleteModule(module.id)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-all"
              >
                <Trash2 size={14} className="text-slate-300 hover:text-red-400" />
              </button>
            </div>

            {expandedModule === module.id && (
              <div className="border-t border-slate-100">
                {module.lessons.map((lesson) => (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    moduleId={module.id}
                    onUpdate={(changes) => updateLesson(module.id, lesson.id, changes)}
                    onDelete={() => deleteLesson(module.id, lesson.id)}
                    onUpload={(file, type) => uploadLessonMedia(module.id, lesson.id, file, type)}
                    onSave={() => saveModules(modules)}
                  />
                ))}
                <button
                  onClick={() => addLesson(module.id)}
                  className="w-full flex items-center gap-2 p-3 text-sm text-sky-600 hover:bg-sky-50 transition-all"
                >
                  <Plus size={16} />
                  Ajouter une lecon
                </button>
              </div>
            )}
          </div>
        ))}

        <button
          onClick={addModule}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-sky-300 text-slate-500 hover:text-sky-600 py-4 rounded-2xl text-sm font-medium transition-all"
        >
          <Plus size={18} />
          Ajouter un module
        </button>
      </div>
    </div>
  )
}

function LessonRow({
  lesson,
  moduleId,
  onUpdate,
  onDelete,
  onUpload,
  onSave,
}: {
  lesson: Lesson
  moduleId: string
  onUpdate: (changes: Partial<Lesson>) => void
  onDelete: () => void
  onUpload: (file: File, type: LessonType) => void
  onSave: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const TypeIcon = LESSON_TYPES.find((t) => t.type === lesson.type)?.icon || File

  return (
    <div className="border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-3 px-4 py-3">
        <GripVertical size={14} className="text-slate-200 cursor-grab" />
        <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center">
          <TypeIcon size={14} className="text-slate-400" />
        </div>
        <input
          value={lesson.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          onBlur={onSave}
          className="flex-1 text-sm text-slate-700 bg-transparent border-none outline-none focus:bg-slate-50 px-2 py-1 rounded-lg"
        />
        <div className="flex items-center gap-2 flex-shrink-0">
          {lesson.mediaUrl || lesson.bunnyVideoId ? (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Fichier OK</span>
          ) : (
            <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Sans fichier</span>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-50"
          >
            {expanded
              ? <ChevronUp size={14} className="text-slate-400" />
              : <ChevronDown size={14} className="text-slate-400" />
            }
          </button>
          <button
            onClick={onDelete}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50"
          >
            <Trash2 size={13} className="text-slate-300 hover:text-red-400" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 bg-slate-50">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-2 block">Type de contenu</label>
            <div className="flex flex-wrap gap-2">
              {LESSON_TYPES.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onUpdate({ type })}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    lesson.type === type
                      ? 'bg-sky-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-300'
                  )}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-2 block">Fichier</label>
            <label className="flex items-center gap-2 cursor-pointer bg-white border border-dashed border-slate-300 rounded-xl p-3 hover:border-sky-400 transition-all">
              <Plus size={16} className="text-sky-500" />
              <span className="text-sm text-slate-500">
                {lesson.mediaUrl || lesson.bunnyVideoId ? 'Remplacer le fichier' : 'Uploader un fichier'}
              </span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onUpload(file, lesson.type)
                }}
              />
            </label>
            {(lesson.mediaUrl || lesson.bunnyVideoId) && (
              <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
                Fichier charge avec succes
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`preview-${lesson.id}`}
              checked={lesson.isPreview}
              onChange={(e) => { onUpdate({ isPreview: e.target.checked }); onSave() }}
              className="rounded"
            />
            <label htmlFor={`preview-${lesson.id}`} className="text-xs text-slate-600 cursor-pointer">
              Lecon de previsualisation gratuite
            </label>
          </div>
        </div>
      )}
    </div>
  )
}