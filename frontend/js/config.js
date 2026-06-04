// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DEL FRONTEND
// ════════════════════════════════════════════════════════════════════════════

// URL del backend (cambiar según el entorno)
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api'
  : 'https://backend-wsfr.vercel.app/api'; 

// Supabase 
const SUPABASE_URL = 'https://ehoihmlbviviunsidisy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVob2lobWxidml2aXVuc2lkaXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNDc4MTMsImV4cCI6MjA5NTgyMzgxM30.GXRkrfNgyryUDMR8v-hZJvuq21khuTMY1CGHnI_n8u0';

// Cloudinary 
const CLOUDINARY_CLOUD_NAME = 'dtqn44tkx';
const CLOUDINARY_UPLOAD_PRESET = 'inter_rural_unsigned';

// Export para módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_URL, SUPABASE_URL, SUPABASE_ANON_KEY, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET };
}
