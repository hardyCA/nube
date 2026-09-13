'use client'

import { Suspense } from 'react'
import CatalogoContent from './CatalogoContent'

export default function CatalogoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted">Cargando...</div>
      </div>
    }>
      <CatalogoContent />
    </Suspense>
  )
}
