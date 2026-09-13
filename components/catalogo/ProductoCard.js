'use client'

import Link from 'next/link'
import { ShoppingBag, Check } from 'lucide-react'
import { useCarrito } from '@/hooks/useCarrito'

export default function ProductoCard({ producto }) {
  const { agregarProducto, estaEnCarrito, obtenerCantidad } = useCarrito()
  const enCarrito = estaEnCarrito(producto.id)
  const cantidad = obtenerCantidad(producto.id)
  const agotado = producto.estado === 'agotado' || producto.stock <= 0

  const handleAgregar = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!agotado) {
      agregarProducto(producto)
    }
  }

  return (
    <Link
      href={`/producto/${producto.id}`}
      className="group block bg-white rounded-2xl border border-border overflow-hidden transition-all duration-200 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] hover:border-transparent"
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
            <ShoppingBag className="h-12 w-12 sm:h-14 sm:w-14 text-muted/15" />
          </div>
        )}

        {producto.precio_oferta && (
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-red-600 text-white text-[11px] font-semibold rounded-full">
            Oferta
          </div>
        )}

        {agotado && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="px-3 py-1 bg-black/60 text-white text-xs font-medium rounded-full backdrop-blur-sm">
              Agotado
            </span>
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4">
        {producto.categorias && (
          <p className="text-[11px] text-muted mb-1 uppercase tracking-wider">{producto.categorias.nombre}</p>
        )}
        <h3 className="text-sm font-medium text-foreground mb-2 line-clamp-1">
          {producto.nombre}
        </h3>

        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            {producto.precio_oferta ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-semibold text-red-600">
                  Bs {producto.precio_oferta}
                </span>
                <span className="text-xs text-muted line-through">
                  Bs {producto.precio}
                </span>
              </div>
            ) : (
              <span className="text-base sm:text-lg font-semibold text-foreground">
                Bs {producto.precio}
              </span>
            )}
            {!agotado && producto.stock > 0 && producto.stock <= 5 && (
              <p className="text-[11px] text-amber-600 mt-0.5">Últimas {producto.stock} unidades</p>
            )}
          </div>

          {!agotado && (
            <button
              onClick={handleAgregar}
              className={`shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 ${
                enCarrito
                  ? 'bg-foreground text-white'
                  : 'bg-accent-light text-foreground hover:bg-foreground hover:text-white'
              }`}
              aria-label={enCarrito ? `${cantidad} en carrito` : 'Agregar al carrito'}
            >
              {enCarrito ? (
                <span className="text-xs font-semibold">{cantidad}</span>
              ) : (
                <ShoppingBag className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}
