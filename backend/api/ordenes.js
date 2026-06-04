const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { authenticateUser, requireRole } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateUser);

/**
 * GET /api/ordenes
 * Obtener todas las órdenes (filtradas por usuario si es taller)
 */
router.get('/', async (req, res) => {
  try {
    const { scope } = req.query;

    let query = supabase
      .from('ordenes')
      .select(`
        *,
        piezas(count),
        gastos_diversos(count)
      `)
      .order('folio', { ascending: false });

    if (scope === 'garantias') {
      query = query.eq('es_garantia', true);
    } else if (req.user.rol === 'taller') {
      query = query.eq('creado_por', req.user.id);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ordenes/:id
 * Obtener una orden específica con todas sus relaciones
 */
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ordenes')
      .select(`
        *,
        piezas(*),
        gastos_diversos(*),
        imagenes_garantia(*)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Orden no encontrada' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ordenes
 * Crear nueva orden (solo taller)
 */
// POST /api/ordenes - Crear nueva orden (solo taller)
router.post('/', requireRole('taller'), async (req, res) => {
  try {
    const {
      cliente_nombre,
      equipo_modelo,
      equipo_serie,
      fecha_entrada,
      tecnico_nombre,
      falla_reportada,
      es_garantia
    } = req.body;

    const esGarantiaNormalizada =
      es_garantia === true ||
      es_garantia === 'true' ||
      es_garantia === 1 ||
      es_garantia === '1';

    const { data: lastOrder } = await supabase
      .from('ordenes')
      .select('folio')
      .order('folio', { ascending: false })
      .limit(1)
      .single();

    const nextFolio = (lastOrder?.folio || 1000) + 1;

    const { data, error } = await supabase
      .from('ordenes')
      .insert({
        folio: nextFolio,
        cliente_nombre,
        equipo_descripcion: equipo_modelo,
        equipo_serial: equipo_serie,
        fecha_entrada,
        tecnico_id: req.user.id,
        tecnico_nombre: tecnico_nombre || req.user.nombre,
        falla_reportada,
        es_garantia: esGarantiaNormalizada,
        creado_por: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/ordenes/:id
 * Actualizar orden (fecha de término, cerrar taller)
 */
router.patch('/:id', async (req, res) => {
  try {
    const {
      fecha_termino,
      cerrada_taller,
      cerrada_refacciones,          
      fecha_cierre_refacciones,     
      horas_trabajo,
      tarifa_hora
    } = req.body;

    const updateData = {};
    if (fecha_termino !== undefined)            updateData.fecha_termino = fecha_termino;
    if (cerrada_taller !== undefined)           updateData.cerrada_taller = cerrada_taller;
    if (cerrada_refacciones !== undefined)      updateData.cerrada_refacciones = cerrada_refacciones;  // ← AGREGAR
    if (fecha_cierre_refacciones !== undefined) updateData.fecha_cierre_refacciones = fecha_cierre_refacciones;  // ← AGREGAR
    if (horas_trabajo !== undefined)            updateData.horas_trabajo = horas_trabajo;
    if (tarifa_hora !== undefined)              updateData.tarifa_hora = tarifa_hora;
    if (horas_trabajo && tarifa_hora) {
      updateData.total_mano_obra = horas_trabajo * tarifa_hora;
    }

    const { data, error } = await supabase
      .from('ordenes')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/ordenes/:id
 * Eliminar orden (solo gerencia)
 */
router.delete('/:id', requireRole('gerencia'), async (req, res) => {
  try {
    const { error } = await supabase
      .from('ordenes')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Orden eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
