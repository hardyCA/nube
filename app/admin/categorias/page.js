'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Tags } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Modal from '@/components/ui/Modal'
import { generarSlug } from '@/lib/utils'

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [eliminando, setEliminando] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({ nombre: '', slug: '', descripcion: '', orden: 0 })
  const [error, setError] = useState('')

  useEffect(() => {
    cargarCategorias()
  }, [])

  async function cargarCategorias() {
    const { data } = await supabase.from('categorias').select('*').order('orden')
    setCategorias(data || [])
    setCargando(false)
  }

  function abrirCrear() {
    setEditando(null)
    setForm({ nombre: '', slug: '', descripcion: '', orden: categorias.length })
    setModalOpen(true)
    setError('')
  }

  function abrirEditar(cat) {
    setEditando(cat)
    setForm({ nombre: cat.nombre, slug: cat.slug, descripcion: cat.descripcion || '', orden: cat.orden })
    setModalOpen(true)
    setError('')
  }

  async function handleGuardar(e) {
    e.preventDefault()
    setError('')
    setGuardando(true)

    const data = {
      nombre: form.nombre,
      slug: form.slug || generarSlug(form.nombre),
      descripcion: form.descripcion,
      orden: parseInt(form.orden) || 0,
    }

    if (editando) {
      const { error } = await supabase.from('categorias').update(data).eq('id', editando.id)
      if (error) setError('Error al actualizar')
    } else {
      const { error } = await supabase.from('categorias').insert(data)
      if (error) setError('Error al crear la categoría')
    }

    setGuardando(false)
    if (!error) {
      setModalOpen(false)
      cargarCategorias()
    }
  }

  async function handleEliminar() {
    if (!eliminando) return
    await supabase.from('categorias').delete().eq('id', eliminando.id)
    setEliminando(null)
    cargarCategorias()
  }

  async function toggleActiva(cat) {
    await supabase.from('categorias').update({ activa: !cat.activa }).eq('id', cat.id)
    setCategorias(prev => prev.map(c => c.id === cat.id ? { ...c, activa: !c.activa } : c))
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Categorías</h1>
          <p className="text-muted text-sm mt-1">{categorias.length} categorías</p>
        </div>
        <Button onClick={abrirCrear} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Nueva categoría
        </Button>
      </div>

      {cargando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-5 animate-pulse">
              <div className="h-4 bg-accent-light rounded w-1/2 mb-3" />
              <div className="h-3 bg-accent-light rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : categorias.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categorias.map((cat) => (
            <div key={cat.id} className="bg-white rounded-xl border border-border p-4 sm:p-5 transition-all hover:shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold truncate">{cat.nombre}</h3>
                  {cat.descripcion && (
                    <p className="text-xs text-muted mt-1 line-clamp-2">{cat.descripcion}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2.5">
                    <code className="text-[11px] bg-accent-light px-1.5 py-0.5 rounded">{cat.slug}</code>
                    <span className="text-[11px] text-muted">Orden: {cat.orden}</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleActiva(cat)}
                  className={`shrink-0 w-10 h-6 rounded-full transition-colors relative ${
                    cat.activa ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                    cat.activa ? 'left-[18px]' : 'left-0.5'
                  }`} />
                </button>
              </div>
              <div className="flex items-center gap-1 mt-4 pt-3 border-t border-border">
                <button
                  onClick={() => abrirEditar(cat)}
                  className="flex-1 h-8 px-3 text-xs font-medium text-muted hover:text-foreground hover:bg-accent-light rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => setEliminando(cat)}
                  className="flex-1 h-8 px-3 text-xs font-medium text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 sm:py-16 bg-white rounded-xl border border-border">
          <div className="w-12 h-12 mx-auto bg-accent-light rounded-xl flex items-center justify-center mb-3">
            <Tags className="h-5 w-5 text-muted/40" />
          </div>
          <h3 className="text-base font-medium mb-1">No hay categorías</h3>
          <p className="text-sm text-muted mb-4">Crea tu primera categoría</p>
          <Button onClick={abrirCrear}>Crear categoría</Button>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editando ? 'Editar categoría' : 'Nueva categoría'}
      >
        <form onSubmit={handleGuardar} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>
          )}
          <Input
            label="Nombre *"
            value={form.nombre}
            onChange={(e) => setForm(prev => ({ ...prev, nombre: e.target.value }))}
            required
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
            placeholder="se-genera-desde-el-nombre"
          />
          <Textarea
            label="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm(prev => ({ ...prev, descripcion: e.target.value }))}
            rows={2}
          />
          <Input
            label="Orden"
            type="number"
            value={form.orden}
            onChange={(e) => setForm(prev => ({ ...prev, orden: e.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={guardando}>
              {editando ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!eliminando}
        onClose={() => setEliminando(null)}
        title="Eliminar categoría"
      >
        <p className="text-sm text-muted mb-6">
          ¿Eliminar <strong>{eliminando?.nombre}</strong>? Los productos no se eliminarán.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setEliminando(null)}>Cancelar</Button>
          <Button variant="danger" onClick={handleEliminar}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  )
}
