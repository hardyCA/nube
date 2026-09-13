'use client'

import { useState, useEffect, useCallback } from 'react'

const CARRITO_KEY = 'nube_carrito'

export function useCarrito() {
  const [items, setItems] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CARRITO_KEY)
      if (guardado) {
        setItems(JSON.parse(guardado))
      }
    } catch (error) {
      console.error('Error cargando carrito:', error)
    }
    setCargando(false)
  }, [])

  useEffect(() => {
    if (!cargando) {
      localStorage.setItem(CARRITO_KEY, JSON.stringify(items))
    }
  }, [items, cargando])

  const agregarProducto = useCallback((producto, cantidad = 1) => {
    setItems(prev => {
      const existente = prev.find(item => item.id === producto.id)
      if (existente) {
        const nuevaCantidad = Math.min(existente.cantidad + cantidad, producto.stock)
        return prev.map(item =>
          item.id === producto.id
            ? { ...item, cantidad: nuevaCantidad }
            : item
        )
      }
      return [...prev, {
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio_oferta || producto.precio,
        imagen_url: producto.imagen_url,
        stock: producto.stock,
        cantidad: Math.min(cantidad, producto.stock)
      }]
    })
  }, [])

  const eliminarProducto = useCallback((productoId) => {
    setItems(prev => prev.filter(item => item.id !== productoId))
  }, [])

  const actualizarCantidad = useCallback((productoId, cantidad) => {
    if (cantidad <= 0) {
      eliminarProducto(productoId)
      return
    }
    setItems(prev => prev.map(item =>
      item.id === productoId
        ? { ...item, cantidad: Math.min(cantidad, item.stock) }
        : item
    ))
  }, [eliminarProducto])

  const limpiarCarrito = useCallback(() => {
    setItems([])
  }, [])

  const total = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)
  const cantidadItems = items.reduce((sum, item) => sum + item.cantidad, 0)

  const estaEnCarrito = useCallback((productoId) => {
    return items.some(item => item.id === productoId)
  }, [items])

  const obtenerCantidad = useCallback((productoId) => {
    const item = items.find(item => item.id === productoId)
    return item ? item.cantidad : 0
  }, [items])

  return {
    items,
    cargando,
    total,
    cantidadItems,
    agregarProducto,
    eliminarProducto,
    actualizarCantidad,
    limpiarCarrito,
    estaEnCarrito,
    obtenerCantidad
  }
}
