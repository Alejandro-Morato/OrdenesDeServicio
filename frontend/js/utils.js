// ════════════════════════════════════════════════════════════════════════════
// UTILIDADES GENERALES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Formatear dinero
 */
function money(value) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(value || 0);
}

const formatCurrency = money;

/**
 * Formatear fecha
 */
function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString + 'T12:00:00');
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Formatear fecha y hora
 */
function formatDateTime(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Generar UUID simple
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Upload a Cloudinary
 */
async function uploadToCloudinary(file, folder = 'inter-rural/garantias') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData
    }
  );

  const data = await response.json();
  return data.secure_url;
}

/**
 * Upload múltiple a Cloudinary
 */
async function uploadMultipleImages(files, folder) {
  const uploads = Array.from(files).map(file => uploadToCloudinary(file, folder));
  return Promise.all(uploads);
}

/**
 * Mostrar notificación toast
 */
function showToast(message, type = 'info') {
  alert(message);
}

/**
 * Confirmar acción
 */
const nativeConfirm = window.confirm.bind(window);

function appConfirm(message) {
  return nativeConfirm(message);
}

/**
 * Debounce para búsquedas
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
