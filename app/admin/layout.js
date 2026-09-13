'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Tags,
  Warehouse,
  ShoppingCart,
  BarChart3,
  LogOut,
  Menu,
  X,
  Store,
  ChevronLeft,
  Settings,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/productos', label: 'Productos', icon: Package },
  { href: '/admin/categorias', label: 'Categorías', icon: Tags },
  { href: '/admin/inventario', label: 'Inventario', icon: Warehouse },
  { href: '/admin/ventas', label: 'Ventas', icon: ShoppingCart },
  { href: '/admin/reportes', label: 'Reportes', icon: BarChart3 },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
]

export default function AdminLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session && pathname !== '/admin/login') {
        router.push('/admin/login')
      } else if (session) {
        setUser(session.user)
      }
      setLoading(false)
    }
    checkAuth()
  }, [pathname, router])

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-border border-t-foreground rounded-full animate-spin" />
          <p className="text-sm text-muted">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-white border-r border-border transform transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-14 sm:h-16 px-5 border-b border-border shrink-0">
            <Link href="/admin" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="NUBE" className="h-8 w-8 object-contain" />
              <span className="text-base sm:text-lg font-semibold tracking-tight">NUBE</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 -mr-2 rounded-lg hover:bg-accent-light transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(item.href) && item.href !== '/admin')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-foreground text-white'
                      : 'text-muted hover:text-foreground hover:bg-accent-light'
                  }`}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="p-3 border-t border-border space-y-0.5 shrink-0">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-accent-light transition-all"
            >
              <Store className="h-[18px] w-[18px] shrink-0" />
              Ver tienda
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-red-600 hover:bg-red-50 transition-all w-full"
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 lg:pl-[280px] min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 h-14 sm:h-16 bg-white/80 backdrop-blur-xl border-b border-border flex items-center px-4 sm:px-6 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 mr-2 rounded-lg hover:bg-accent-light transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          {pathname !== '/admin' && (
            <button
              onClick={() => router.back()}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mr-4"
            >
              <ChevronLeft className="h-4 w-4" />
              Volver
            </button>
          )}

          <div className="flex-1" />

          {user && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-accent-light rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-foreground">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-muted hidden sm:block truncate max-w-[160px]">
                {user.email}
              </span>
            </div>
          )}
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
