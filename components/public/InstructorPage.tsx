// components/public/InstructorPage.tsx
'use client'

import type { Instructor, Course } from '@/types'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import {
  BookOpen, Users, Clock, Star,
  Globe, CheckCircle, Play
} from 'lucide-react'
import PaymentButton from '@/components/payment/PaymentButton'

interface Props {
  instructor: Instructor
  courses: Course[]
}

export default function PublicInstructorPage({ instructor, courses }: Props) {
  const { branding } = instructor
  const primary = branding.primaryColor || '#0284c7'
  const secondary = branding.secondaryColor || '#f97316'

  return (
    <div className="min-h-screen bg-white">

      {/* ── Header ─────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 shadow-sm"
        style={{ backgroundColor: primary }}
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {branding.logo ? (
              <img
                src={branding.logo}
                alt={branding.displayName}
                className="h-9 w-auto object-contain"
              />
            ) : (
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <BookOpen size={18} className="text-white" />
              </div>
            )}
            <span className="text-white font-bold text-lg hidden sm:block">
              {branding.displayName}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-white/80 hover:text-white text-sm transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium px-4 py-2 rounded-xl transition-all"
              style={{ backgroundColor: secondary, color: 'white' }}
            >
              S'inscrire
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="relative">
        {branding.coverImage ? (
          <div className="relative h-64 sm:h-80 overflow-hidden">
            <img
              src={branding.coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-6xl mx-auto px-4 w-full">
                <HeroContent
                  instructor={instructor}
                  courses={courses}
                  primary={primary}
                  secondary={secondary}
                  onDark
                />
              </div>
            </div>
          </div>
        ) : (
          <div
            className="py-16"
            style={{
              background: `linear-gradient(135deg, ${primary}15 0%, ${secondary}10 100%)`,
            }}
          >
            <div className="max-w-6xl mx-auto px-4">
              <HeroContent
                instructor={instructor}
                courses={courses}
                primary={primary}
                secondary={secondary}
              />
            </div>
          </div>
        )}
      </section>

      {/* ── Formations ─────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Toutes les formations
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {courses.length} formation{courses.length > 1 ? 's' : ''} disponible{courses.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen size={48} className="mx-auto mb-4 text-slate-200" />
            <p className="text-slate-400">
              Aucune formation disponible pour le moment
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                primary={primary}
                secondary={secondary}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer
        className="mt-16 py-8 text-center"
        style={{ backgroundColor: primary }}
      >
        <p className="text-white/60 text-sm">
          Propulsé par{' '}
          <Link href="/" className="text-white font-medium hover:underline">
            LFD Web Learn
          </Link>
        </p>
      </footer>
    </div>
  )
}

// ── Hero Content ─────────────────────────────────────────────
function HeroContent({
  instructor,
  courses,
  primary,
  secondary,
  onDark = false,
}: {
  instructor: Instructor
  courses: Course[]
  primary: string
  secondary: string
  onDark?: boolean
}) {
  const textClass = onDark ? 'text-white' : 'text-slate-800'
  const subTextClass = onDark ? 'text-white/70' : 'text-slate-500'

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* Avatar */}
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden"
        style={{ backgroundColor: `${primary}20` }}
      >
        {instructor.branding.logo ? (
          <img
            src={instructor.branding.logo}
            alt={instructor.branding.displayName}
            className="w-full h-full object-contain"
          />
        ) : (
          <span
            className="text-3xl font-bold"
            style={{ color: primary }}
          >
            {instructor.branding.displayName?.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Infos */}
      <div className="flex-1 text-center sm:text-left">
        <h1 className={`text-3xl font-bold mb-2 ${textClass}`}>
          {instructor.branding.displayName}
        </h1>
        {instructor.branding.bio && (
          <p className={`text-sm leading-relaxed mb-4 max-w-lg ${subTextClass}`}>
            {instructor.branding.bio}
          </p>
        )}
        <div className={`flex items-center gap-4 text-sm ${subTextClass} justify-center sm:justify-start`}>
          <span className="flex items-center gap-1.5">
            <BookOpen size={15} />
            {courses.length} formations
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={15} />
            {instructor.totalStudents || 0} élèves
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Carte formation ──────────────────────────────────────────
function CourseCard({
  course,
  primary,
  secondary,
}: {
  course: Course
  primary: string
  secondary: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all group">
      {/* Thumbnail */}
      <div className="relative h-44 overflow-hidden bg-slate-100">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: `${primary}15` }}
          >
            <BookOpen size={40} style={{ color: primary }} className="opacity-40" />
          </div>
        )}

        {/* Badge prix */}
        <div className="absolute top-3 right-3">
          <span
            className="text-xs font-bold px-3 py-1.5 rounded-full text-white shadow-md"
            style={{ backgroundColor: course.price === 0 ? '#16a34a' : secondary }}
          >
            {course.price === 0 ? 'Gratuit' : formatPrice(course.price, course.currency)}
          </span>
        </div>

        {/* Badge niveau */}
        {course.level && (
          <div className="absolute top-3 left-3">
            <span className="text-xs bg-black/40 text-white px-2 py-1 rounded-full backdrop-blur-sm">
              {course.level === 'beginner'
                ? 'Débutant'
                : course.level === 'intermediate'
                ? 'Intermédiaire'
                : 'Avancé'}
            </span>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-5">
        <h3 className="font-semibold text-slate-800 mb-1.5 line-clamp-2 leading-snug">
          {course.title}
        </h3>
        {course.shortDescription && (
          <p className="text-slate-500 text-sm mb-3 line-clamp-2">
            {course.shortDescription}
          </p>
        )}

        {/* Méta */}
        <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
          <span className="flex items-center gap-1">
            <Play size={11} />
            {course.totalLessons || 0} leçons
          </span>
          <span className="flex items-center gap-1">
            {course.accessType === 'lifetime' ? (
              <>
                <Globe size={11} />
                Accès à vie
              </>
            ) : (
              <>
                <Clock size={11} />
                {course.accessDuration} jours
              </>
            )}
          </span>
        </div>

        {/* Bouton */}
        <PaymentButton course={course} />
      </div>
    </div>
  )
}