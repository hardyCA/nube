import { getConfiguracionPublica } from '@/lib/catalogoCache'
import CotizacionClient from './CotizacionClient'

export default async function CotizacionPage() {
  const config = await getConfiguracionPublica()

  return <CotizacionClient config={config} />
}
