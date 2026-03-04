export type Profession =
  | 'MEDICO'
  | 'NUTRICIONISTA'
  | 'PSICOLOGO'
  | 'ENFERMEIRO'
  | 'DENTISTA'
  | 'FARMACEUTICO'
  | 'OUTRO'

export type PostCategory =
  | 'EDUCATIVO'
  | 'DICA_SAUDE'
  | 'INSTITUCIONAL'
  | 'MOTIVACIONAL'
  | 'CRIATIVO_ANUNCIO'

export type PostFormat = 'FEED' | 'STORIES' | 'CARROSSEL'
export type PostStatus = 'DRAFT' | 'GENERATING' | 'COMPLETED' | 'FAILED'

export interface Plan {
  id: string
  name: string
  slug: string
  postsPerWeek: number
  photosPerMonth: number
  priceInCents: number
}

export interface BrandKit {
  id: string
  professionalName?: string
  profession?: Profession
  specialty?: string
  registrationCouncil?: string
  registrationNumber?: string
  bio?: string
  tagline?: string
  brandPrimaryColor?: string
  brandSecondaryColor?: string
  logoUrl?: string
  profilePhotoUrl?: string
  instagramHandle?: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'USER' | 'ADMIN'
  brandKit?: BrandKit
  subscription?: {
    status: string
    plan: Plan
    currentPeriodEnd?: string
  }
}

export interface PostVariation {
  id: string
  imageUrl?: string
  designStyle?: string
  isSelected: boolean
}

export interface Post {
  id: string
  theme: string
  category: PostCategory
  format: PostFormat
  caption?: string
  status: PostStatus
  createdAt: string
  variations: PostVariation[]
}
