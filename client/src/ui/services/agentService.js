import api from './api'

const agentService = {
  /** Start analysis agent — POST /agent/run */
  run: (url) => api.post('/agent/run', url, { headers: { 'Content-Type': 'application/json' } }),

  /** Resume agent after interrupt — POST /agent/resume */
  resume: (runId, decision) => api.post('/agent/resume', { run_id: runId, decision }),

  /** Upload images (utility) — POST /agent/upload-product-images */
  uploadImages: (files) => {
    const formData = new FormData()
    files.forEach((f) => formData.append('files', f))
    return api.post('/agent/upload-product-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /** List all saved products — GET /agent/products */
  listProducts: () => api.get('/agent/products'),

  /** Create a new product with optional images — POST /agent/products */
  createProduct: (productData, imageFiles = []) => {
    const formData = new FormData()
    Object.entries(productData).forEach(([k, v]) => formData.append(k, v))
    imageFiles.forEach((f) => formData.append('images', f))
    return api.post('/agent/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export default agentService
