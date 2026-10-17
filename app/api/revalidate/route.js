import { revalidatePath, revalidateTag } from 'next/cache'

export async function POST() {
  try {
    revalidateTag('catalogo', { expire: 0 })
    revalidateTag('productos', { expire: 0 })
    revalidateTag('categorias', { expire: 0 })
    revalidateTag('configuracion', { expire: 0 })
    revalidatePath('/', 'layout')

    return Response.json({ revalidated: true, now: Date.now() })
  } catch (error) {
    return Response.json(
      { revalidated: false, error: error.message },
      { status: 500 }
    )
  }
}
