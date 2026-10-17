/**
 * Dispara la revalidación del caché del servidor cuando el administrador
 * realiza cambios en productos, categorías, inventario o configuración.
 */
export async function revalidarCatalogo() {
  try {
    await fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.warn('No se pudo revalidar el caché:', err)
  }
}
