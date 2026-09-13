'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, Settings } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function ConfiguracionPage() {
  const [config, setConfig] = useState({
    whatsapp_number: '',
    moneda: '',
    nombre_tienda: '',
  })
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargarConfig() {
      const { data } = await supabase
        .from('configuracion')
        .select('id, valor')

      if (data) {
        const newConfig = {}
        data.forEach(item => {
          try {
            newConfig[item.id] = JSON.parse(item.valor)
          } catch {
            newConfig[item.id] = item.valor
          }
        })
        setConfig(prev => ({ ...prev, ...newConfig }))
      }
      setCargando(false)
    }
    cargarConfig()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setConfig(prev => ({ ...prev, [name]: value }))
    setExito(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setGuardando(true)

    const updates = [
      { id: 'whatsapp_number', valor: JSON.stringify(config.whatsapp_number), descripcion: 'Número de WhatsApp para cotizaciones' },
      { id: 'moneda', valor: JSON.stringify(config.moneda), descripcion: 'Símbolo de moneda' },
      { id: 'nombre_tienda', valor: JSON.stringify(config.nombre_tienda), descripcion: 'Nombre de la tienda' },
    ]

    for (const item of updates) {
      const { error: upsertError } = await supabase
        .from('configuracion')
        .upsert(item, { onConflict: 'id' })

      if (upsertError) {
        setError('Error al guardar la configuración.')
        setGuardando(false)
        return
      }
    }

    setExito(true)
    setGuardando(false)
    setTimeout(() => setExito(false), 3000)
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center">
          <Settings className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
          <p className="text-sm text-muted">Administra los ajustes de tu tienda</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>
        )}

        {exito && (
          <div className="p-4 bg-emerald-50 text-emerald-600 text-sm rounded-xl">Configuración guardada correctamente</div>
        )}

        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-medium">WhatsApp</h2>
          <Input
            label="Número de WhatsApp"
            name="whatsapp_number"
            value={config.whatsapp_number}
            onChange={handleChange}
            placeholder="59170000000"
          />
          <p className="text-xs text-muted">Número con código de país para cotizaciones</p>
        </div>

        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-medium">Tienda</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre de la tienda"
              name="nombre_tienda"
              value={config.nombre_tienda}
              onChange={handleChange}
              placeholder="NUBE"
            />
            <Input
              label="Moneda"
              name="moneda"
              value={config.moneda}
              onChange={handleChange}
              placeholder="Bs"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={guardando}>
            <Save className="h-4 w-4" />
            Guardar cambios
          </Button>
        </div>
      </form>
    </div>
  )
}
