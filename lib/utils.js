export function formatearMoneda(cantidad, moneda = 'Bs') {
  return `${moneda} ${Number(cantidad).toFixed(2)}`
}

export function generarSlug(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export function parsearDescripcion(texto) {
  if (!texto) return ''
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}

export function generarMensajeWhatsApp(items, total, config = {}) {
  const moneda = config.moneda || 'Bs'
  const plantilla = config.whatsapp_message || 'Hola, quiero solicitar una cotización:\n\n{productos}\nTotal estimado: {total}\n\nQuedo atento/a.'

  let productosTexto = ''
  items.forEach(item => {
    const subtotal = item.precio * item.cantidad
    productosTexto += `${item.nombre} x ${item.cantidad} — ${moneda} ${subtotal.toFixed(2)}\n`
  })

  const mensaje = plantilla
    .replace('{productos}', productosTexto)
    .replace('{total}', `${moneda} ${total.toFixed(2)}`)

  return encodeURIComponent(mensaje)
}

export function enviarWhatsApp(mensaje, numeroWhatsApp) {
  const numero = String(numeroWhatsApp || '').replace(/\D/g, '')
  if (!numero) return
  const url = `https://wa.me/${numero}?text=${mensaje}`
  const ventana = window.open(url, '_blank')
  if (!ventana) {
    window.location.href = url
  }
}

export function obtenerEstadoColor(estado) {
  const colores = {
    disponible: 'text-emerald-600 bg-emerald-50',
    agotado: 'text-red-600 bg-red-50',
    inactivo: 'text-gray-500 bg-gray-100',
    pendiente: 'text-amber-600 bg-amber-50',
    completada: 'text-emerald-600 bg-emerald-50',
    cancelada: 'text-red-600 bg-red-50'
  }
  return colores[estado] || 'text-gray-600 bg-gray-100'
}

export function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatearFechaCorta(fecha) {
  return new Date(fecha).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
