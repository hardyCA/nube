'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingBag, Menu, X, Store, Search } from 'lucide-react'
import { useCarrito } from '@/hooks/useCarrito'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const { cantidadItems } = useCarrito()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const navLinks = [
    { href: '/', label: 'Inicio' },
    { href: '/catalogo', label: 'Catálogo' },
  ]

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-xl shadow-[0_1px_0_0_rgba(0,0,0,0.05)]'
            : 'bg-white/0'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <img src="/logo.png" alt="NUBE" className="h-8 w-8 object-contain" />
              <span className="text-base sm:text-lg font-semibold tracking-tight">NUBE</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    pathname === link.href
                      ? 'bg-foreground text-white'
                      : 'text-muted hover:text-foreground hover:bg-black/[0.04]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1.5">
              <Link
                href="/catalogo"
                className="p-2.5 rounded-full hover:bg-black/[0.04] transition-colors md:hidden"
              >
                <Search className="h-5 w-5" />
              </Link>

              <Link
                href="/cotizacion"
                className="relative p-2.5 rounded-full hover:bg-black/[0.04] transition-colors"
              >
                <ShoppingBag className="h-5 w-5" />
                {cantidadItems > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-foreground text-white text-[11px] font-semibold rounded-full flex items-center justify-center">
                    {cantidadItems > 99 ? '99+' : cantidadItems}
                  </span>
                )}
              </Link>

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2.5 rounded-full hover:bg-black/[0.04] transition-colors"
                aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMenuOpen(false)}
      />

      <nav
        className={`fixed top-14 sm:top-16 left-0 right-0 z-50 bg-white border-b border-border transition-all duration-300 md:hidden ${
          menuOpen
            ? 'translate-y-0 opacity-100'
            : '-translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <div className="px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-4 py-3 rounded-xl text-base font-medium transition-all ${
                pathname === link.href
                  ? 'bg-foreground text-white'
                  : 'text-muted hover:text-foreground hover:bg-black/[0.04]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
