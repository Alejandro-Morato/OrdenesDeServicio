// ════════════════════════════════════════════════════════════════════════════
// AUTENTICACIÓN CON SUPABASE
// ════════════════════════════════════════════════════════════════════════════

let supabaseClientInstance = null;

function getSupabaseClient() {
  if (supabaseClientInstance) return supabaseClientInstance;

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    throw new Error('Supabase no está cargado correctamente en esta página');
  }

  supabaseClientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabaseClientInstance;
}

/**
 * Login con email y contraseña
 */
async function login(email, password) {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    sessionStorage.setItem('supabase_token', data.session.access_token);
    sessionStorage.setItem('user_id', data.user.id);
    sessionStorage.setItem('user_email', data.user.email);

    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('rol, nombre')
      .eq('id', data.user.id)
      .single();

    if (userError || !userData) {
      throw new Error('Usuario no encontrado en el sistema');
    }

    sessionStorage.setItem('user_rol', userData.rol || '');
    sessionStorage.setItem('user_nombre', userData.nombre || '');

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        rol: userData.rol,
        nombre: userData.nombre
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Logout
 */
async function logout() {
  try {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.warn('No se pudo cerrar sesión en Supabase:', error);
  } finally {
    sessionStorage.removeItem('supabase_token');
    sessionStorage.removeItem('user_id');
    sessionStorage.removeItem('user_email');
    sessionStorage.removeItem('user_rol');
    sessionStorage.removeItem('user_nombre');
    window.location.href = 'index.html';
  }
}

/**
 * Verificar sesión activa
 */
async function checkSession() {
  try {
    const supabase = getSupabaseClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      return null;
    }

    let rol = sessionStorage.getItem('user_rol');
    let nombre = sessionStorage.getItem('user_nombre');

    if (!rol || !nombre) {
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('rol, nombre')
        .eq('id', session.user.id)
        .single();

      if (!userError && userData) {
        rol = userData.rol || '';
        nombre = userData.nombre || '';

        sessionStorage.setItem('user_rol', rol);
        sessionStorage.setItem('user_nombre', nombre);
        sessionStorage.setItem('user_id', session.user.id);
        sessionStorage.setItem('user_email', session.user.email || '');
        sessionStorage.setItem('supabase_token', session.access_token || '');
      }
    }

    return {
      user: session.user,
      rol,
      nombre
    };
  } catch (error) {
    console.error('Error verificando sesión:', error);
    return null;
  }
}

/**
 * Proteger páginas (requiere autenticación)
 */
async function requireAuth(allowedRoles = []) {
  const session = await checkSession();

  if (!session) {
    window.location.href = 'index.html';
    return false;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(session.rol)) {
    alert('No tienes permisos para acceder a esta página');
    window.location.href = 'index.html';
    return false;
  }

  return true;
}

/**
 * Obtener usuario actual
 */
function getCurrentUser() {
  return {
    id: sessionStorage.getItem('user_id'),
    email: sessionStorage.getItem('user_email'),
    rol: sessionStorage.getItem('user_rol'),
    nombre: sessionStorage.getItem('user_nombre')
  };
}