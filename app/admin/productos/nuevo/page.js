'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Upload, Loader2, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import { generarSlug } from '@/lib/utils'

export default function ProductoFormPage() {
  const router = useRouter()
  const params = useParams()
  const esEdicion = params.id && params.id !== 'nuevo'

  const [form, setForm] = useState({
    nombre: '',
    slug: '',
    descripcion_corta: '',
    descripcion: '',
    precio: '',
    precio_oferta: '',
    categoria_id: '',
    stock: '',
    stock_minimo: '5',
    unidad_medida: 'unidad',
    estado: 'disponible',
    destacado: false,
    imagen_url: '',
    galeria: [],
  })
  const [categorias, setCategorias] = useState([])
  const [subiendo, setSubiendo] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargarDatos() {
      const { data: cats } = await supabase.from('categorias').select('*').order('nombre')
      setCategorias(cats || [])

      if (esEdicion) {
        const { data: prod } = await supabase.from('productos').select('*').eq('id', params.id).single()
        if (prod) {
          setForm({
            nombre: prod.nombre || '',
            slug: prod.slug || '',
            descripcion_corta: prod.descripcion_corta || '',
            descripcion: prod.descripcion || '',
            precio: prod.precio || '',
            precio_oferta: prod.precio_oferta || '',
            categoria_id: prod.categoria_id || '',
            stock: prod.stock?.toString() || '',
            stock_minimo: prod.stock_minimo?.toString() || '5',
            unidad_medida: prod.unidad_medida || 'unidad',
            estado: prod.estado || 'disponible',
            destacado: prod.destacado || false,
            imagen_url: prod.imagen_url || '',
            galeria: Array.isArray(prod.galeria) ? prod.galeria : [],
          })
        }
      }
    }
    cargarDatos()
  }, [esEdicion, params.id])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'nombre' && !esEdicion ? { slug: generarSlug(value) } : {}),
    }))
  }

  const handleImagen = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setSubiendo(true)
    const fileName = `${Date.now()}-${file.name}`
    const { data, error } = await supabase.storage
      .from('productos')
      .upload(fileName, file)

    if (!error) {
      const { data: { publicUrl } } = supabase.storage
        .from('productos')
        .getPublicUrl(fileName)
      setForm(prev => ({ ...prev, imagen_url: publicUrl }))
    }
    setSubiendo(false)
  }

  const handleGaleria = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setSubiendo(true)
    const newUrls = []

    for (const file of files) {
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`
      const { error } = await supabase.storage.from('productos').upload(fileName, file)
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(fileName)
        newUrls.push(publicUrl)
      }
    }

    if (newUrls.length > 0) {
      setForm(prev => ({ ...prev, galeria: [...prev.galeria, ...newUrls] }))
    }
    setSubiendo(false)
  }

  const removeGaleria = (index) => {
    setForm(prev => ({ ...prev, galeria: prev.galeria.filter((_, i) => i !== index) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setGuardando(true)

    const productoData = {
      nombre: form.nombre,
      slug: form.slug || generarSlug(form.nombre),
      descripcion_corta: form.descripcion_corta,
      descripcion: form.descripcion,
      precio: parseFloat(form.precio),
      precio_oferta: form.precio_oferta ? parseFloat(form.precio_oferta) : null,
      categoria_id: form.categoria_id || null,
      stock: parseInt(form.stock) || 0,
      stock_minimo: parseInt(form.stock_minimo) || 5,
      unidad_medida: form.unidad_medida,
      estado: form.estado,
      destacado: form.destacado,
      imagen_url: form.imagen_url,
      galeria: form.galeria,
    }

    let result
    if (esEdicion) {
      result = await supabase.from('productos').update(productoData).eq('id', params.id)
    } else {
      result = await supabase.from('productos').insert(productoData)
    }

    if (result.error) {
      setError('Error al guardar el producto. Verifica los datos.')
      setGuardando(false)
    } else {
      router.push('/admin/productos')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      <h1 className="text-2xl font-bold tracking-tight mb-6">
        {esEdicion ? 'Editar producto' : 'Nuevo producto'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>
        )}

        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-medium">Información básica</h2>

          <Input
            label="Nombre *"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            required
            placeholder="Nombre del producto"
          />

          <Input
            label="Slug"
            name="slug"
            value={form.slug}
            onChange={handleChange}
            placeholder="slug-del-producto"
          />

          <Textarea
            label="Descripción corta"
            name="descripcion_corta"
            value={form.descripcion_corta}
            onChange={handleChange}
            rows={2}
            placeholder="Breve descripción del producto"
          />

          <Textarea
            label="Descripción completa"
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            rows={4}
            placeholder="Descripción detallada del producto"
          />
        </div>

        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-medium">Precio y stock</h2>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Precio *"
              name="precio"
              type="number"
              step="0.01"
              min="0"
              value={form.precio}
              onChange={handleChange}
              required
              placeholder="0.00"
            />
            <Input
              label="Precio de oferta"
              name="precio_oferta"
              type="number"
              step="0.01"
              min="0"
              value={form.precio_oferta}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Stock *"
              name="stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={handleChange}
              required
              placeholder="0"
            />
            <Input
              label="Stock mínimo"
              name="stock_minimo"
              type="number"
              min="0"
              value={form.stock_minimo}
              onChange={handleChange}
              placeholder="5"
            />
            <Input
              label="Unidad"
              name="unidad_medida"
              value={form.unidad_medida}
              onChange={handleChange}
              placeholder="unidad"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-medium">Categoría e imagen</h2>

          <Select
            label="Categoría"
            name="categoria_id"
            value={form.categoria_id}
            onChange={handleChange}
            options={categorias.map(c => ({ value: c.id, label: c.nombre }))}
            placeholder="Seleccionar categoría"
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Imagen principal</label>
            <div className="flex items-center gap-4">
              <label className="flex-1 h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-foreground/30 transition-colors">
                {subiendo ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted" />
                ) : form.imagen_url ? (
                  <img src={form.imagen_url} alt="" className="h-full w-full object-contain p-2" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-muted mb-2" />
                    <span className="text-sm text-muted">Subir imagen</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImagen}
                  className="hidden"
                />
              </label>
              {form.imagen_url && (
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, imagen_url: '' }))}
                  className="text-sm text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Galería de imágenes</label>
            <p className="text-xs text-muted mb-2">Imágenes adicionales del producto (opcional)</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
              {form.galeria.map((url, idx) => (
                <div key={idx} className="relative group aspect-square border border-border rounded-xl overflow-hidden">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeGaleria(idx)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    x
                  </button>
                </div>
              ))}
              {form.galeria.length < 8 && (
                <label className="aspect-square border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-foreground/30 transition-colors">
                  {subiendo ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted" />
                  ) : (
                    <>
                      <Plus className="h-5 w-5 text-muted mb-1" />
                      <span className="text-xs text-muted">Agregar</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGaleria}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-muted">{form.galeria.length}/8 imágenes</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-medium">Estado</h2>

          <Select
            label="Estado"
            name="estado"
            value={form.estado}
            onChange={handleChange}
            options={[
              { value: 'disponible', label: 'Disponible' },
              { value: 'agotado', label: 'Agotado' },
              { value: 'inactivo', label: 'Inactivo' },
            ]}
          />

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="destacado"
              checked={form.destacado}
              onChange={handleChange}
              className="w-4 h-4 rounded border-border text-foreground focus:ring-foreground/10"
            />
            <span className="text-sm font-medium">Producto destacado</span>
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" loading={guardando}>
            {esEdicion ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </div>
      </form>
    </div>
  )
}
