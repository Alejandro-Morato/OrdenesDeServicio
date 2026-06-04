const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { authenticateUser, requireRole } = require('../middleware/auth');

router.use(authenticateUser);

/**
 * GET /api/piezas/:ordenId
 * Obtener piezas de una orden
 */
router.get('/:ordenId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('piezas')
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
 * POST /api/piezas
 * Agregar pieza a una orden (solo refacciones)
 */
router.post('/', requireRole('refacciones'), async (req, res) => {
  try {
    const {
      orden_id,
      cantidad,
      codigo,
      descripcion,
      numero_serie,
      precio_unitario_con_iva,
      excluida_garantia
    } = req.body;

    const { data, error } = await supabase
      .from('piezas')
      .insert({
        orden_id,
        cantidad: cantidad || 1,
        codigo,
        descripcion,
        numero_serie,
        precio_unitario_con_iva,
        excluida_garantia: excluida_garantia || false
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
 * PATCH /api/piezas/:id
 * Actualizar pieza
 */
router.patch('/:id', requireRole('refacciones'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('piezas')
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

/**
 * DELETE /api/piezas/:id
 * Eliminar pieza
 */
router.delete('/:id', requireRole('refacciones'), async (req, res) => {
  try {
    const { error } = await supabase
      .from('piezas')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Pieza eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
