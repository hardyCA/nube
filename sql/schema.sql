-- ============================================
-- BASE DE DATOS: NUBE - Sistema de Catálogo
-- ============================================

-- Tabla: categorias
CREATE TABLE IF NOT EXISTS categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  descripcion TEXT,
  imagen_url TEXT,
  activa BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: productos
CREATE TABLE IF NOT EXISTS productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  descripcion TEXT,
  descripcion_corta VARCHAR(300),
  precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
  precio_oferta DECIMAL(10,2) CHECK (precio_oferta >= 0),
  imagen_url TEXT,
  galeria JSONB DEFAULT '[]'::jsonb,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  stock_minimo INTEGER DEFAULT 5,
  unidad_medida VARCHAR(20) DEFAULT 'unidad',
  estado VARCHAR(20) DEFAULT 'disponible' CHECK (estado IN ('disponible', 'agotado', 'inactivo')),
  destacado BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: ventas
CREATE TABLE IF NOT EXISTS ventas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_venta SERIAL,
  cliente_nombre VARCHAR(200),
  cliente_telefono VARCHAR(20),
  cliente_email VARCHAR(200),
  cliente_direccion TEXT,
  subtotal DECIMAL(10,2) NOT NULL,
  descuento DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  estado VARCHAR(20) DEFAULT 'completada' CHECK (estado IN ('pendiente', 'completada', 'cancelada')),
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: venta_detalles
CREATE TABLE IF NOT EXISTS venta_detalles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venta_id UUID REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: configuracion
CREATE TABLE IF NOT EXISTS configuracion (
  id VARCHAR(50) PRIMARY KEY,
  valor JSONB NOT NULL,
  descripcion TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_categorias_slug ON categorias(slug);
CREATE INDEX IF NOT EXISTS idx_categorias_activa ON categorias(activa);

CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_estado ON productos(estado);
CREATE INDEX IF NOT EXISTS idx_productos_slug ON productos(slug);
CREATE INDEX IF NOT EXISTS idx_productos_destacado ON productos(destacado);
CREATE INDEX IF NOT EXISTS idx_productos_created ON productos(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_estado ON ventas(estado);
CREATE INDEX IF NOT EXISTS idx_ventas_numero ON ventas(numero_venta);

CREATE INDEX IF NOT EXISTS idx_venta_detalles_venta ON venta_detalles(venta_id);
CREATE INDEX IF NOT EXISTS idx_venta_detalles_producto ON venta_detalles(producto_id);

-- ============================================
-- FUNCTIONS Y TRIGGERS
-- ============================================

-- Function: actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_categorias_updated_at
  BEFORE UPDATE ON categorias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_productos_updated_at
  BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ventas_updated_at
  BEFORE UPDATE ON ventas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: descontar stock
CREATE OR REPLACE FUNCTION descontar_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE productos
  SET stock = stock - NEW.cantidad,
      estado = CASE
        WHEN stock - NEW.cantidad <= 0 THEN 'agotado'
        ELSE estado
      END
  WHERE id = NEW.producto_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_descontar_stock
  AFTER INSERT ON venta_detalles
  FOR EACH ROW EXECUTE FUNCTION descontar_stock();

-- Function: restaurar stock al cancelar venta
CREATE OR REPLACE FUNCTION restaurar_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'cancelada' AND OLD.estado != 'cancelada' THEN
    UPDATE productos p
    SET stock = stock + vd.cantidad,
        estado = 'disponible'
    FROM venta_detalles vd
    WHERE vd.venta_id = NEW.id
      AND p.id = vd.producto_id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_restaurar_stock
  AFTER UPDATE ON ventas
  FOR EACH ROW EXECUTE FUNCTION restaurar_stock();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta_detalles ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (catálogo)
CREATE POLICY "public_select_categorias" ON categorias
  FOR SELECT USING (activa = true);

CREATE POLICY "public_select_productos" ON productos
  FOR SELECT USING (estado IN ('disponible', 'agotado'));

-- Políticas admin (autenticado)
CREATE POLICY "admin_all_categorias" ON categorias
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin_all_productos" ON productos
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin_all_ventas" ON ventas
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin_all_venta_detalles" ON venta_detalles
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin_all_configuracion" ON configuracion
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- STORAGE
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('productos', 'productos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public_select_storage" ON storage.objects
  FOR SELECT USING (bucket_id = 'productos');

CREATE POLICY "admin_insert_storage" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'productos' AND auth.role() = 'authenticated');

CREATE POLICY "admin_delete_storage" ON storage.objects
  FOR DELETE USING (bucket_id = 'productos' AND auth.role() = 'authenticated');

-- ============================================
-- DATOS INICIALES
-- ============================================

INSERT INTO configuracion (id, valor, descripcion) VALUES
  ('whatsapp_number', '"59170000000"', 'Número de WhatsApp para cotizaciones'),
  ('moneda', '"Bs"', 'Símbolo de moneda'),
  ('nombre_tienda', '"NUBE"', 'Nombre de la tienda')
ON CONFLICT (id) DO NOTHING;

-- Categorías de ejemplo
INSERT INTO categorias (nombre, slug, descripcion, orden) VALUES
  ('Electrónica', 'electronica', 'Productos electrónicos y tecnología', 1),
  ('Hogar', 'hogar', 'Artículos para el hogar', 2),
  ('Oficina', 'oficina', 'Equipamiento de oficina', 3)
ON CONFLICT (slug) DO NOTHING;
