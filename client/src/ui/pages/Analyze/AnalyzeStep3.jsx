import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Sidebar from '../../components/shared/Sidebar'
import DashboardHeader from '../../components/shared/DashboardHeader'
import StepIndicator from '../../components/ui/StepIndicator'
import api from '../../services/api'

// ── Icons ─────────────────────────────────────────────────────────────────────
const UploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
)
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
)
const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
)
const SpinnerIcon = () => (
  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
)

// ── Shared field component ─────────────────────────────────────────────────────
const Field = ({ label, value, onChange, placeholder, type = 'text', required }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">
      {label}{required && <span className="text-error ml-1">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-surface-lowest border border-outline-variant rounded-xl px-4 py-3 text-on-surface text-sm outline-none
        focus:border-secondary placeholder-outline transition-colors duration-200"
    />
  </div>
)

// ── Step 3 ─────────────────────────────────────────────────────────────────────
const AnalyzeStep3 = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const runId = searchParams.get('run_id')

  // Parse the interrupt from URL
  const interruptRaw = searchParams.get('interrupt')
  const interruptData = interruptRaw ? (() => { try { return JSON.parse(decodeURIComponent(interruptRaw)) } catch { return null } })() : null
  const interruptItem = Array.isArray(interruptData) && interruptData.length > 0 ? interruptData[0] : null

  // Determine which sub-step we're in based on interrupt type
  const hasOptions = !!interruptItem?.value?.options              // skip/generate_script, add_new/choose_from_existing
  const wantsNewProduct = interruptItem?.value?.expected_payload?.product_name !== undefined
  const wantsExistingProduct = interruptItem?.value?.expected_payload?.product_id !== undefined

  // State
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef()

  // New product form
  const [newProduct, setNewProduct] = useState({ product_name: '', brand: '', category: '', price: '', description: '' })
  const [productImages, setProductImages] = useState([]) // File objects for preview
  const [uploadedImagePaths, setUploadedImagePaths] = useState([]) // Paths returned from server

  // Fetch products from real API when on existing-product step
  useEffect(() => {
    if (wantsExistingProduct) {
      fetchProducts()
    }
  }, [wantsExistingProduct])

  const fetchProducts = async () => {
    setLoadingProducts(true)
    try {
      const res = await api.get('/agent/products')
      setProducts(res.data)
    } catch {
      setErrorMsg('Failed to load products. Please try again.')
    } finally {
      setLoadingProducts(false)
    }
  }

  // ── Image handling ───────────────────────────────────────────────────────────
  const handleImageFiles = (files) => {
    const imgs = Array.from(files).filter((f) => f.type.startsWith('image/'))
    setProductImages((prev) => [...prev, ...imgs])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    handleImageFiles(e.dataTransfer.files)
  }

  const removeImage = (idx) => {
    setProductImages((prev) => prev.filter((_, i) => i !== idx))
  }

  // ── Upload images before creating new product ────────────────────────────────
  const uploadImages = async () => {
    if (productImages.length === 0) return []
    const formData = new FormData()
    productImages.forEach((f) => formData.append('files', f))
    const res = await api.post('/agent/upload-product-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data // array of saved paths
  }

  // ── Resume agent helper ──────────────────────────────────────────────────────
  const resumeWithDecision = async (decision) => {
    setIsSubmitting(true)
    setErrorMsg('')
    try {
      const res = await api.post('/agent/resume', { run_id: runId, decision })
      const { status, data, interrupt } = res.data

      if (status === 'waiting' && interrupt) {
        // Another interrupt — update URL so state updates
        setSearchParams({
          run_id: runId,
          interrupt: encodeURIComponent(JSON.stringify(interrupt)),
        })
        // Reset local sub-step state
        setSelectedProductId(null)
        setNewProduct({ product_name: '', brand: '', category: '', price: '', description: '' })
        setProductImages([])
        setUploadedImagePaths([])
      } else if (status === 'completed' || status === 'done') {
        const hasScript = !!(data?.generateted_script || data?.generated_script)
        if (hasScript) {
          // Script was generated → go to Script Editor (Step 4)
          navigate(`/analyze/script?run_id=${runId}&data=${encodeURIComponent(JSON.stringify(data))}`)
        } else {
          // Script was skipped → go to Save Project page
          navigate(`/analyze/save?run_id=${runId}&data=${encodeURIComponent(JSON.stringify(data))}`)
        }
      } else {
        setErrorMsg('Unexpected response from server.')
      }
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err?.response?.data?.detail || 'Failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }


  // ── Submit handlers ──────────────────────────────────────────────────────────
  const handleOptionClick = (opt) => resumeWithDecision(opt)

  const handleSubmitExisting = () => {
    if (!selectedProductId) {
      setErrorMsg('Please select a product.')
      return
    }
    const product = products.find((p) => p.id === selectedProductId)
    resumeWithDecision({
      product_id: String(product.id),
      product_name: product.product_name,
      brand: product.brand,
      category: product.category,
      price: product.price,
      description: product.description,
      productImages: product.product_images || [],
    })
  }

  const handleSubmitNew = async () => {
    const { product_name, brand, category, price } = newProduct
    if (!product_name || !brand || !category || !price) {
      setErrorMsg('Please fill in all required fields.')
      return
    }
    setIsSubmitting(true)
    setErrorMsg('')
    try {
      // 1. Create the product in DB via real API
      const formData = new FormData()
      Object.entries(newProduct).forEach(([k, v]) => formData.append(k, v))
      productImages.forEach((f) => formData.append('images', f))
      const productRes = await api.post('/agent/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const savedProduct = productRes.data

      // 2. Resume agent with the saved product data
      await resumeWithDecision({
        product_id: String(savedProduct.id),
        product_name: savedProduct.product_name,
        brand: savedProduct.brand,
        category: savedProduct.category,
        price: savedProduct.price,
        description: savedProduct.description,
        productImages: savedProduct.product_images || [],
      })
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err?.response?.data?.detail || 'Failed to save product.')
      setIsSubmitting(false)
    }
  }

  // ── Render helpers ───────────────────────────────────────────────────────────
  const renderOptions = () => (
    <div className="glass-card flex flex-col items-center p-10 gap-6 max-w-lg mx-auto w-full">
      <div className="text-center flex flex-col gap-2">
        <div className="w-14 h-14 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center mx-auto">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-on-surface">Action Required</h2>
        <p className="text-on-surface-variant text-sm">{interruptItem.value.message}</p>
      </div>
      <div className="flex gap-3 flex-wrap justify-center">
        {interruptItem.value.options?.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleOptionClick(opt)}
            disabled={isSubmitting}
            className={`py-3 px-8 rounded-xl font-bold text-sm transition-all duration-200 capitalize
              ${opt === 'generate_script' || opt === 'choose_from_existing'
                ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:shadow-glow-purple'
                : 'bg-surface-high border border-white/15 text-on-surface hover:bg-surface-highest'
              } disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2`}
          >
            {isSubmitting ? <SpinnerIcon /> : null}
            {opt.replace(/_/g, ' ')}
          </button>
        ))}
      </div>
    </div>
  )

  const renderExistingProducts = () => (
    <div className="glass-card flex flex-col w-full">
      <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-on-surface">Choose from Catalog</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">Select the product you want to feature in your video script.</p>
        </div>
        <button
          onClick={fetchProducts}
          disabled={loadingProducts}
          className="text-xs text-outline hover:text-on-surface transition-colors flex items-center gap-1.5"
        >
          {loadingProducts ? <SpinnerIcon /> : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          )}
          Refresh
        </button>
      </div>

      <div className="p-4 flex flex-col gap-2 max-h-96 overflow-y-auto">
        {loadingProducts ? (
          <div className="flex items-center justify-center py-10 gap-3 text-on-surface-variant">
            <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-10 text-on-surface-variant text-sm">
            <p>No products found. Add some products first.</p>
          </div>
        ) : (
          products.map((p) => {
            const isSelected = selectedProductId === p.id
            const firstImage = p.product_images?.[0]
            return (
              <button
                key={p.id}
                onClick={() => setSelectedProductId(p.id)}
                className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 w-full
                  ${isSelected
                    ? 'bg-purple-500/10 border-purple-500/40'
                    : 'bg-surface-high/50 border-white/8 hover:border-purple-500/20 hover:bg-purple-500/5'
                  }`}
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-highest flex-shrink-0 flex items-center justify-center text-outline">
                  {firstImage ? (
                    <img src={`http://localhost:8000/${firstImage}`} alt={p.product_name} className="w-full h-full object-cover" />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  )}
                </div>
                {/* Info */}
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                    {p.product_name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-outline uppercase">{p.category}</span>
                    <span className="text-[10px] text-outline">·</span>
                    <span className="text-xs text-on-surface-variant">{p.brand}</span>
                  </div>
                  <span className="text-xs text-cyan-400 font-medium">{p.price}</span>
                </div>
                {/* Check */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                  ${isSelected ? 'bg-purple-500 border-purple-500 text-white' : 'border-outline-variant'}`}>
                  {isSelected && <CheckIcon />}
                </div>
              </button>
            )
          })
        )}
      </div>

      <div className="px-4 pb-4 pt-2 border-t border-white/8 mt-2 flex justify-end">
        <button
          onClick={handleSubmitExisting}
          disabled={isSubmitting || !selectedProductId}
          className="flex items-center gap-2 py-2.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-sm
            hover:shadow-glow-purple transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <SpinnerIcon /> : <ArrowRightIcon />}
          Generate Script
        </button>
      </div>
    </div>
  )

  const renderNewProductForm = () => (
    <div className="glass-card flex flex-col w-full max-w-2xl mx-auto">
      <div className="px-6 py-4 border-b border-white/8">
        <h2 className="text-base font-bold text-on-surface">Add New Product</h2>
        <p className="text-xs text-on-surface-variant mt-0.5">Fill in your product details. We'll save it to your catalog for future use.</p>
      </div>

      <div className="p-6 flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Product Name" value={newProduct.product_name} onChange={(v) => setNewProduct((p) => ({ ...p, product_name: v }))} placeholder="e.g. Aether Hoodie Pro" required />
          <Field label="Brand" value={newProduct.brand} onChange={(v) => setNewProduct((p) => ({ ...p, brand: v }))} placeholder="e.g. Nike" required />
          <Field label="Category" value={newProduct.category} onChange={(v) => setNewProduct((p) => ({ ...p, category: v }))} placeholder="e.g. Apparel" required />
          <Field label="Price" value={newProduct.price} onChange={(v) => setNewProduct((p) => ({ ...p, price: v }))} placeholder="e.g. $129.00" required />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">Description</label>
          <textarea
            value={newProduct.description}
            onChange={(e) => setNewProduct((p) => ({ ...p, description: e.target.value }))}
            placeholder="A brief product description for the AI to use when generating the script..."
            rows={3}
            className="w-full bg-surface-lowest border border-outline-variant rounded-xl px-4 py-3 text-on-surface text-sm outline-none
              focus:border-secondary placeholder-outline resize-none transition-colors duration-200 leading-relaxed"
          />
        </div>

        {/* Image upload */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">Product Images</label>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200
              ${isDragging ? 'border-purple-500/60 bg-purple-500/10' : 'border-outline-variant/50 hover:border-purple-500/40 hover:bg-purple-500/5'}`}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDragging ? 'bg-purple-500/20 text-purple-400' : 'bg-surface-high text-outline'}`}>
              <UploadIcon />
            </div>
            <p className="text-sm text-on-surface-variant">Drag & drop or <span className="text-purple-400 font-semibold">browse</span></p>
            <p className="text-[10px] text-outline">JPG, PNG, WEBP · Max 10MB each</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageFiles(e.target.files)} />

          {/* Image preview chips */}
          {productImages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {productImages.map((f, i) => (
                <div key={i} className="relative group">
                  <img
                    src={URL.createObjectURL(f)}
                    alt={f.name}
                    className="w-16 h-16 rounded-xl object-cover border border-outline-variant"
                  />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-error text-white text-[10px] flex items-center justify-center
                      opacity-0 group-hover:opacity-100 transition-opacity"
                  >✕</button>
                </div>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 rounded-xl border-2 border-dashed border-outline-variant/50 flex items-center justify-center text-outline hover:border-purple-500/40 hover:text-purple-400 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-6 flex justify-between items-center">
        <p className="text-xs text-outline">This product will be saved to your catalog.</p>
        <button
          onClick={handleSubmitNew}
          disabled={isSubmitting}
          className="flex items-center gap-2 py-2.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-sm
            hover:shadow-glow-purple transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <><SpinnerIcon /> Saving & Generating...</> : <>Save & Generate Script <ArrowRightIcon /></>}
        </button>
      </div>
    </div>
  )

  // ── Main render ──────────────────────────────────────────────────────────────
  const pageTitle = wantsNewProduct ? 'Add New Product' : wantsExistingProduct ? 'Choose Product' : 'Product Selection'

  return (
    <div className="min-h-screen flex bg-surface-lowest text-on-surface">
      <Sidebar onNewProject={() => navigate('/analyze')} />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader title={pageTitle} />

        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="w-full max-w-3xl mx-auto flex flex-col gap-8 animate-slide-up">
            <StepIndicator current={3} />

            {/* Header */}
            <div className="flex flex-col gap-1">
              <span className="label-mono text-purple-400 text-[10px]">Step 3 of 4</span>
              <h1 className="text-2xl font-bold text-on-surface tracking-tight">{pageTitle}</h1>
              <p className="text-on-surface-variant text-sm">
                {wantsNewProduct
                  ? 'Provide details for a new product — we\'ll save it to your catalog.'
                  : wantsExistingProduct
                  ? 'Pick one of your saved products to feature in the generated script.'
                  : 'Choose how you want to proceed with your video script.'}
              </p>
            </div>

            {/* Error banner */}
            {errorMsg && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-error/5 border border-error/20">
                <span className="w-1.5 h-1.5 rounded-full bg-error mt-1.5 flex-shrink-0" />
                <p className="text-sm text-error">{errorMsg}</p>
              </div>
            )}

            {/* Dynamic content */}
            {hasOptions && renderOptions()}
            {wantsExistingProduct && renderExistingProducts()}
            {wantsNewProduct && renderNewProductForm()}

            {/* Back button — only show on option screens */}
            {hasOptions && (
              <div className="flex justify-start">
                <button
                  onClick={() => navigate('/analyze')}
                  className="flex items-center gap-2 py-2 px-4 rounded-xl border border-white/10 text-on-surface-variant text-sm hover:bg-surface-high transition-all"
                >
                  <ArrowLeftIcon />
                  Start over
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AnalyzeStep3
