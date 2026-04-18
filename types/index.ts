// types/index.ts

// ── Utilisateur ──────────────────────────────────────────────
export type UserRole = 'student' | 'instructor' | 'admin'

export interface User {
  id: string
  email: string
  displayName: string
  photoURL?: string
  role: UserRole
  createdAt: FirebaseTimestamp
  updatedAt?: FirebaseTimestamp
}

// ── Formateur ────────────────────────────────────────────────
export interface InstructorBranding {
  primaryColor: string
  secondaryColor: string
  logo?: string
  favicon?: string
  displayName: string
  bio?: string
  coverImage?: string
}

export interface Instructor {
  id: string               // même uid que User
  slug: string             // ex: "jean-dupont"
  customDomain?: string    // ex: "formations.jeandupont.com"
  branding: InstructorBranding
  totalCourses: number
  totalStudents: number
  createdAt: FirebaseTimestamp
}

// ── Formation ────────────────────────────────────────────────
export type CourseStatus = 'draft' | 'published' | 'archived'
export type AccessType = 'lifetime' | 'limited'
export type LessonType = 'video' | 'audio' | 'pdf' | 'image' | 'file'

export interface Lesson {
  id: string
  courseId: string
  moduleId: string
  title: string
  type: LessonType
  mediaUrl?: string
  bunnyVideoId?: string
  duration?: number        // secondes
  order: number
  isPreview: boolean
  description?: string
}

export interface Module {
  id: string
  title: string
  order: number
  lessons: Lesson[]
  isActive: boolean
}

export interface Course {
  id: string
  instructorId: string
  title: string
  description: string
  shortDescription?: string
  price: number            // 0 = gratuit
  currency: 'XOF' | 'XAF' | 'EUR'
  accessType: AccessType
  accessDuration?: number  // jours si limited
  status: CourseStatus
  thumbnail?: string
  modules: Module[]
  totalLessons: number
  totalDuration?: number   // secondes
  tags?: string[]
  language?: string
  level?: 'beginner' | 'intermediate' | 'advanced'
  createdAt: FirebaseTimestamp
  updatedAt?: FirebaseTimestamp
}

// ── Inscription ──────────────────────────────────────────────
export type EnrollmentStatus = 'active' | 'expired' | 'cancelled'

export interface EnrollmentProgress {
  completedLessons: string[]
  lastLessonId?: string
  percentage: number
  lastAccessedAt?: FirebaseTimestamp
}

export interface Enrollment {
  id: string
  userId: string
  courseId: string
  instructorId: string
  status: EnrollmentStatus
  accessType: AccessType
  expiresAt?: FirebaseTimestamp
  progress: EnrollmentProgress
  enrolledAt: FirebaseTimestamp
}

// ── Paiement ─────────────────────────────────────────────────
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded'
export type PaymentProvider = 'feexpay'

export interface Payment {
  id: string
  userId: string
  courseId: string
  instructorId: string
  amount: number
  currency: string
  provider: PaymentProvider
  status: PaymentStatus
  feexpayRef?: string
  webhookVerified: boolean
  metadata?: Record<string, string>
  createdAt: FirebaseTimestamp
  updatedAt?: FirebaseTimestamp
}

// ── Domaine ──────────────────────────────────────────────────
export interface Domain {
  id: string
  instructorId: string
  subdomain: string        // ex: "jean-dupont" → jean-dupont.lfdweblearn.com
  customDomain?: string
  verified: boolean
  createdAt: FirebaseTimestamp
}

// ── Utilitaires ──────────────────────────────────────────────
export type FirebaseTimestamp = {
  seconds: number
  nanoseconds: number
  toDate: () => Date
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}