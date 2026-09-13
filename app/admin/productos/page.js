'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Package, MoreVertical } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'

export default function ProductosPage() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [cargando, setCargando] = useState(true)
  const [productoEliminar, setProductoEliminar] = useState(null)
  const [menuAbierto, setMenuAbierto] = useState(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    const { data: cats } = await supabase.from('categorias').select('*').order('nombre')
    setCategorias(cats || [])

    const { data: prods } = await supabase
      .from('productos')
      .select('*, categorias(nombre)')
      .order('created_at', { ascending: false })

    setProductos(prods || [])
    setCargando(false)
  }

  async function handleEliminar() {
    if (!productoEliminar) return
    await supabase.from('productos').delete().eq('id', productoEliminar.id)
    setProductos(prev => prev.filter(p => p.id !== productoEliminar.id))
    setProductoEliminar(null)
  }

  async function toggleDestacado(producto) {
    await supabase
      .from('productos')
      .update({ destacado: !producto.destacado })
      .eq('id', producto.id)

    setProductos(prev =>
      prev.map(p => p.id === producto.id ? { ...p, destacado: !p.destacado } : p)
    )
  }

  const productosFiltrados = productos.filter(p => {
    const matchBusqueda = !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const matchCategoria = !filtroCategoria || p.categoria_id === filtroCategoria
    const matchEstado = !filtroEstado || p.estado === filtroEstado
    return matchBusqueda && matchCategoria && matchEstado
  })

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted text-sm mt-1">{productos.length} productos</p>
        </div>
        <Link href="/admin/productos/nuevo">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Nuevo producto
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 transition-all"
          />
        </div>
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="h-10 px-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all"
        >
          <option value="">Categoría</option>
          {categorias.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
          ))}
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="h-10 px-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all"
        >
          <option value="">Estado</option>
          <option value="disponible">Disponible</option>
          <option value="agotado">Agotado</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>

      {cargando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-14 h-14 bg-accent-light rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-accent-light rounded w-3/4" />
                  <div className="h-3 bg-accent-light rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : productosFiltrados.length > 0 ? (
        <>
          <div className="hidden lg:block bg-white rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-accent-light/30">
                    <th className="text-left text-[11px] font-medium text-muted uppercase tracking-wider px-4 py-3">Producto</th>
                    <th className="text-left text-[11px] font-medium text-muted uppercase tracking-wider px-4 py-3">Categoría</th>
                    <th className="text-left text-[11px] font-medium text-muted uppercase tracking-wider px-4 py-3">Precio</th>
                    <th className="text-left text-[11px] font-medium text-muted uppercase tracking-wider px-4 py-3">Stock</th>
                    <th className="text-left text-[11px] font-medium text-muted uppercase tracking-wider px-4 py-3">Estado</th>
                    <th className="text-right text-[11px] font-medium text-muted uppercase tracking-wider px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {productosFiltrados.map((producto) => (
                    <tr key={producto.id} className="hover:bg-accent-light/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-accent-light rounded-lg overflow-hidden shrink-0">
                            {producto.imagen_url ? (
                              <img src={producto.imagen_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-4 w-4 text-muted/30" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate max-w-[200px]">{producto.nombre}</p>
                            {producto.destacado && (
                              <span className="text-[11px] text-amber-600 font-medium">★ Destacado</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted">{producto.categorias?.nombre || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium">
                          {producto.precio_oferta ? (
                            <>
                              <span className="text-red-600">Bs {producto.precio_oferta}</span>
                              <span className="text-muted line-through ml-1">Bs {producto.precio}</span>
                            </>
                          ) : (
                            `Bs ${producto.precio}`
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${producto.stock <= 5 ? 'text-amber-600 font-medium' : ''}`}>
                          {producto.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={
                          producto.estado === 'disponible' ? 'success' :
                          producto.estado === 'agotado' ? 'danger' : 'default'
                        }>
                          {producto.estado}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => toggleDestacado(producto)}
                            className="p-2 rounded-lg hover:bg-accent-light transition-colors"
                            title={producto.destacado ? 'Quitar destacado' : 'Marcar destacado'}
                          >
                            {producto.destacado ? (
                              <Eye className="h-4 w-4 text-amber-600" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-muted" />
                            )}
                          </button>
                          <Link
                            href={`/admin/productos/${producto.id}`}
                            className="p-2 rounded-lg hover:bg-accent-light transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => setProductoEliminar(producto)}
                            className="p-2 rounded-lg hover:bg-red-50 text-muted hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:hidden space-y-2.5">
            {productosFiltrados.map((producto) => (
              <div key={producto.id} className="bg-white rounded-xl border border-border p-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-accent-light rounded-lg overflow-hidden shrink-0">
                    {producto.imagen_url ? (
                      <img src={producto.imagen_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-4 w-4 text-muted/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{producto.nombre}</p>
                        <p className="text-xs text-muted mt-0.5">{producto.categorias?.nombre || 'Sin categoría'}</p>
                      </div>
                      <Badge variant={
                        producto.estado === 'disponible' ? 'success' :
                        producto.estado === 'agotado' ? 'danger' : 'default'
                      }>
                        {producto.estado}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2.5">
                      <div>
                        <span className="text-sm font-semibold">
                          {producto.precio_oferta ? `Bs ${producto.precio_oferta}` : `Bs ${producto.precio}`}
                        </span>
                        {producto.precio_oferta && (
                          <span className="text-xs text-muted line-through ml-1.5">Bs {producto.precio}</span>
                        )}
                        <span className="text-xs text-muted ml-2">· Stock: {producto.stock}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleDestacado(producto)}
                          className="p-1.5 rounded-lg hover:bg-accent-light transition-colors"
                        >
                          {producto.destacado ? (
                            <Eye className="h-4 w-4 text-amber-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted" />
                          )}
                        </button>
                        <Link
                          href={`/admin/productos/${producto.id}`}
                          className="p-1.5 rounded-lg hover:bg-accent-light transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setProductoEliminar(producto)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12 sm:py-16 bg-white rounded-xl border border-border">
          <div className="w-12 h-12 mx-auto bg-accent-light rounded-xl flex items-center justify-center mb-3">
            <Package className="h-5 w-5 text-muted/40" />
          </div>
          <h3 className="text-base font-medium mb-1">No hay productos</h3>
          <p className="text-sm text-muted mb-4">Comienza agregando tu primer producto</p>
          <Link href="/admin/productos/nuevo">
            <Button>Agregar producto</Button>
          </Link>
        </div>
      )}

      <Modal
        isOpen={!!productoEliminar}
        onClose={() => setProductoEliminar(null)}
        title="Eliminar producto"
      >
        <p className="text-sm text-muted mb-6">
          ¿Eliminar <strong>{productoEliminar?.nombre}</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setProductoEliminar(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleEliminar}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
