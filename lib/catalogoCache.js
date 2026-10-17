import { unstable_cache } from 'next/cache'
import { supabase } from '@/lib/supabase'

// Revalidar automáticamente cada 24 horas como respaldo, o al instante cuando el Admin edita algo
const CACHE_TTL_SECONDS = 86400

/**
 * Obtiene las categorías activas desde el caché del servidor (0 consultas repetidas por visitante)
 */
export const getCategoriasActivas = unstable_cache(
  async () => {
    const { data, error } = await supabase
      .from('categorias')
      .select('id, nombre, slug, descripcion, orden')
      .eq('activa', true)
      .order('orden')

    if (error) {
      console.error('Error cargando categorías:', error)
      return []
    }
    return data || []
  },
  ['categorias-activas'],
  {
    tags: ['catalogo', 'categorias'],
    revalidate: CACHE_TTL_SECONDS,
  }
)

/**
 * Obtiene todos los productos del catálogo con solo las columnas necesarias para listado y búsqueda local.
 * Como el catálogo tiene ~20 laptops, cargarlas y cachearlas en el servidor evita hacer consultas
 * por cada búsqueda, filtro o paginación de los visitantes.
 */
export const getProductosCatalogo = unstable_cache(
  async () => {
    const { data, error } = await supabase
      .from('productos')
      .select(
        'id, nombre, slug, descripcion_corta, precio, precio_oferta, categoria_id, stock, estado, destacado, imagen_url, created_at, categorias(nombre, slug)'
      )
      .in('estado', ['disponible', 'agotado'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error cargando productos del catálogo:', error)
      return []
    }
    return data || []
  },
  ['productos-catalogo-lista'],
  {
    tags: ['catalogo', 'productos'],
    revalidate: CACHE_TTL_SECONDS,
  }
)

/**
 * Obtiene un producto individual por ID (incluyendo descripción completa y galería) desde el caché del servidor.
 */
export const getProductoPorId = (id) =>
  unstable_cache(
    async () => {
      const { data, error } = await supabase
        .from('productos')
        .select('*, categorias(nombre, slug)')
        .eq('id', id)
        .single()

      if (error) {
        return null
      }
      return data
    },
    [`producto-detalle-${id}`],
    {
      tags: ['catalogo', 'productos', `producto-${id}`],
      revalidate: CACHE_TTL_SECONDS,
    }
  )()

/**
 * Obtiene la configuración pública (WhatsApp, moneda, mensaje) desde el caché del servidor.
 */
export const getConfiguracionPublica = unstable_cache(
  async () => {
    const defaultConfig = {
      whatsapp_number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '',
      moneda: 'Bs',
      whatsapp_message: '',
    }

    const { data, error } = await supabase
      .from('configuracion')
      .select('id, valor')
      .in('id', ['whatsapp_number', 'moneda', 'whatsapp_message'])

    if (error || !data) {
      return defaultConfig
    }

    const parsed = { ...defaultConfig }
    data.forEach((item) => {
      try {
        parsed[item.id] = JSON.parse(item.valor)
      } catch {
        parsed[item.id] = item.valor
      }
    })
    return parsed
  },
  ['configuracion-publica'],
  {
    tags: ['catalogo', 'configuracion'],
    revalidate: CACHE_TTL_SECONDS,
  }
)
