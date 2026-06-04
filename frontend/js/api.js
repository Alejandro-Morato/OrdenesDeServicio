// ════════════════════════════════════════════════════════════════════════════
// API CLIENT - Comunicación con el backend
// ════════════════════════════════════════════════════════════════════════════

class ApiClient {
  constructor() {
    this.baseURL = API_URL;
  }

  /**
   * Obtener el token de autenticación
   */
  getToken() {
    const token = sessionStorage.getItem('supabase_token'); // ✅ CON guion bajo
    if (!token) {
      console.warn('No hay token de autenticación');
    }
    return token;
  }

  /**
   * Petición genérica
   */
  async request(endpoint, options = {}) {
    const token = this.getToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ── ÓRDENES ────────────────────────────────────────────────────────────

  async getOrdenes(scope = '') {
  const query = scope ? `?scope=${encodeURIComponent(scope)}` : '';
  return this.request(`/ordenes${query}`);
  }

  async getOrden(id) {
    return this.request(`/ordenes/${id}`);
  }

  async createOrden(data) {
    return this.request('/ordenes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateOrden(id, data) {
    return this.request(`/ordenes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async deleteOrden(id) {
    return this.request(`/ordenes/${id}`, {
      method: 'DELETE'
    });
  }

  // ── PIEZAS ─────────────────────────────────────────────────────────────

  async getPiezas(ordenId) {
    return this.request(`/piezas/${ordenId}`);
  }

  async createPieza(data) {
    return this.request('/piezas', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updatePieza(id, data) {
    return this.request(`/piezas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async deletePieza(id) {
    return this.request(`/piezas/${id}`, {
      method: 'DELETE'
    });
  }

  // ── GASTOS ─────────────────────────────────────────────────────────────

  async getGastos(ordenId) {
    return this.request(`/gastos/${ordenId}`);
  }

  async createGasto(data) {
    return this.request('/gastos', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async deleteGasto(id) {
    return this.request(`/gastos/${id}`, {
      method: 'DELETE'
    });
  }

  async updateGasto(id, data) {
  return this.request(`/gastos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

  // ── REPORTES ───────────────────────────────────────────────────────────

  async getReporteManoObra(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/reportes/mano-obra${query ? '?' + query : ''}`);
  }

  async getReporteGeneral() {
    return this.request('/reportes/general');
  }
}




// Instancia global
const api = new ApiClient();
