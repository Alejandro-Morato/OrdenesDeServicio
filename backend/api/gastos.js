const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { authenticateUser, requireRole } = require('../middleware/auth');

router.use(authenticateUser);

/**
 * GET /api/gastos/:ordenId
 * Obtener gastos de una orden
 */
router.get('/:ordenId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('gastos_diversos')
      .select('*')
      .eq('orden_id', req.params.ordenId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});







/**
 * POST /api/gastos
 * Agregar gasto (solo refacciones)
 */
router.post('/', requireRole('refacciones'), async (req, res) => {
  try {
    const {
      orden_id,
      cantidad,
      codigo,
      descripcion,
      referencia,
      precio_unitario_con_iva
    } = req.body;

    const { data, error } = await supabase
      .from('gastos_diversos')
      .insert({
        orden_id,
        cantidad: cantidad || 1,
        codigo,
        descripcion,
        referencia,
        precio_unitario_con_iva
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
 * DELETE /api/gastos/:id
 * Eliminar gasto
 */
router.delete('/:id', requireRole('refacciones'), async (req, res) => {
  try {
    const { error } = await supabase
      .from('gastos_diversos')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Gasto eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Actualizar gasto
// Actualizar gasto
router.patch('/:id', requireRole('refacciones'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('gastos_diversos')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
