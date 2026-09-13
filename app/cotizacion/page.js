'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trash2, Minus, Plus, ShoppingBag, MessageCircle, ArrowLeft } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Button from '@/components/ui/Button'
import { useCarrito } from '@/hooks/useCarrito'
import { supabase } from '@/lib/supabase'
import { generarMensajeWhatsApp, enviarWhatsApp, formatearMoneda } from '@/lib/utils'

export default function CotizacionPage() {
  const { items, total, actualizarCantidad, eliminarProducto, limpiarCarrito, cargando } = useCarrito()
  const [config, setConfig] = useState({ whatsapp_number: '59170000000', moneda: 'Bs' })
  const [eliminandoId, setEliminandoId] = useState(null)

  useEffect(() => {
    async function cargarConfig() {
      const { data } = await supabase
        .from('configuracion')
        .select('id, valor')
        .in('id', ['whatsapp_number', 'moneda'])

      if (data) {
        const newConfig = {}
        data.forEach(item => {
          try {
            newConfig[item.id] = JSON.parse(item.valor)
          } catch {
            newConfig[item.id] = item.valor
          }
        })
        setConfig(prev => ({ ...prev, ...newConfig }))
      }
    }
    cargarConfig()
  }, [])

  const handleEnviarWhatsApp = () => {
    const mensaje = generarMensajeWhatsApp(items, total, config)
    enviarWhatsApp(mensaje, config.whatsapp_number)
  }

  const handleEliminar = (id) => {
    setEliminandoId(id)
    setTimeout(() => {
      eliminarProducto(id)
      setEliminandoId(null)
    }, 200)
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-14 sm:pt-16 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-border border-t-foreground rounded-full animate-spin" />
            <p className="text-sm text-muted">Cargando...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-14 sm:pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-6 sm:mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Seguir comprando
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6 sm:mb-8">Mi Cotización</h1>

          {items.length === 0 ? (
            <div className="text-center py-16 sm:py-24 bg-white rounded-2xl border border-border">
              <div className="w-16 h-16 mx-auto bg-accent-light rounded-2xl flex items-center justify-center mb-4">
                <ShoppingBag className="h-7 w-7 text-muted/40" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Tu cotización está vacía</h2>
              <p className="text-sm text-muted mb-6 max-w-xs mx-auto">Agrega productos del catálogo para comenzar a cotizar</p>
              <Link
                href="/catalogo"
                className="inline-flex items-center gap-2 h-11 px-6 bg-foreground text-white rounded-full text-sm font-medium transition-all duration-200 hover:bg-foreground/90 active:scale-[0.98]"
              >
                Ver catálogo
              </Link>
            </div>
          ) : (
            <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6">
              <div className="lg:col-span-2 space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-white rounded-xl border border-border p-3.5 sm:p-4 flex gap-3 sm:gap-4 transition-all duration-200 ${
                      eliminandoId === item.id ? 'opacity-50 scale-95' : ''
                    }`}
                  >
                    <div className="w-18 h-18 sm:w-24 sm:h-24 bg-accent-light rounded-xl overflow-hidden shrink-0">
                      {item.imagen_url ? (
                        <img
                          src={item.imagen_url}
                          alt={item.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-7 w-7 text-muted/20" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col">
                      <h3 className="text-sm font-medium text-foreground truncate">{item.nombre}</h3>
                      <p className="text-xs text-muted mt-0.5">{formatearMoneda(item.precio, config.moneda)} c/u</p>

                      <div className="flex items-center justify-between mt-auto pt-2.5 sm:pt-3">
                        <div className="flex items-center border border-border rounded-full overflow-hidden">
                          <button
                            onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-accent-light transition-colors active:scale-95"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-semibold tabular-nums">{item.cantidad}</span>
                          <button
                            onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-accent-light transition-colors active:scale-95"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="text-sm font-semibold tabular-nums">
                            {formatearMoneda(item.precio * item.cantidad, config.moneda)}
                          </span>
                          <button
                            onClick={() => handleEliminar(item.id)}
                            className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label="Eliminar producto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={limpiarCarrito}
                  className="text-xs sm:text-sm text-muted hover:text-red-600 transition-colors py-2"
                >
                  Vaciar cotización
                </button>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl border border-border p-4 sm:p-5 lg:sticky lg:top-24">
                  <h2 className="text-base font-semibold mb-4">Resumen</h2>

                  <div className="space-y-2.5 mb-5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Productos</span>
                      <span className="font-medium">{items.length} artículos</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Unidades</span>
                      <span className="font-medium">{items.reduce((sum, item) => sum + item.cantidad, 0)}</span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between">
                      <span className="font-semibold">Total estimado</span>
                      <span className="text-xl font-bold tabular-nums">{formatearMoneda(total, config.moneda)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleEnviarWhatsApp}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2.5 active:scale-[0.98]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Cotizar por WhatsApp
                  </button>

                  <p className="text-[11px] text-muted text-center mt-3">
                    Se abrirá WhatsApp con el detalle de tu cotización
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
