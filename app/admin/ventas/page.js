'use client'

import { useState, useEffect, useMemo, Fragment } from 'react'
import {
  ShoppingCart, Search, Eye, Plus, Minus, Trash2, Package,
  DollarSign, TrendingUp, Clock, CheckCircle, XCircle,
  User, Phone, Calendar, FileText, X, Users, Save, Edit2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import { formatearFecha, formatearFechaCorta } from '@/lib/utils'

export default function VentasPage() {
  const [pestana, setPestana] = useState('ventas')
  const [ventas, setVentas] = useState([])
  const [productos, setProductos] = useState([])
  const [clientes, setClientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroFecha, setFiltroFecha] = useState('')
  const [cargando, setCargando] = useState(true)
  const [ventaDetalle, setVentaDetalle] = useState(null)
  const [nuevaVenta, setNuevaVenta] = useState(false)
  const [carrito, setCarrito] = useState([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [cambiandoEstado, setCambiandoEstado] = useState(null)
  const [clienteModal, setClienteModal] = useState(false)
  const [clienteEditando, setClienteEditando] = useState(null)
  const [formCliente, setFormCliente] = useState({ nombre: '', telefono: '', email: '', direccion: '', notas: '' })
  const [guardandoCliente, setGuardandoCliente] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    const [ventasResult, productosResult, clientesResult] = await Promise.all([
      supabase.from('ventas').select('*').order('created_at', { ascending: false }),
      supabase.from('productos').select('*').eq('estado', 'disponible').gt('stock', 0).order('nombre'),
      supabase.from('clientes').select('*').order('nombre'),
    ])
    setVentas(ventasResult.data || [])
    setProductos(productosResult.data || [])
    setClientes(clientesResult.data || [])
    setCargando(false)
  }

  const stats = useMemo(() => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const mes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const ventasHoy = ventas.filter(v => new Date(v.created_at) >= hoy && v.estado !== 'cancelada')
    const ventasMes = ventas.filter(v => new Date(v.created_at) >= mes && v.estado !== 'cancelada')
    const pendientes = ventas.filter(v => v.estado === 'pendiente')
    const completadas = ventas.filter(v => v.estado === 'completada')
    return {
      ingresoHoy: ventasHoy.reduce((sum, v) => sum + Number(v.total), 0),
      ingresoMes: ventasMes.reduce((sum, v) => sum + Number(v.total), 0),
      pendientes: pendientes.length,
      ticketPromedio: completadas.length > 0
        ? completadas.reduce((sum, v) => sum + Number(v.total), 0) / completadas.length : 0,
    }
  }, [ventas])

  async function handleCrearVenta() {
    if (carrito.length === 0) return
    setGuardando(true)
    const subtotal = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0)
    const { data: venta, error } = await supabase.from('ventas').insert({
      cliente_nombre: clienteSeleccionado?.nombre || null,
      cliente_telefono: clienteSeleccionado?.telefono || null,
      cliente_email: clienteSeleccionado?.email || null,
      cliente_direccion: clienteSeleccionado?.direccion || null,
      subtotal, total: subtotal,
      notas: notas || null,
      estado: 'completada',
    }).select().single()
    if (!error && venta) {
      const detalles = carrito.map(item => ({
        venta_id: venta.id, producto_id: item.id,
        cantidad: item.cantidad, precio_unitario: item.precio,
        subtotal: item.precio * item.cantidad,
      }))
      await supabase.from('venta_detalles').insert(detalles)
      setCarrito([])
      setClienteSeleccionado(null)
      setNotas('')
      setBusquedaProducto('')
      setNuevaVenta(false)
      cargarDatos()
    }
    setGuardando(false)
  }

  async function handleCambiarEstado(ventaId, nuevoEstado) {
    setCambiandoEstado(ventaId)
    await supabase.from('ventas').update({ estado: nuevoEstado }).eq('id', ventaId)
    cargarDatos()
    setCambiandoEstado(null)
    if (ventaDetalle?.id === ventaId) setVentaDetalle(prev => ({ ...prev, estado: nuevoEstado }))
  }

  async function handleGuardarCliente(e) {
    e.preventDefault()
    if (!formCliente.nombre.trim()) return
    setGuardandoCliente(true)
    let clienteGuardado = null

    if (clienteEditando) {
      await supabase.from('clientes').update(formCliente).eq('id', clienteEditando.id)
      clienteGuardado = { ...formCliente, id: clienteEditando.id }
    } else {
      const { data } = await supabase.from('clientes').insert(formCliente).select().single()
      clienteGuardado = data
    }

    setFormCliente({ nombre: '', telefono: '', email: '', direccion: '', notas: '' })
    setClienteEditando(null)
    setClienteModal(false)
    cargarDatos()

    if (clienteGuardado && !clienteEditando) {
      setClienteSeleccionado(clienteGuardado)
    }
    setGuardandoCliente(false)
  }

  async function handleEliminarCliente(id) {
    if (!confirm('¿Eliminar este cliente?')) return
    await supabase.from('clientes').delete().eq('id', id)
    if (clienteSeleccionado?.id === id) setClienteSeleccionado(null)
    cargarDatos()
  }

  function seleccionarCliente(cliente) {
    setClienteSeleccionado(cliente)
    setBusquedaCliente('')
  }

  function agregarAlCarrito(producto) {
    const existente = carrito.find(item => item.id === producto.id)
    if (existente) {
      if (existente.cantidad < producto.stock) {
        setCarrito(prev => prev.map(item =>
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        ))
      }
    } else {
      setCarrito(prev => [...prev, {
        id: producto.id, nombre: producto.nombre,
        precio: parseFloat(producto.precio), stock: producto.stock,
        cantidad: 1, imagen_url: producto.imagen_url,
      }])
    }
  }

  function removerDelCarrito(id) {
    setCarrito(prev => prev.filter(i => i.id !== id))
  }

  function actualizarCantidad(id, nuevaCantidad) {
    if (nuevaCantidad <= 0) { removerDelCarrito(id); return }
    setCarrito(prev => prev.map(item =>
      item.id === id ? { ...item, cantidad: Math.min(nuevaCantidad, item.stock) } : item
    ))
  }

  const clientesFiltrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
    c.telefono?.includes(busquedaCliente)
  )

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase())
  )

  const ventasFiltradas = ventas.filter(v => {
    const matchBusqueda = !busqueda ||
      v.cliente_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.numero_venta?.toString().includes(busqueda)
    const matchEstado = !filtroEstado || v.estado === filtroEstado
    const matchFecha = !filtroFecha || formatearFechaCorta(v.created_at) === filtroFecha
    return matchBusqueda && matchEstado && matchFecha
  })

  const totalCarrito = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0)
  const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0)

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Ventas</h1>
          <p className="text-muted text-sm mt-1">Gestiona ventas y clientes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => { setClienteEditando(null); setFormCliente({ nombre: '', telefono: '', email: '', direccion: '', notas: '' }); setClienteModal(true) }}>
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Clientes</span>
          </Button>
          <Button onClick={() => setNuevaVenta(true)}>
            <Plus className="h-4 w-4" />
            Nueva venta
          </Button>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-accent-light rounded-xl w-fit">
        {[
          { id: 'ventas', label: 'Ventas', icon: ShoppingCart },
          { id: 'clientes', label: 'Clientes', icon: Users },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setPestana(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              pestana === tab.id ? 'bg-white text-foreground shadow-sm' : 'text-muted hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {pestana === 'ventas' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted">Ingreso hoy</p>
                  <p className="text-lg font-bold tabular-nums">Bs {stats.ingresoHoy.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted">Ingreso mes</p>
                  <p className="text-lg font-bold tabular-nums">Bs {stats.ingresoMes.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted">Pendientes</p>
                  <p className="text-lg font-bold tabular-nums">{stats.pendientes}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted">Ticket prom.</p>
                  <p className="text-lg font-bold tabular-nums">Bs {stats.ticketPromedio.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
              <input type="text" placeholder="Buscar por cliente o #venta..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all" />
            </div>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
              className="h-10 px-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all">
              <option value="">Todos los estados</option>
              <option value="completada">Completada</option>
              <option value="pendiente">Pendiente</option>
              <option value="cancelada">Cancelada</option>
            </select>
            <input type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)}
              className="h-10 px-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all" />
          </div>

          {cargando ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl border border-border animate-pulse" />)}</div>
          ) : ventasFiltradas.length > 0 ? (
            <div className="space-y-2 sm:space-y-0 sm:bg-white sm:rounded-xl sm:border sm:border-border sm:overflow-hidden">
              {ventasFiltradas.map((venta) => (
                <div key={venta.id} className="bg-white sm:bg-transparent border-b sm:border-b-0 border-border last:border-b-0 p-4 hover:bg-accent-light/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-accent-light rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-foreground">#{venta.numero_venta}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium truncate">{venta.cliente_nombre || 'Sin cliente'}</p>
                        <Badge variant={venta.estado === 'completada' ? 'success' : venta.estado === 'pendiente' ? 'warning' : 'danger'}>{venta.estado}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatearFechaCorta(venta.created_at)}</span>
                        {venta.cliente_telefono && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{venta.cliente_telefono}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold tabular-nums">Bs {Number(venta.total).toFixed(2)}</p>
                      <div className="flex items-center gap-1 mt-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setVentaDetalle(venta)}><Eye className="h-3.5 w-3.5" /></Button>
                        {venta.estado === 'pendiente' && (
                          <Fragment>
                            <Button size="sm" variant="ghost" onClick={() => handleCambiarEstado(venta.id, 'completada')} loading={cambiandoEstado === venta.id} className="text-emerald-600 hover:bg-emerald-50"><CheckCircle className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => handleCambiarEstado(venta.id, 'cancelada')} loading={cambiandoEstado === venta.id} className="text-red-600 hover:bg-red-50"><XCircle className="h-3.5 w-3.5" /></Button>
                          </Fragment>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16 bg-white rounded-xl border border-border">
              <div className="w-12 h-12 mx-auto bg-accent-light rounded-xl flex items-center justify-center mb-3"><ShoppingCart className="h-5 w-5 text-muted/40" /></div>
              <h3 className="text-base font-medium mb-1">No hay ventas</h3>
              <p className="text-sm text-muted">Registra tu primera venta</p>
            </div>
          )}
        </>
      )}

      {pestana === 'clientes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
              <input type="text" placeholder="Buscar por nombre o teléfono..." value={busquedaCliente} onChange={(e) => setBusquedaCliente(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all" />
            </div>
            <Button onClick={() => { setClienteEditando(null); setFormCliente({ nombre: '', telefono: '', email: '', direccion: '', notas: '' }); setClienteModal(true) }}>
              <Plus className="h-4 w-4" />
              Nuevo cliente
            </Button>
          </div>

          {clientesFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {clientesFiltrados.map(cliente => (
                <div key={cliente.id} className="bg-white rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent-light rounded-full flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-foreground">{cliente.nombre.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{cliente.nombre}</p>
                        {cliente.telefono && <p className="text-xs text-muted flex items-center gap-1"><Phone className="h-3 w-3" />{cliente.telefono}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setClienteEditando(cliente); setFormCliente({ nombre: cliente.nombre, telefono: cliente.telefono || '', email: cliente.email || '', direccion: cliente.direccion || '', notas: cliente.notas || '' }); setClienteModal(true) }}
                        className="p-1.5 text-muted hover:text-foreground hover:bg-accent-light rounded-lg transition-colors">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleEliminarCliente(cliente.id)}
                        className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {(cliente.email || cliente.direccion) && (
                    <div className="mt-3 pt-3 border-t border-border text-xs text-muted space-y-1">
                      {cliente.email && <p>{cliente.email}</p>}
                      {cliente.direccion && <p>{cliente.direccion}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-border">
              <div className="w-12 h-12 mx-auto bg-accent-light rounded-xl flex items-center justify-center mb-3"><Users className="h-5 w-5 text-muted/40" /></div>
              <h3 className="text-base font-medium mb-1">No hay clientes</h3>
              <p className="text-sm text-muted">Agrega tu primer cliente</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Nueva Venta - Ultra ancho */}
      <Modal isOpen={nuevaVenta} onClose={() => setNuevaVenta(false)} title="Nueva venta" maxWidth="max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Cliente</h3>
                <Button size="sm" variant="ghost" onClick={() => { setClienteEditando(null); setFormCliente({ nombre: '', telefono: '', email: '', direccion: '', notas: '' }); setClienteModal(true) }}>
                  <Plus className="h-3 w-3" /> Nuevo
                </Button>
              </div>
              {clienteSeleccionado ? (
                <div className="flex items-center justify-between bg-accent-light/50 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-foreground text-white rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold">{clienteSeleccionado.nombre.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{clienteSeleccionado.nombre}</p>
                      <p className="text-xs text-muted">{clienteSeleccionado.telefono || 'Sin teléfono'}</p>
                    </div>
                  </div>
                  <button onClick={() => setClienteSeleccionado(null)} className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                    <input type="text" placeholder="Buscar cliente existente..." value={busquedaCliente} onChange={(e) => setBusquedaCliente(e.target.value)}
                      className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all" />
                  </div>
                  {busquedaCliente && clientesFiltrados.length > 0 && (
                    <div className="max-h-40 overflow-y-auto border border-border rounded-xl divide-y divide-border">
                      {clientesFiltrados.slice(0, 5).map(c => (
                        <button key={c.id} onClick={() => seleccionarCliente(c)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-accent-light/30 transition-colors text-left">
                          <div className="w-8 h-8 bg-accent-light rounded-full flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold">{c.nombre.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{c.nombre}</p>
                            <p className="text-xs text-muted">{c.telefono || 'Sin teléfono'}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {busquedaCliente && clientesFiltrados.length === 0 && (
                    <p className="text-xs text-muted text-center py-2">No se encontraron clientes</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Buscar productos</label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                <input type="text" placeholder="Escribe para buscar..." value={busquedaProducto} onChange={(e) => setBusquedaProducto(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all" />
              </div>
              <div className="max-h-56 overflow-y-auto border border-border rounded-xl divide-y divide-border">
                {productosFiltrados.length > 0 ? productosFiltrados.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-accent-light/30 transition-colors">
                    <div className="w-11 h-11 bg-accent-light rounded-lg overflow-hidden shrink-0">
                      {p.imagen_url ? <img src={p.imagen_url} alt="" className="w-full h-full object-cover" /> :
                        <div className="w-full h-full flex items-center justify-center"><Package className="h-4 w-4 text-muted/30" /></div>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{p.nombre}</p>
                      <p className="text-xs text-muted">Bs {p.precio} · Stock: {p.stock}</p>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => agregarAlCarrito(p)}><Plus className="h-3 w-3" /></Button>
                  </div>
                )) : <p className="p-4 text-sm text-muted text-center">No hay productos</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5">Notas</label>
              <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Notas de la venta (opcional)" rows={2}
                className="w-full px-3 py-2 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all resize-none" />
            </div>
          </div>

          <div className="lg:col-span-2 bg-accent-light/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Carrito</h3>
              {totalItems > 0 && <span className="text-xs text-muted">{totalItems} items</span>}
            </div>
            {carrito.length === 0 ? (
              <div className="py-10 text-center">
                <ShoppingCart className="h-10 w-10 mx-auto text-muted/20 mb-2" />
                <p className="text-xs text-muted">Agrega productos</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {carrito.map(item => (
                    <div key={item.id} className="bg-white rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{item.nombre}</p>
                          <p className="text-xs text-muted">Bs {item.precio} c/u</p>
                        </div>
                        <button onClick={() => removerDelCarrito(item.id)} className="p-1 text-muted hover:text-red-600 rounded-lg transition-colors shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-border rounded-full overflow-hidden">
                          <button onClick={() => actualizarCantidad(item.id, item.cantidad - 1)} className="w-7 h-7 flex items-center justify-center hover:bg-accent-light transition-colors"><Minus className="h-3 w-3" /></button>
                          <span className="w-7 text-center text-xs font-semibold tabular-nums">{item.cantidad}</span>
                          <button onClick={() => actualizarCantidad(item.id, item.cantidad + 1)} className="w-7 h-7 flex items-center justify-center hover:bg-accent-light transition-colors"><Plus className="h-3 w-3" /></button>
                        </div>
                        <span className="text-sm font-semibold tabular-nums">Bs {(item.precio * item.cantidad).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-3 space-y-1">
                  <div className="flex justify-between text-base font-bold pt-1">
                    <span>Total</span>
                    <span className="tabular-nums">Bs {totalCarrito.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" onClick={() => setNuevaVenta(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleCrearVenta} loading={guardando} disabled={carrito.length === 0} className="flex-1">Registrar venta</Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Cliente */}
      <Modal isOpen={clienteModal} onClose={() => { setClienteModal(false); setClienteEditando(null) }} title={clienteEditando ? 'Editar cliente' : 'Nuevo cliente'} maxWidth="max-w-md">
        <form onSubmit={handleGuardarCliente} className="space-y-3">
          <Input label="Nombre *" value={formCliente.nombre} onChange={(e) => setFormCliente(prev => ({ ...prev, nombre: e.target.value }))} placeholder="Nombre completo" required />
          <Input label="Teléfono" value={formCliente.telefono} onChange={(e) => setFormCliente(prev => ({ ...prev, telefono: e.target.value }))} placeholder="Teléfono" />
          <Input label="Email" value={formCliente.email} onChange={(e) => setFormCliente(prev => ({ ...prev, email: e.target.value }))} placeholder="Email" type="email" />
          <Input label="Dirección" value={formCliente.direccion} onChange={(e) => setFormCliente(prev => ({ ...prev, direccion: e.target.value }))} placeholder="Dirección" />
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Notas</label>
            <textarea value={formCliente.notas} onChange={(e) => setFormCliente(prev => ({ ...prev, notas: e.target.value }))} placeholder="Notas sobre el cliente" rows={2}
              className="w-full px-3 py-2 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all resize-none" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setClienteModal(false); setClienteEditando(null) }} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={guardandoCliente} className="flex-1"><Save className="h-4 w-4" />{clienteEditando ? 'Guardar' : 'Crear'}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalle Venta */}
      <Modal isOpen={!!ventaDetalle} onClose={() => setVentaDetalle(null)} title={`Venta #${ventaDetalle?.numero_venta}`} maxWidth="max-w-lg">
        {ventaDetalle && <VentaDetalle venta={ventaDetalle} onCambiarEstado={handleCambiarEstado} cambiandoEstado={cambiandoEstado === ventaDetalle.id} />}
      </Modal>
    </div>
  )
}

function VentaDetalle({ venta, onCambiarEstado, cambiandoEstado }) {
  const [detalles, setDetalles] = useState([])
  const [cargandoDetalles, setCargandoDetalles] = useState(true)

  useEffect(() => {
    async function cargarDetalles() {
      const { data } = await supabase.from('venta_detalles').select('*, productos(nombre, imagen_url)').eq('venta_id', venta.id)
      setDetalles(data || [])
      setCargandoDetalles(false)
    }
    cargarDetalles()
  }, [venta.id])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted" /><div><p className="text-xs text-muted">Fecha</p><p className="font-medium">{formatearFecha(venta.created_at)}</p></div></div>
        <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted" /><div><p className="text-xs text-muted">Estado</p><Badge variant={venta.estado === 'completada' ? 'success' : venta.estado === 'pendiente' ? 'warning' : 'danger'}>{venta.estado}</Badge></div></div>
        {venta.cliente_nombre && <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted" /><div><p className="text-xs text-muted">Cliente</p><p className="font-medium">{venta.cliente_nombre}</p></div></div>}
        {venta.cliente_telefono && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted" /><div><p className="text-xs text-muted">Teléfono</p><p className="font-medium">{venta.cliente_telefono}</p></div></div>}
      </div>
      <div className="border-t border-border pt-4">
        <h4 className="text-sm font-medium mb-3">Productos</h4>
        {cargandoDetalles ? <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-accent-light rounded-lg animate-pulse" />)}</div> :
          detalles.length > 0 ? (
            <div className="space-y-2">
              {detalles.map(detalle => (
                <div key={detalle.id} className="flex items-center gap-3 p-2 bg-accent-light/30 rounded-lg">
                  <div className="w-10 h-10 bg-white rounded-lg overflow-hidden shrink-0">
                    {detalle.productos?.imagen_url ? <img src={detalle.productos.imagen_url} alt="" className="w-full h-full object-cover" /> :
                      <div className="w-full h-full flex items-center justify-center"><Package className="h-4 w-4 text-muted/30" /></div>}
                  </div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{detalle.productos?.nombre || 'Producto'}</p><p className="text-xs text-muted">{detalle.cantidad} x Bs {Number(detalle.precio_unitario).toFixed(2)}</p></div>
                  <span className="text-sm font-semibold tabular-nums shrink-0">Bs {Number(detalle.subtotal).toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted text-center py-4">Sin detalles</p>}
      </div>
      <div className="border-t border-border pt-4 flex items-center justify-between"><span className="font-semibold">Total</span><span className="text-xl font-bold tabular-nums">Bs {Number(venta.total).toFixed(2)}</span></div>
      {venta.notas && <div className="bg-accent-light/30 rounded-lg p-3"><p className="text-xs text-muted mb-1">Notas</p><p className="text-sm">{venta.notas}</p></div>}
      {venta.estado === 'pendiente' && (
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={() => onCambiarEstado(venta.id, 'cancelada')} loading={cambiandoEstado} className="flex-1 text-red-600"><XCircle className="h-4 w-4" />Cancelar</Button>
          <Button onClick={() => onCambiarEstado(venta.id, 'completada')} loading={cambiandoEstado} className="flex-1"><CheckCircle className="h-4 w-4" />Completar</Button>
        </div>
      )}
    </div>
  )
}
