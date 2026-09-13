'use client'

import { useState, useEffect } from 'react'
import { Package, Tags, ShoppingCart, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    productos: 0,
    categorias: 0,
    ventasHoy: 0,
    ventasMes: 0,
    stockBajo: 0,
    ingresosMes: 0,
  })
  const [ultimasVentas, setUltimasVentas] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargarStats() {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)

      const [
        { count: productos },
        { count: categorias },
        { count: ventasHoy },
        { data: ventasMesData },
        { count: stockBajo },
      ] = await Promise.all([
        supabase.from('productos').select('*', { count: 'exact', head: true }),
        supabase.from('categorias').select('*', { count: 'exact', head: true }),
        supabase.from('ventas').select('*', { count: 'exact', head: true }).gte('created_at', hoy.toISOString()),
        supabase.from('ventas').select('total').gte('created_at', primerDiaMes.toISOString()),
        supabase.from('productos').select('*', { count: 'exact', head: true }).lte('stock', 5).eq('estado', 'disponible'),
      ])

      const ingresosMes = ventasMesData?.reduce((sum, v) => sum + Number(v.total), 0) || 0

      setStats({
        productos: productos || 0,
        categorias: categorias || 0,
        ventasHoy: ventasHoy || 0,
        ventasMes: ventasMesData?.length || 0,
        stockBajo: stockBajo || 0,
        ingresosMes,
      })

      const { data: ventas } = await supabase
        .from('ventas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      setUltimasVentas(ventas || [])
      setCargando(false)
    }
    cargarStats()
  }, [])

  const metricCards = [
    { label: 'Productos', value: stats.productos, icon: Package, color: 'bg-blue-50 text-blue-600', href: '/admin/productos' },
    { label: 'Categorías', value: stats.categorias, icon: Tags, color: 'bg-purple-50 text-purple-600', href: '/admin/categorias' },
    { label: 'Ventas hoy', value: stats.ventasHoy, icon: ShoppingCart, color: 'bg-emerald-50 text-emerald-600', href: '/admin/ventas' },
    { label: 'Ventas mes', value: stats.ventasMes, icon: TrendingUp, color: 'bg-amber-50 text-amber-600', href: '/admin/ventas' },
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted text-sm mt-1">Resumen general de tu tienda</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {metricCards.map((metric, i) => (
          <Link
            key={i}
            href={metric.href}
            className="bg-white rounded-xl border border-border p-4 sm:p-5 transition-all duration-200 hover:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)] hover:border-transparent group"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 sm:p-2.5 rounded-xl ${metric.color} transition-transform group-hover:scale-105`}>
                <metric.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs text-muted truncate">{metric.label}</p>
                <p className="text-xl sm:text-2xl font-bold tabular-nums">{cargando ? '—' : metric.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl border border-border p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Resumen financiero</h2>
            <Link href="/admin/reportes" className="text-xs text-muted hover:text-foreground transition-colors">
              Ver reportes
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2.5 border-b border-border">
              <span className="text-sm text-muted">Ingresos del mes</span>
              <span className="text-base sm:text-lg font-bold tabular-nums">
                {cargando ? '—' : `Bs ${stats.ingresosMes.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className="text-sm text-muted">Stock bajo</span>
              <span className={`text-base sm:text-lg font-bold ${stats.stockBajo > 0 ? 'text-amber-600' : ''}`}>
                {cargando ? '—' : stats.stockBajo}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Últimas ventas</h2>
            <Link href="/admin/ventas" className="text-xs text-muted hover:text-foreground transition-colors flex items-center gap-1">
              Ver todas
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {cargando ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-accent-light rounded-lg animate-pulse" />
              ))}
            </div>
          ) : ultimasVentas.length > 0 ? (
            <div className="space-y-0">
              {ultimasVentas.map((venta) => (
                <div key={venta.id} className="flex justify-between items-center py-2.5 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Venta #{venta.numero_venta}</p>
                    <p className="text-[11px] text-muted">
                      {new Date(venta.created_at).toLocaleDateString('es-BO')}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums shrink-0 ml-4">
                    Bs {Number(venta.total).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted text-sm">
              No hay ventas registradas
            </div>
          )}
        </div>
      </div>

      {stats.stockBajo > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-amber-900">Stock bajo</h3>
            <p className="text-sm text-amber-700 mt-0.5">
              Tienes {stats.stockBajo} producto(s) con stock bajo o agotado.{' '}
              <a href="/admin/inventario" className="underline hover:no-underline font-medium">
                Ver inventario
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
