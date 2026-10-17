-- Ejecuta esto en Supabase Dashboard > SQL Editor
-- El público (celular) debe poder leer la configuración de la tienda

DROP POLICY IF EXISTS "public_select_configuracion" ON configuracion;
CREATE POLICY "public_select_configuracion" ON configuracion
  FOR SELECT USING (true);
