const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { authenticateUser, requireRole } = require('../middleware/auth');

router.use(authenticateUser);
router.use(requireRole('gerencia')); // Solo gerencia accede a reportes

/**
 * GET /api/reportes/mano-obra
 * Reporte de mano de obra con filtros
 * Query params: mes, anio, tecnico_id
 */
router.get('/mano-obra', async (req, res) => {
  try {
    const { mes, anio, tecnico_id } = req.query;

    let query = supabase
      .from('ordenes')
      .select('*')
      .gt('horas_trabajo', 0);

    // Filtrar por mes/año si se proporciona
    if (mes && anio) {
  const startDate = `${anio}-${String(mes).padStart(2, '0')}-01`;
  const endDate = new Date(anio, mes, 0).toISOString().slice(0, 10);
  // Filtrar por fecha de término (cierre)
  query = query
    .gte('fecha_termino', startDate)
    .lte('fecha_termino', endDate);
}

    // Filtrar por técnico
    if (tecnico_id) {
      query = query.eq('tecnico_id', tecnico_id);
    }

    const { data, error } = await query.order('fecha_entrada', { ascending: false });

    if (error) throw error;

    // Calcular estadísticas
    const stats = {
      total_ordenes: data.length,
      total_horas: data.reduce((sum, o) => sum + (parseFloat(o.horas_trabajo) || 0), 0),
      total_monto: data.reduce((sum, o) => sum + (parseFloat(o.total_mano_obra) || 0), 0),
      promedio_horas: 0,
      promedio_monto: 0
    };

    if (data.length > 0) {
      stats.promedio_horas = stats.total_horas / data.length;
      stats.promedio_monto = stats.total_monto / data.length;
    }

    // Agrupar por técnico
    const porTecnico = {};
    data.forEach(orden => {
      const tecnico = orden.tecnico_nombre || 'Sin asignar';
      if (!porTecnico[tecnico]) {
        porTecnico[tecnico] = {
          tecnico,
          ordenes: 0,
          horas: 0,
          monto: 0
        };
      }
      porTecnico[tecnico].ordenes++;
      porTecnico[tecnico].horas += parseFloat(orden.horas_trabajo) || 0;
      porTecnico[tecnico].monto += parseFloat(orden.total_mano_obra) || 0;
    });

    const tecnicos = Object.values(porTecnico);

    res.json({
      stats,
      tecnicos,
      ordenes: data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/reportes/general
 * Estadísticas generales del sistema
 */
router.get('/general', async (req, res) => {
  try {
    // Total de órdenes
    const { count: totalOrdenes } = await supabase
      .from('ordenes')
      .select('*', { count: 'exact', head: true });

    // Órdenes abiertas
    const { count: ordenesAbiertas } = await supabase
      .from('ordenes')
      .select('*', { count: 'exact', head: true })
      .eq('cerrada_taller', false)
      .eq('cerrada_refacciones', false);

    // Órdenes cerradas
    const { count: ordenesCerradas } = await supabase
      .from('ordenes')
      .select('*', { count: 'exact', head: true })
      .eq('cerrada_taller', true)
      .eq('cerrada_refacciones', true);

    // Total facturado
    const { data: ordenes } = await supabase
      .from('ordenes')
      .select('total_orden');

    const totalFacturado = ordenes?.reduce((sum, o) => sum + (parseFloat(o.total_orden) || 0), 0) || 0;

    res.json({
      totalOrdenes,
      ordenesAbiertas,
      ordenesCerradas,
      ordenesEnProceso: totalOrdenes - ordenesAbiertas - ordenesCerradas,
      totalFacturado
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
