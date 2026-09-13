'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, ShoppingCart, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ReportesPage() {
  const [periodo, setPeriodo] = useState('mes')
  const [stats, setStats] = useState({
    totalVentas: 0,
    cantidadVentas: 0,
    ticketPromedio: 0,
    productoMasVendido: null,
  })
  const [topProductos, setTopProductos] = useState([])
  const [ventasPorDia, setVentasPorDia] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarReportes()
  }, [periodo])

  async function cargarReportes() {
    setCargando(true)
    const ahora = new Date()
    let fechaInicio

    if (periodo === 'hoy') {
      fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
    } else if (periodo === 'semana') {
      fechaInicio = new Date(ahora)
      fechaInicio.setDate(ahora.getDate() - 7)
    } else if (periodo === 'mes') {
      fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    } else {
      fechaInicio = new Date(ahora.getFullYear(), 0, 1)
    }

    const { data: ventas } = await supabase
      .from('ventas')
      .select('*')
      .gte('created_at', fechaInicio.toISOString())
      .eq('estado', 'completada')

    const { data: detalles } = await supabase
      .from('venta_detalles')
      .select('*, productos(nombre)')
      .gte('created_at', fechaInicio.toISOString())

    const totalVentas = ventas?.reduce((sum, v) => sum + Number(v.total), 0) || 0
    const cantidadVentas = ventas?.length || 0
    const ticketPromedio = cantidadVentas > 0 ? totalVentas / cantidadVentas : 0

    const ventasPorProducto = {}
    detalles?.forEach(d => {
      const nombre = d.productos?.nombre || 'Desconocido'
      if (!ventasPorProducto[nombre]) {
        ventasPorProducto[nombre] = { nombre, cantidad: 0, total: 0 }
      }
      ventasPorProducto[nombre].cantidad += d.cantidad
      ventasPorProducto[nombre].total += Number(d.subtotal)
    })

    const topProds = Object.values(ventasPorProducto)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    const ventasPorDiaMap = {}
    ventas?.forEach(v => {
      const dia = new Date(v.created_at).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })
      ventasPorDiaMap[dia] = (ventasPorDiaMap[dia] || 0) + Number(v.total)
    })

    const ventasDia = Object.entries(ventasPorDiaMap).map(([dia, total]) => ({ dia, total }))

    setStats({
      totalVentas,
      cantidadVentas,
      ticketPromedio,
      productoMasVendido: topProds[0] || null,
    })
    setTopProductos(topProds)
    setVentasPorDia(ventasDia)
    setCargando(false)
  }

  const maxVentaDia = Math.max(...ventasPorDia.map(v => v.total), 1)

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted text-sm mt-1">Resumen de ventas</p>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { value: 'hoy', label: 'Hoy' },
            { value: 'semana', label: 'Semana' },
            { value: 'mes', label: 'Mes' },
            { value: 'anio', label: 'Año' },
          ].map(p => (
            <button
              key={p.value}
              onClick={() => setPeriodo(p.value)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                periodo === p.value
                  ? 'bg-foreground text-white'
                  : 'bg-white border border-border text-muted hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total ventas', value: `Bs ${stats.totalVentas.toFixed(2)}`, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Cantidad', value: stats.cantidadVentas, icon: ShoppingCart, color: 'bg-blue-50 text-blue-600' },
          { label: 'Ticket promedio', value: `Bs ${stats.ticketPromedio.toFixed(2)}`, icon: BarChart3, color: 'bg-purple-50 text-purple-600' },
          { label: 'Más vendido', value: stats.productoMasVendido?.nombre || 'N/A', icon: Package, color: 'bg-amber-50 text-amber-600', small: true },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-xl border border-border p-3.5 sm:p-4">
            <div className="flex items-start gap-2.5">
              <div className={`p-2 rounded-lg ${card.color} shrink-0`}>
                <card.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted">{card.label}</p>
                <p className={`font-bold tabular-nums ${card.small ? 'text-sm' : 'text-base sm:text-lg'} truncate`}>
                  {cargando ? '—' : card.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl border border-border p-4 sm:p-5">
          <h2 className="text-sm sm:text-base font-semibold mb-4">Ventas por día</h2>
          {cargando ? (
            <div className="h-40 bg-accent-light rounded-lg animate-pulse" />
          ) : ventasPorDia.length > 0 ? (
            <div className="h-40 flex items-end gap-1.5 sm:gap-2">
              {ventasPorDia.slice(-7).map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted tabular-nums hidden sm:block">Bs {v.total.toFixed(0)}</span>
                  <div
                    className="w-full bg-foreground/10 rounded-t-md transition-all hover:bg-foreground/20"
                    style={{ height: `${(v.total / maxVentaDia) * 120}px` }}
                  />
                  <span className="text-[10px] text-muted truncate max-w-full">{v.dia}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-muted text-sm">
              Sin datos
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-border p-4 sm:p-5">
          <h2 className="text-sm sm:text-base font-semibold mb-4">Top productos</h2>
          {cargando ? (
            <div className="space-y-2.5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-accent-light rounded-lg animate-pulse" />
              ))}
            </div>
          ) : topProductos.length > 0 ? (
            <div className="space-y-0">
              {topProductos.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-bold text-muted w-5 text-center shrink-0">{i + 1}</span>
                    <span className="text-sm truncate">{p.nombre}</span>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold tabular-nums">Bs {p.total.toFixed(2)}</p>
                    <p className="text-[11px] text-muted">{p.cantidad} uds</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-muted text-sm">
              No hay datos
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
