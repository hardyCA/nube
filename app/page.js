'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, ShoppingBag, Truck, Shield, Clock } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargarDatos() {
      const { data: cats } = await supabase
        .from('categorias')
        .select('*')
        .eq('activa', true)
        .order('orden')

      const { data: prods } = await supabase
        .from('productos')
        .select('*, categorias(nombre, slug)')
        .eq('estado', 'disponible')
        .eq('destacado', true)
        .order('created_at', { ascending: false })
        .limit(8)

      setCategorias(cats || [])
      setProductos(prods || [])
      setCargando(false)
    }
    cargarDatos()
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-14 sm:pt-16">
        <section className="relative overflow-hidden bg-hero-gradient">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 lg:pt-32 lg:pb-36">
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-5 sm:mb-6">
                Encuentra lo que
                <span className="block text-muted/60">necesitas</span>
              </h1>
              <p className="text-base sm:text-lg text-muted mb-8 sm:mb-10 max-w-lg mx-auto leading-relaxed">
                Explora nuestra selección de productos de calidad. Cotiza fácilmente por WhatsApp.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/catalogo"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 h-12 px-7 bg-foreground text-white rounded-full text-sm font-medium transition-all duration-200 hover:bg-foreground/90 active:scale-[0.98]"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Ver Catálogo
                </Link>
                <Link
                  href="/catalogo"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 h-12 px-7 bg-white text-foreground rounded-full text-sm font-medium border border-border transition-all duration-200 hover:bg-black/[0.03] active:scale-[0.98]"
                >
                  Buscar Productos
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 border-t border-border bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              {[
                { icon: Truck, title: 'Envío rápido', desc: 'Recibe tu pedido en tiempo récord' },
                { icon: Shield, title: 'Garantía', desc: 'Todos nuestros productos con garantía' },
                { icon: Clock, title: 'Soporte 24/7', desc: 'Estamos aquí para ayudarte' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-5 sm:p-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 bg-accent-light rounded-xl flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-foreground/70" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {categorias.length > 0 && (
          <section className="py-12 sm:py-20 bg-white border-t border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-end justify-between mb-8 sm:mb-10">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Categorías</h2>
                  <p className="text-sm sm:text-base text-muted mt-1">Explora por categoría</p>
                </div>
                <Link
                  href="/catalogo"
                  className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors"
                >
                  Ver todo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {categorias.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/catalogo?categoria=${cat.slug}`}
                    className="group flex items-center justify-between p-5 sm:p-6 bg-background rounded-2xl border border-transparent hover:border-border transition-all duration-200"
                  >
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold mb-0.5 group-hover:text-foreground/80 transition-colors">{cat.nombre}</h3>
                      <p className="text-sm text-muted truncate">{cat.descripcion || 'Ver productos'}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-4" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-12 sm:py-20 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8 sm:mb-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Destacados</h2>
                <p className="text-sm sm:text-base text-muted mt-1">Lo más popular de nuestro catálogo</p>
              </div>
              <Link
                href="/catalogo"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                Ver todo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {cargando ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-border overflow-hidden animate-pulse">
                    <div className="aspect-[4/3] bg-accent-light" />
                    <div className="p-3 sm:p-4 space-y-2.5">
                      <div className="h-3 bg-accent-light rounded w-1/3" />
                      <div className="h-4 bg-accent-light rounded w-3/4" />
                      <div className="h-5 bg-accent-light rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : productos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {productos.map((producto) => (
                  <Link
                    key={producto.id}
                    href={`/producto/${producto.id}`}
                    className="group bg-white rounded-2xl border border-border overflow-hidden transition-all duration-200 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] hover:border-transparent"
                  >
                    <div className="aspect-[4/3] bg-accent-light relative overflow-hidden">
                      {producto.imagen_url ? (
                        <img
                          src={producto.imagen_url}
                          alt={producto.nombre}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-10 w-10 sm:h-12 sm:w-12 text-muted/20" />
                        </div>
                      )}
                    </div>
                    <div className="p-3 sm:p-4">
                      <h3 className="text-sm font-medium text-foreground mb-1 line-clamp-1">{producto.nombre}</h3>
                      <p className="text-sm sm:text-base font-semibold text-foreground">
                        {producto.precio_oferta ? (
                          <>
                            <span className="text-red-600">Bs {producto.precio_oferta}</span>
                            <span className="text-xs text-muted line-through ml-1.5">Bs {producto.precio}</span>
                          </>
                        ) : (
                          `Bs ${producto.precio}`
                        )}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <ShoppingBag className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted/20 mb-3" />
                <p className="text-sm text-muted">Próximamente productos destacados</p>
              </div>
            )}

            <div className="mt-8 sm:mt-10 text-center sm:hidden">
              <Link
                href="/catalogo"
                className="inline-flex items-center gap-2 h-11 px-6 bg-white text-foreground rounded-full text-sm font-medium border border-border transition-all duration-200 hover:bg-black/[0.03] active:scale-[0.98]"
              >
                Ver todo el catálogo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
