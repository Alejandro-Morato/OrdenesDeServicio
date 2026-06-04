-- ════════════════════════════════════════════════════════════════════════════
-- SISTEMA DE ÓRDENES DE SERVICIO - INTER RURAL
-- Base de datos para Supabase PostgreSQL
-- ════════════════════════════════════════════════════════════════════════════

-- ── EXTENSIONES ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── TABLA: usuarios ──────────────────────────────────────────────────────────
-- Usuarios del sistema con roles (taller, refacciones, gerencia)
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('taller', 'refacciones', 'gerencia')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLA: ordenes ───────────────────────────────────────────────────────────
-- Órdenes de servicio principales
CREATE TABLE ordenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio INTEGER UNIQUE NOT NULL,

  -- Datos del cliente y equipo
  cliente_nombre TEXT NOT NULL,
  equipo_descripcion TEXT NOT NULL,
  equipo_serial TEXT,

  -- Fechas
  fecha_entrada DATE NOT NULL,
  fecha_termino DATE,

  -- Técnico asignado
  tecnico_id UUID REFERENCES usuarios(id),
  tecnico_nombre TEXT NOT NULL,

  -- Información de la falla
  falla_reportada TEXT,

  -- Control de garantía
  es_garantia BOOLEAN DEFAULT false,

  -- Estados de cierre
  cerrada_taller BOOLEAN DEFAULT false,
  cerrada_refacciones BOOLEAN DEFAULT false,

  -- Mano de obra
  horas_trabajo NUMERIC(10,2) DEFAULT 0,
  tarifa_hora NUMERIC(10,2) DEFAULT 0,
  total_mano_obra NUMERIC(10,2) DEFAULT 0,

  -- Total general
  total_orden NUMERIC(10,2) DEFAULT 0,

  -- Auditoría
  creado_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_ordenes_folio ON ordenes(folio);
CREATE INDEX idx_ordenes_tecnico ON ordenes(tecnico_id);
CREATE INDEX idx_ordenes_fecha ON ordenes(fecha_entrada);
CREATE INDEX idx_ordenes_estado ON ordenes(cerrada_taller, cerrada_refacciones);

-- ── TABLA: piezas ────────────────────────────────────────────────────────────
-- Piezas/refacciones de cada orden
CREATE TABLE piezas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orden_id UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,

  cantidad INTEGER NOT NULL DEFAULT 1,
  codigo TEXT,
  descripcion TEXT NOT NULL,
  numero_serie TEXT,

  -- Precio INCLUYE IVA (se desglosará al imprimir)
  precio_unitario_con_iva NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Para garantías: indica si esta pieza NO entra en garantía
  excluida_garantia BOOLEAN DEFAULT false,

  -- Calculados
  subtotal NUMERIC(10,2) GENERATED ALWAYS AS (precio_unitario_con_iva * cantidad / 1.16) STORED,
  iva NUMERIC(10,2) GENERATED ALWAYS AS ((precio_unitario_con_iva * cantidad) - (precio_unitario_con_iva * cantidad / 1.16)) STORED,
  total NUMERIC(10,2) GENERATED ALWAYS AS (precio_unitario_con_iva * cantidad) STORED,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_piezas_orden ON piezas(orden_id);

-- ── TABLA: gastos_diversos ──────────────────────────────────────────────────
-- Gastos adicionales (flete, herramientas, etc.)
CREATE TABLE gastos_diversos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orden_id UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,

  cantidad INTEGER NOT NULL DEFAULT 1,
  codigo TEXT,
  descripcion TEXT NOT NULL,
  referencia TEXT,

  -- Precio INCLUYE IVA
  precio_unitario_con_iva NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Calculados
  subtotal NUMERIC(10,2) GENERATED ALWAYS AS (precio_unitario_con_iva * cantidad / 1.16) STORED,
  iva NUMERIC(10,2) GENERATED ALWAYS AS ((precio_unitario_con_iva * cantidad) - (precio_unitario_con_iva * cantidad / 1.16)) STORED,
  total NUMERIC(10,2) GENERATED ALWAYS AS (precio_unitario_con_iva * cantidad) STORED,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gastos_orden ON gastos_diversos(orden_id);

-- ── TABLA: imagenes_garantia ────────────────────────────────────────────────
-- URLs de imágenes de evidencia de garantía (Supabase Storage)
CREATE TABLE imagenes_garantia (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orden_id UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('foto1', 'foto2', 'foto3', 'foto4')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_imagenes_orden ON imagenes_garantia(orden_id);

-- ── FUNCIÓN: actualizar_totales ─────────────────────────────────────────────
-- Recalcula automáticamente los totales de una orden
CREATE OR REPLACE FUNCTION actualizar_totales_orden()
RETURNS TRIGGER AS $$
DECLARE
  v_orden_id UUID;
  v_es_garantia BOOLEAN;
  v_total_piezas NUMERIC;
  v_total_gastos NUMERIC;
  v_total_mano_obra NUMERIC;
BEGIN
  -- Determinar el orden_id según la tabla que disparó el trigger
  IF TG_TABLE_NAME = 'ordenes' THEN
    v_orden_id := NEW.id;
  ELSE
    v_orden_id := NEW.orden_id;
  END IF;

  -- Obtener si es garantía
  SELECT es_garantia INTO v_es_garantia FROM ordenes WHERE id = v_orden_id;

  -- Calcular total de piezas (en garantía solo las excluidas)
  IF v_es_garantia THEN
    SELECT COALESCE(SUM(total), 0) INTO v_total_piezas 
    FROM piezas 
    WHERE orden_id = v_orden_id AND excluida_garantia = true;
  ELSE
    SELECT COALESCE(SUM(total), 0) INTO v_total_piezas 
    FROM piezas 
    WHERE orden_id = v_orden_id;
  END IF;

  -- Calcular total de gastos
  SELECT COALESCE(SUM(total), 0) INTO v_total_gastos 
  FROM gastos_diversos 
  WHERE orden_id = v_orden_id;

  -- Obtener mano de obra
  SELECT total_mano_obra INTO v_total_mano_obra 
  FROM ordenes 
  WHERE id = v_orden_id;

  -- Actualizar total de la orden
  UPDATE ordenes 
  SET 
    total_orden = v_total_piezas + v_total_gastos + COALESCE(v_total_mano_obra, 0),
    updated_at = NOW()
  WHERE id = v_orden_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── TRIGGERS ─────────────────────────────────────────────────────────────────
CREATE TRIGGER trigger_actualizar_totales_piezas
AFTER INSERT OR UPDATE OR DELETE ON piezas
FOR EACH ROW EXECUTE FUNCTION actualizar_totales_orden();

CREATE TRIGGER trigger_actualizar_totales_gastos
AFTER INSERT OR UPDATE OR DELETE ON gastos_diversos
FOR EACH ROW EXECUTE FUNCTION actualizar_totales_orden();

CREATE TRIGGER trigger_actualizar_totales_ordenes
AFTER UPDATE OF horas_trabajo, tarifa_hora, total_mano_obra ON ordenes
FOR EACH ROW EXECUTE FUNCTION actualizar_totales_orden();

-- ── RLS (Row Level Security) ────────────────────────────────────────────────
-- Habilitar RLS en todas las tablas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE piezas ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos_diversos ENABLE ROW LEVEL SECURITY;
ALTER TABLE imagenes_garantia ENABLE ROW LEVEL SECURITY;

-- Policies para usuarios
CREATE POLICY "Usuarios pueden ver su propio perfil"
  ON usuarios FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Gerencia puede ver todos los usuarios"
  ON usuarios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND rol = 'gerencia'
    )
  );

-- Policies para órdenes
CREATE POLICY "Todos pueden ver órdenes"
  ON ordenes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Taller puede crear órdenes"
  ON ordenes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND rol = 'taller'
    )
  );

CREATE POLICY "Taller puede actualizar sus órdenes"
  ON ordenes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND rol IN ('taller', 'refacciones')
    )
  );

-- Policies para piezas y gastos
CREATE POLICY "Todos pueden ver piezas"
  ON piezas FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Refacciones puede gestionar piezas"
  ON piezas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND rol = 'refacciones'
    )
  );

CREATE POLICY "Todos pueden ver gastos"
  ON gastos_diversos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Refacciones puede gestionar gastos"
  ON gastos_diversos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND rol = 'refacciones'
    )
  );

-- Policies para imágenes
CREATE POLICY "Todos pueden ver imágenes"
  ON imagenes_garantia FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Taller puede gestionar imágenes"
  ON imagenes_garantia FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND rol IN ('taller', 'refacciones')
    )
  );

-- ── SECUENCIA PARA FOLIOS ───────────────────────────────────────────────────
CREATE SEQUENCE seq_folio START WITH 120690;

-- Función para generar el siguiente folio
CREATE OR REPLACE FUNCTION siguiente_folio()
RETURNS INTEGER AS $$
BEGIN
  RETURN nextval('seq_folio');
END;
$$ LANGUAGE plpgsql;

