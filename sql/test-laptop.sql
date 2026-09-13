-- Producto de prueba: Laptop
-- Ejecuta esto en Supabase Dashboard > SQL Editor

-- Laptops de prueba
INSERT INTO productos (
  nombre,
  slug,
  descripcion_corta,
  descripcion,
  precio,
  precio_oferta,
  imagen_url,
  galeria,
  categoria_id,
  stock,
  stock_minimo,
  unidad_medida,
  estado,
  destacado
) VALUES
(
  'Laptop Gamer Pro 15"',
  'laptop-gamer-pro-15',
  'Laptop de alto rendimiento para gaming y trabajo',
  'Laptop Gamer Pro con pantalla IPS de 15.6 pulgadas, resolución 1920x1080. Procesador Intel Core i7 de 12ª generación, 16GB de RAM DDR5, SSD NVMe de 512GB. Tarjeta gráfica NVIDIA RTX 3060 con 6GB VRAM. Teclado retroiluminado RGB, sistema de enfriamiento mejorado con doble ventilador.',
  5999.00,
  5499.00,
  'https://placehold.co/800x600/1a1a2e/ffffff?text=Laptop+Gamer+Pro',
  '[
    "https://placehold.co/800x600/1a1a2e/ffffff?text=Vista+Frontal",
    "https://placehold.co/800x600/16213e/ffffff?text=Teclado+RGB",
    "https://placehold.co/800x600/0f3460/ffffff?text=Puertos",
    "https://placehold.co/800x600/533483/ffffff?text=Lateral"
  ]'::jsonb,
  (SELECT id FROM categorias WHERE slug = 'electronica' LIMIT 1),
  15,
  3,
  'unidad',
  'disponible',
  true
),
(
  'Laptop Oficina Ultra 14"',
  'laptop-oficina-ultra-14',
  'Laptop ligera y elegante para trabajo diario',
  'Laptop Ultrabook con pantalla de 14 pulgadas Full HD IPS. Procesador Intel Core i5 de 13ª generación, 8GB de RAM DDR4, SSD NVMe de 256GB. Diseño delgado y ligero de apenas 1.3kg. Batería de larga duración hasta 10 horas. Ideal para oficina y productividad.',
  3299.00,
  null,
  'https://placehold.co/800x600/2d3436/ffffff?text=Laptop+Oficina',
  '[
    "https://placehold.co/800x600/2d3436/ffffff?text=Vista+Superior",
    "https://placehold.co/800x600/636e72/ffffff?text=Cerrada"
  ]'::jsonb,
  (SELECT id FROM categorias WHERE slug = 'electronica' LIMIT 1),
  25,
  5,
  'unidad',
  'disponible',
  false
),
(
  'Laptop Student Book 13"',
  'laptop-student-book-13',
  'Laptop económica perfecta para estudiantes',
  'Laptop compacta con pantalla de 13.3 pulgadas. Procesador AMD Ryzen 5, 8GB de RAM, SSD de 256GB. Sistema operativo incluido. Conexión WiFi 6 y Bluetooth 5.0. Perfecta para tareas de oficina, navegación y estudio.',
  1899.00,
  1699.00,
  'https://placehold.co/800x600/00b894/ffffff?text=Laptop+Student',
  '[]'::jsonb,
  (SELECT id FROM categorias WHERE slug = 'electronica' LIMIT 1),
  40,
  10,
  'unidad',
  'disponible',
  false
);
