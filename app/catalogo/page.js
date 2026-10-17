import { Suspense } from 'react'
import CatalogoContent from './CatalogoContent'
import { getCategoriasActivas, getProductosCatalogo } from '@/lib/catalogoCache'

export default async function CatalogoPage() {
  const [categorias, productos] = await Promise.all([
    getCategoriasActivas(),
    getProductosCatalogo(),
  ])

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted">Cargando...</div>
        </div>
      }
    >
      <CatalogoContent
        productosIniciales={productos}
        categoriasIniciales={categorias}
      />
    </Suspense>
  )
}
