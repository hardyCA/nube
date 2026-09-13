'use client'

import { useState, useEffect } from 'react'
import { Package, Search, ArrowUpDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

export default function InventarioPage() {
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [cargando, setCargando] = useState(true)
  const [modalStock, setModalStock] = useState(null)
  const [nuevoStock, setNuevoStock] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    cargarProductos()
  }, [])

  async function cargarProductos() {
    const { data } = await supabase
      .from('productos')
      .select('*, categorias(nombre)')
      .in('estado', ['disponible', 'agotado'])
      .order('stock')

    setProductos(data || [])
    setCargando(false)
  }

  async function handleActualizarStock() {
    if (!modalStock || nuevoStock === '') return
    setGuardando(true)

    const stock = parseInt(nuevoStock)
    const estado = stock <= 0 ? 'agotado' : 'disponible'

    await supabase
      .from('productos')
      .update({ stock, estado })
      .eq('id', modalStock.id)

    setProductos(prev => prev.map(p =>
      p.id === modalStock.id ? { ...p, stock, estado } : p
    ))
    setModalStock(null)
    setNuevoStock('')
    setGuardando(false)
  }

  const productosFiltrados = productos.filter(p => {
    const matchBusqueda = !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    if (filtro === 'bajo') return matchBusqueda && p.stock > 0 && p.stock <= p.stock_minimo
    if (filtro === 'agotado') return matchBusqueda && p.stock <= 0
    return matchBusqueda
  })

  const stats = {
    total: productos.length,
    disponibles: productos.filter(p => p.stock > p.stock_minimo).length,
    bajo: productos.filter(p => p.stock > 0 && p.stock <= p.stock_minimo).length,
    agotado: productos.filter(p => p.stock <= 0).length,
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Inventario</h1>
        <p className="text-muted text-sm mt-1">Control de stock</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: '' },
          { label: 'Disponibles', value: stats.disponibles, color: 'text-emerald-600' },
          { label: 'Stock bajo', value: stats.bajo, color: 'text-amber-600' },
          { label: 'Agotados', value: stats.agotado, color: 'text-red-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-border p-3.5 sm:p-4">
            <p className="text-[11px] sm:text-xs text-muted">{stat.label}</p>
            <p className={`text-lg sm:text-xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { value: 'todos', label: 'Todos' },
            { value: 'bajo', label: 'Stock bajo' },
            { value: 'agotado', label: 'Agotados' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                filtro === f.value
                  ? 'bg-foreground text-white'
                  : 'bg-white border border-border text-muted hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {cargando ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-white rounded-xl border border-border animate-pulse" />
          ))}
        </div>
      ) : productosFiltrados.length > 0 ? (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-accent-light/30">
                  <th className="text-left text-[11px] font-medium text-muted uppercase tracking-wider px-4 py-3">Producto</th>
                  <th className="text-left text-[11px] font-medium text-muted uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Categoría</th>
                  <th className="text-left text-[11px] font-medium text-muted uppercase tracking-wider px-4 py-3">Stock</th>
                  <th className="text-left text-[11px] font-medium text-muted uppercase tracking-wider px-4 py-3 hidden md:table-cell">Mínimo</th>
                  <th className="text-left text-[11px] font-medium text-muted uppercase tracking-wider px-4 py-3">Estado</th>
                  <th className="text-right text-[11px] font-medium text-muted uppercase tracking-wider px-4 py-3">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {productosFiltrados.map((producto) => (
                  <tr key={producto.id} className="hover:bg-accent-light/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium truncate max-w-[180px] sm:max-w-none">{producto.nombre}</p>
                      <p className="text-xs text-muted sm:hidden">{producto.categorias?.nombre || '—'}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-muted">{producto.categorias?.nombre || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium tabular-nums ${
                        producto.stock <= 0 ? 'text-red-600' :
                        producto.stock <= producto.stock_minimo ? 'text-amber-600' : ''
                      }`}>
                        {producto.stock} {producto.unidad_medida}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-muted tabular-nums">{producto.stock_minimo}</span>
                    </td>
                    <td className="px-4 py-3">
                      {producto.stock <= 0 ? (
                        <Badge variant="danger">Agotado</Badge>
                      ) : producto.stock <= producto.stock_minimo ? (
                        <Badge variant="warning">Bajo</Badge>
                      ) : (
                        <Badge variant="success">OK</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setModalStock(producto)
                          setNuevoStock(producto.stock.toString())
                        }}
                      >
                        Actualizar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 sm:py-16 bg-white rounded-xl border border-border">
          <div className="w-12 h-12 mx-auto bg-accent-light rounded-xl flex items-center justify-center mb-3">
            <Package className="h-5 w-5 text-muted/40" />
          </div>
          <h3 className="text-base font-medium mb-1">Sin resultados</h3>
          <p className="text-sm text-muted">
            {filtro === 'agotado' ? 'No hay productos agotados' : 'No hay productos con stock bajo'}
          </p>
        </div>
      )}

      <Modal
        isOpen={!!modalStock}
        onClose={() => setModalStock(null)}
        title="Actualizar stock"
      >
        {modalStock && (
          <div className="space-y-4">
            <div className="p-3 bg-accent-light rounded-xl">
              <p className="text-sm font-medium">{modalStock.nombre}</p>
              <p className="text-xs text-muted mt-0.5">Stock actual: {modalStock.stock}</p>
            </div>
            <Input
              label="Nuevo stock"
              type="number"
              min="0"
              value={nuevoStock}
              onChange={(e) => setNuevoStock(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setModalStock(null)}>Cancelar</Button>
              <Button onClick={handleActualizarStock} loading={guardando}>Guardar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
