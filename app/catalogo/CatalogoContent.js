'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProductoCard from '@/components/catalogo/ProductoCard'
import { supabase } from '@/lib/supabase'

const ITEMS_PER_PAGE = 12

export default function CatalogoContent() {
  const searchParams = useSearchParams()
  const categoriaInicial = searchParams.get('categoria') || ''

  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [categoriaActiva, setCategoriaActiva] = useState(categoriaInicial)
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [cargandoMas, setCargandoMas] = useState(false)
  const [page, setPage] = useState(0)
  const [tieneMas, setTieneMas] = useState(true)
  const [totalProductos, setTotalProductos] = useState(0)
  const [filtrosOpen, setFiltrosOpen] = useState(false)
  const observerRef = useRef(null)
  const loadMoreRef = useRef(null)

  useEffect(() => {
    async function cargarCategorias() {
      const { data } = await supabase
        .from('categorias')
        .select('*')
        .eq('activa', true)
        .order('orden')
      setCategorias(data || [])
    }
    cargarCategorias()
  }, [])

  const cargarProductos = useCallback(async (reset = false) => {
    const currentPage = reset ? 0 : page
    const from = currentPage * ITEMS_PER_PAGE
    const to = from + ITEMS_PER_PAGE - 1

    if (reset) {
      setCargando(true)
      setProductos([])
      setPage(0)
      setTieneMas(true)
    } else {
      setCargandoMas(true)
    }

    let query = supabase
      .from('productos')
      .select('*, categorias(nombre, slug)', { count: 'exact' })
      .in('estado', ['disponible', 'agotado'])
      .order('created_at', { ascending: false })
      .range(from, to)

    if (categoriaActiva) {
      const { data: cat } = await supabase
        .from('categorias')
        .select('id')
        .eq('slug', categoriaActiva)
        .single()

      if (cat) {
        query = query.eq('categoria_id', cat.id)
      }
    }

    if (busqueda) {
      query = query.ilike('nombre', `%${busqueda}%`)
    }

    const { data, count } = await query

    if (reset) {
      setProductos(data || [])
    } else {
      setProductos(prev => [...prev, ...(data || [])])
    }

    setTotalProductos(count || 0)
    setTieneMas((data?.length || 0) === ITEMS_PER_PAGE)
    setCargando(false)
    setCargandoMas(false)
  }, [categoriaActiva, busqueda, page])

  useEffect(() => {
    cargarProductos(true)
  }, [categoriaActiva, busqueda])

  useEffect(() => {
    if (page > 0) {
      cargarProductos(false)
    }
  }, [page])

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && tieneMas && !cargando && !cargandoMas) {
          setPage(prev => prev + 1)
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => observerRef.current?.disconnect()
  }, [tieneMas, cargando, cargandoMas])

  const handleBusqueda = (e) => {
    setBusqueda(e.target.value)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-14 sm:pt-16">
        <div className="bg-white border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Catálogo</h1>
            <p className="text-sm sm:text-base text-muted mt-1">Explora nuestra selección de productos</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={busqueda}
                onChange={handleBusqueda}
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
              className={`sm:hidden h-11 sm:h-12 px-4 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-colors shrink-0 ${
                filtrosOpen || categoriaActiva
                  ? 'border-foreground bg-foreground text-white'
                  : 'border-border bg-white text-muted'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
            </button>
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
              Todos
            </button>
            {categorias.map((cat) => (
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

          {cargando ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-border overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-accent-light" />
                  <div className="p-3 sm:p-4 space-y-2.5">
                    <div className="h-2.5 bg-accent-light rounded w-1/3" />
                    <div className="h-3.5 bg-accent-light rounded w-3/4" />
                    <div className="h-5 bg-accent-light rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : productos.length > 0 ? (
            <>
              <p className="text-xs text-muted mb-4">
                {totalProductos} producto{totalProductos !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {productos.map((producto) => (
                  <ProductoCard key={producto.id} producto={producto} />
                ))}
              </div>

              <div ref={loadMoreRef} className="py-8">
                {cargandoMas && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl border border-border overflow-hidden animate-pulse">
                        <div className="aspect-[4/3] bg-accent-light" />
                        <div className="p-3 sm:p-4 space-y-2.5">
                          <div className="h-2.5 bg-accent-light rounded w-1/3" />
                          <div className="h-3.5 bg-accent-light rounded w-3/4" />
                          <div className="h-5 bg-accent-light rounded w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!tieneMas && productos.length > ITEMS_PER_PAGE && (
                  <p className="text-center text-sm text-muted">Mostrando todos los productos</p>
                )}
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
