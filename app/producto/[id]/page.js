import { getProductoPorId } from '@/lib/catalogoCache'
import ProductoDetalleClient from './ProductoDetalleClient'

export default async function ProductoPage({ params }) {
  const { id } = await params
  const producto = await getProductoPorId(id)

  return <ProductoDetalleClient producto={producto} />
}
