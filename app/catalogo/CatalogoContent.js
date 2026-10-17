'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProductoCard from '@/components/catalogo/ProductoCard'

export default function CatalogoContent({
  productosIniciales = [],
  categoriasIniciales = [],
}) {
  const searchParams = useSearchParams()
  const categoriaUrl = searchParams.get('categoria') || ''

  const [categoriaActiva, setCategoriaActiva] = useState(categoriaUrl)
  const [busqueda, setBusqueda] = useState('')
  const [ordenPrecio, setOrdenPrecio] = useState('recientes')
  const [filtrosOpen, setFiltrosOpen] = useState(false)

  useEffect(() => {
    setCategoriaActiva(categoriaUrl)
  }, [categoriaUrl])

  // Filtrado y búsqueda 100% en memoria (0 consultas a Supabase por tecla o filtro)
  const productosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()

    const filtrados = productosIniciales.filter((p) => {
      if (categoriaActiva) {
        const slugCat = p.categorias?.slug || ''
        if (slugCat !== categoriaActiva) return false
      }

      if (termino) {
        const enNombre = p.nombre?.toLowerCase().includes(termino)
        const enDescCorta = p.descripcion_corta?.toLowerCase().includes(termino)
        const enCategoria = p.categorias?.nombre?.toLowerCase().includes(termino)
        if (!enNombre && !enDescCorta && !enCategoria) return false
      }

      return true
    })

    if (ordenPrecio === 'menor') {
      return [...filtrados].sort(
        (a, b) => Number(a.precio_oferta || a.precio) - Number(b.precio_oferta || b.precio)
      )
    }
    if (ordenPrecio === 'mayor') {
      return [...filtrados].sort(
        (a, b) => Number(b.precio_oferta || b.precio) - Number(a.precio_oferta || a.precio)
      )
    }

    return filtrados
  }, [productosIniciales, categoriaActiva, busqueda, ordenPrecio])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-14 sm:pt-16">
        <div className="bg-hero-gradient border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Catálogo</h1>
            <p className="text-sm sm:text-base text-muted mt-1">Explora nuestra selección de productos</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex gap-3 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por modelo, procesador, RAM..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full h-11 sm:h-12 pl-10 pr-10 rounded-xl border border-border bg-white text-foreground text-sm placeholder:text-muted transition-all focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
                />
                {busqueda && (
                  <button
                    onClick={() => setBusqueda('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/[0.05] transition-colors"
                  >
                    <X className="h-4 w-4 text-muted" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setFiltrosOpen(!filtrosOpen)}
                className={`sm:hidden h-11 px-4 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-colors shrink-0 ${
                  filtrosOpen || categoriaActiva
                    ? 'border-foreground bg-foreground text-white'
                    : 'border-border bg-white text-muted'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
              </button>
            </div>

            <select
              value={ordenPrecio}
              onChange={(e) => setOrdenPrecio(e.target.value)}
              className="h-11 sm:h-12 px-3.5 rounded-xl border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all"
            >
              <option value="recientes">Más recientes</option>
              <option value="menor">Precio: menor a mayor</option>
              <option value="mayor">Precio: mayor a menor</option>
            </select>
          </div>

          <div className={`flex flex-wrap gap-2 mb-6 sm:mb-8 ${filtrosOpen ? '' : 'hidden sm:flex'}`}>
            <button
              onClick={() => setCategoriaActiva('')}
              className={`px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                !categoriaActiva
                  ? 'bg-foreground text-white'
                  : 'bg-accent-light text-muted hover:text-foreground'
              }`}
            >
              Todos ({productosIniciales.length})
            </button>
            {categoriasIniciales.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoriaActiva(cat.slug)}
                className={`px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                  categoriaActiva === cat.slug
                    ? 'bg-foreground text-white'
                    : 'bg-accent-light text-muted hover:text-foreground'
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>

          {productosFiltrados.length > 0 ? (
            <>
              <p className="text-xs text-muted mb-4">
                {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {productosFiltrados.map((producto) => (
                  <ProductoCard key={producto.id} producto={producto} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16 sm:py-24">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-accent-light rounded-2xl flex items-center justify-center mb-4">
                <Search className="h-6 w-6 sm:h-7 sm:w-7 text-muted/40" />
              </div>
              <h3 className="text-base sm:text-lg font-medium mb-1">No se encontraron productos</h3>
              <p className="text-sm text-muted max-w-xs mx-auto">
                {busqueda
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Aún no hay productos en esta categoría'}
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
