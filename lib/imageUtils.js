/**
 * Utilidades para comprimir imágenes en el navegador antes de subirlas a Supabase Storage
 * y para eliminar archivos antiguos del bucket y no gastar el límite gratuito de 1 GB / 5 GB Egress.
 */

const MAX_DIMENSION = 1200
const WEBP_QUALITY = 0.82
const BUCKET_NAME = 'productos'

/**
 * Comprime y redimensiona un archivo de imagen a formato WebP usando Canvas.
 * Reduce fotos de 3-8 MB a ~50-120 KB sin pérdida visual perceptible en catálogo.
 * @param {File} file
 * @returns {Promise<File>}
 */
export async function comprimirImagenWebP(file) {
  if (typeof window === 'undefined' || !file?.type?.startsWith('image/')) {
    return file
  }

  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { width, height } = img
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width)
          width = MAX_DIMENSION
        } else {
          width = Math.round((width * MAX_DIMENSION) / height)
          height = MAX_DIMENSION
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file)
            return
          }
          const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '-')
          const compressedFile = new File([blob], `${baseName}.webp`, {
            type: 'image/webp',
            lastModified: Date.now(),
          })
          resolve(compressedFile)
        },
        'image/webp',
        WEBP_QUALITY
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(file)
    }

    img.src = objectUrl
  })
}

/**
 * Sube una imagen comprimida a Supabase Storage con caché de 1 año.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {File} file
 * @returns {Promise<{ publicUrl: string | null, error: any }>}
 */
export async function subirImagenOptimizada(supabase, file) {
  const optimizada = await comprimirImagenWebP(file)
  const ext = optimizada.name.split('.').pop() || 'webp'
  const safeName = optimizada.name
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 40)

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safeName || 'laptop'}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, optimizada, {
      cacheControl: '31536000',
      contentType: optimizada.type || 'image/webp',
      upsert: false,
    })

  if (error) {
    return { publicUrl: null, error }
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName)
  return { publicUrl: data?.publicUrl || null, error: null }
}

/**
 * Extrae el path relativo dentro del bucket 'productos' a partir de una URL pública de Supabase.
 * @param {string} url
 * @returns {string | null}
 */
export function extraerPathStorage(url) {
  if (!url || typeof url !== 'string') return null
  const marker = `/storage/v1/object/public/${BUCKET_NAME}/`
  const index = url.indexOf(marker)
  if (index === -1) return null
  return decodeURIComponent(url.slice(index + marker.length).split('?')[0])
}

/**
 * Elimina una o varias URLs del bucket de Supabase Storage para no acumular basura.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string | string[]} urls
 */
export async function eliminarImagenesDeStorage(supabase, urls) {
  const lista = Array.isArray(urls) ? urls : [urls]
  const paths = lista.map(extraerPathStorage).filter(Boolean)
  if (paths.length === 0) return

  try {
    await supabase.storage.from(BUCKET_NAME).remove(paths)
  } catch (err) {
    console.warn('No se pudieron borrar archivos antiguos de storage:', err)
  }
}

/**
 * Vacía TODAS las imágenes del bucket 'productos' de Supabase Storage
 * y limpia los campos imagen_url y galeria de todos los productos en la base de datos.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {Array} productos
 */
export async function vaciarTodasLasImagenes(supabase, productos = []) {
  let totalArchivosBorrados = 0

  // 1. Listar todos los archivos del bucket y borrarlos en lotes
  const { data: files, error: listErr } = await supabase.storage
    .from(BUCKET_NAME)
    .list('', { limit: 1000 })

  if (!listErr && files && files.length > 0) {
    const names = files
      .map((f) => f.name)
      .filter((n) => n && n !== '.emptyFolderPlaceholder')

    for (let i = 0; i < names.length; i += 100) {
      const lote = names.slice(i, i + 100)
      const { data: removed } = await supabase.storage.from(BUCKET_NAME).remove(lote)
      totalArchivosBorrados += removed?.length || lote.length
    }
  }

  // 2. Limpiar imagen_url y galeria de todos los productos en la tabla
  for (const prod of productos) {
    if (prod.imagen_url || (Array.isArray(prod.galeria) && prod.galeria.length > 0)) {
      await supabase
        .from('productos')
        .update({ imagen_url: '', galeria: [] })
        .eq('id', prod.id)
    }
  }

  return { totalArchivosBorrados }
}
