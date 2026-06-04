const supabase = require('../utils/supabase');

/**
 * Middleware para verificar token JWT de Supabase
 */
async function authenticateUser(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  console.log('🔍 [AUTH] Token recibido:', token ? 'Sí' : 'No');

  if (!token) {
    console.log('❌ [AUTH] No hay token');
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    console.log('🔍 [AUTH] Verificando token con Supabase...');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    console.log('🔍 [AUTH] Respuesta de Supabase:', { 
      user: user ? user.id : null, 
      error: error ? error.message : null 
    });

    if (error || !user) {
      console.log('❌ [AUTH] Token inválido o expirado');
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Obtener datos del usuario (rol)
    console.log('🔍 [AUTH] Buscando usuario en tabla usuarios...');
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single();

    console.log('🔍 [AUTH] Datos de usuario:', userData ? userData.rol : 'No encontrado');

    if (!userData) {
      console.log('❌ [AUTH] Usuario no encontrado en tabla');
      return res.status(403).json({ error: 'Usuario no encontrado' });
    }

    req.user = userData;
    console.log('✅ [AUTH] Usuario autenticado:', userData.nombre || userData.email);
    next();
  } catch (error) {
    console.error('❌ [AUTH] Error inesperado:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Middleware para verificar rol específico
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tienes permisos' });
    }

    next();
  };
}

module.exports = { authenticateUser, requireRole };