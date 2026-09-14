'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ShoppingBag, Minus, Plus, Check, Package } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { useCarrito } from '@/hooks/useCarrito'
import { supabase } from '@/lib/supabase'
import { parsearDescripcion } from '@/lib/utils'

export default function ProductoPage() {
  const params = useParams()
  const router = useRouter()
  const [producto, setProducto] = useState(null)
  const [cantidad, setCantidad] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [agregado, setAgregado] = useState(false)
  const [imagenActual, setImagenActual] = useState(0)
  const { agregarProducto, estaEnCarrito, obtenerCantidad } = useCarrito()

  useEffect(() => {
    async function cargarProducto() {
      const { data } = await supabase
        .from('productos')
        .select('*, categorias(nombre, slug)')
        .eq('id', params.id)
        .single()

      setProducto(data)
      setCargando(false)
    }
    cargarProducto()
  }, [params.id])

  const handleAgregar = () => {
    if (producto) {
      agregarProducto(producto, cantidad)
      setAgregado(true)
      setTimeout(() => setAgregado(false), 2000)
    }
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-14 sm:pt-16 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-border border-t-foreground rounded-full animate-spin" />
            <p className="text-sm text-muted">Cargando producto...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!producto) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-14 sm:pt-16 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-accent-light rounded-2xl flex items-center justify-center mb-4">
              <Package className="h-7 w-7 text-muted/40" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Producto no encontrado</h2>
            <p className="text-sm text-muted mb-6">El producto que buscas no existe o fue eliminado</p>
            <Button variant="secondary" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const agotado = producto.estado === 'agotado' || producto.stock <= 0
  const enCarrito = estaEnCarrito(producto.id)
  const cantidadEnCarrito = obtenerCantidad(producto.id)
  const galeria = Array.isArray(producto.galeria) ? producto.galeria : []
  const todasLasImagenes = [producto.imagen_url, ...galeria].filter(Boolean)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-14 sm:pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-4 sm:mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Volver
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 xl:gap-16">
            <div>
              <div className="aspect-square bg-accent-light rounded-2xl overflow-hidden">
                {todasLasImagenes.length > 0 ? (
                  <img
                    src={todasLasImagenes[imagenActual]}
                    alt={producto.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="h-20 w-20 sm:h-24 sm:w-24 text-muted/15" />
                  </div>
                )}
              </div>
              {todasLasImagenes.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {todasLasImagenes.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => setImagenActual(idx)}
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-colors ${
                        imagenActual === idx ? 'border-foreground' : 'border-transparent hover:border-border'
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col pb-6 sm:pb-0">
              {producto.categorias && (
                <p className="text-xs text-muted mb-2 uppercase tracking-wider">{producto.categorias.nombre}</p>
              )}

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3 sm:mb-4">
                {producto.nombre}
              </h1>

              <div className="mb-4 sm:mb-6">
                {producto.precio_oferta ? (
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-2xl sm:text-3xl font-bold text-red-600">
                      Bs {producto.precio_oferta}
                    </span>
                    <span className="text-base sm:text-lg text-muted line-through">
                      Bs {producto.precio}
                    </span>
                  </div>
                ) : (
                  <span className="text-2xl sm:text-3xl font-bold">Bs {producto.precio}</span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-5 sm:mb-6">
                {agotado ? (
                  <Badge variant="danger">Agotado</Badge>
                ) : producto.stock <= 5 ? (
                  <Badge variant="warning">Solo quedan {producto.stock}</Badge>
                ) : (
                  <Badge variant="success">Disponible</Badge>
                )}

                {enCarrito && (
                  <Badge variant="info">{cantidadEnCarrito} en cotización</Badge>
                )}
              </div>

              {producto.descripcion_corta && (
                <p className="text-sm sm:text-base text-muted leading-relaxed mb-4">{producto.descripcion_corta}</p>
              )}

              {producto.descripcion && (
                <div
                  className="text-sm text-muted leading-relaxed mb-6 sm:mb-8"
                  dangerouslySetInnerHTML={{ __html: parsearDescripcion(producto.descripcion) }}
                />
              )}

              <div className="mt-auto space-y-4">
                {!agotado && (
                  <>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">Cantidad</span>
                      <div className="flex items-center border border-border rounded-full overflow-hidden">
                        <button
                          onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                          className="w-10 h-10 flex items-center justify-center hover:bg-accent-light transition-colors active:scale-95"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-12 text-center text-sm font-semibold tabular-nums">{cantidad}</span>
                        <button
                          onClick={() => setCantidad(Math.min(producto.stock, cantidad + 1))}
                          className="w-10 h-10 flex items-center justify-center hover:bg-accent-light transition-colors active:scale-95"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleAgregar}
                      className={`w-full h-12 sm:h-13 rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2.5 active:scale-[0.98] ${
                        agregado
                          ? 'bg-emerald-600 text-white'
                          : enCarrito
                            ? 'bg-foreground text-white hover:bg-foreground/90'
                            : 'bg-foreground text-white hover:bg-foreground/90'
                      }`}
                    >
                      {agregado ? (
                        <>
                          <Check className="h-4 w-4" />
                          ¡Agregado!
                        </>
                      ) : enCarrito ? (
                        <>
                          <Check className="h-4 w-4" />
                          Actualizar en cotización
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="h-4 w-4" />
                          Agregar a cotización
                        </>
                      )}
                    </button>
                  </>
                )}

                {enCarrito && (
                  <button
                    onClick={() => router.push('/cotizacion')}
                    className="w-full h-12 rounded-full text-sm font-medium border border-border text-foreground transition-all duration-200 hover:bg-black/[0.03] active:scale-[0.98]"
                  >
                    Ver mi cotización
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
