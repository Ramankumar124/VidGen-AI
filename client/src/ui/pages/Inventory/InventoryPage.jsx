import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/shared/Sidebar'
import DashboardHeader from '../../components/shared/DashboardHeader'
import api from '../../services/api'

// ── Icons ─────────────────────────────────────────────────────────────────────
const EditIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>)
const PlusIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>)
const CloseIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>)
const SearchIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>)
const PackageIcon = () => (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>)
const ImageIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>)
const SpinnerIcon = () => (<div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />)
const SaveIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>)
const UploadIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>)

// ── Field ─────────────────────────────────────────────────────────────────────
const Field = ({ label, value, onChange, placeholder, type = 'text', required, multiline }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">
      {label}{required && <span className="text-error ml-1">*</span>}
    </label>
    {multiline ? (
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
        className="w-full bg-surface-lowest border border-outline-variant rounded-xl px-4 py-3 text-on-surface text-sm outline-none focus:border-secondary placeholder-outline resize-none transition-colors" />
    ) : (
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-surface-lowest border border-outline-variant rounded-xl px-4 py-3 text-on-surface text-sm outline-none focus:border-secondary placeholder-outline transition-colors" />
    )}
  </div>
)

// ── Edit Modal ─────────────────────────────────────────────────────────────────
const EditModal = ({ product, onClose, onSaved }) => {
  const fileRef = useRef()
  const [form, setForm] = useState({
    product_name: product.product_name,
    brand: product.brand,
    category: product.category,
    price: product.price,
    description: product.description,
  })
  const [newImages, setNewImages] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key) => (v) => setForm(f => ({ ...f, [key]: v }))

  const handleSave = async () => {
    const { product_name, brand, category, price } = form
    if (!product_name || !brand || !category || !price) { setError('Please fill required fields.'); return }
    setSaving(true); setError('')
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([k, v]) => formData.append(k, v))
      newImages.forEach(f => formData.append('images', f))
      const res = await api.put(`/agent/products/${product.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      onSaved(res.data)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-lowest/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg glass-card p-6 flex flex-col gap-5 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-on-surface">Edit Product</h2>
          <button onClick={onClose} className="text-outline hover:text-on-surface transition-colors"><CloseIcon /></button>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-error/5 border border-error/20">
            <span className="w-1.5 h-1.5 rounded-full bg-error flex-shrink-0" />
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Product Name" value={form.product_name} onChange={set('product_name')} placeholder="Product name" required />
          <Field label="Brand" value={form.brand} onChange={set('brand')} placeholder="Brand" required />
          <Field label="Category" value={form.category} onChange={set('category')} placeholder="Category" required />
          <Field label="Price" value={form.price} onChange={set('price')} placeholder="e.g. $99.00" required />
        </div>
        <Field label="Description" value={form.description} onChange={set('description')} placeholder="Product description..." multiline />

        {/* Existing images */}
        {product.product_images?.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-outline">Current Images</p>
            <div className="flex flex-wrap gap-2">
              {product.product_images.map((img, i) => (
                <img key={i} src={`http://localhost:8000/${img}`} alt={`Product ${i + 1}`}
                  className="w-14 h-14 rounded-xl object-cover border border-outline-variant"
                  onError={e => { e.target.style.display = 'none' }} />
              ))}
            </div>
          </div>
        )}

        {/* Add new images */}
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-mono uppercase tracking-wider text-outline">Add More Images</p>
          <div
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-outline-variant/50 cursor-pointer hover:border-purple-500/40 hover:bg-purple-500/5 transition-all"
          >
            <span className="text-outline"><UploadIcon /></span>
            <span className="text-sm text-on-surface-variant">Click to add images</span>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => setNewImages(prev => [...prev, ...Array.from(e.target.files).filter(f => f.type.startsWith('image/'))])} />
          {newImages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {newImages.map((f, i) => (
                <div key={i} className="relative group">
                  <img src={URL.createObjectURL(f)} alt={f.name} className="w-14 h-14 rounded-xl object-cover border border-outline-variant" />
                  <button onClick={() => setNewImages(p => p.filter((_, idx) => idx !== i))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-error text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/15 text-on-surface-variant text-sm font-semibold hover:bg-surface-high transition-all">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-sm font-semibold hover:shadow-glow-purple transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {saving ? <><SpinnerIcon /> Saving…</> : <><SaveIcon /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Product Card ──────────────────────────────────────────────────────────────
const ProductCard = ({ product, onEdit }) => {
  const firstImage = product.product_images?.[0]
  return (
    <div className="glass-card p-5 flex flex-col gap-4 hover:border-white/15 transition-all duration-300 group">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-highest flex items-center justify-center text-outline flex-shrink-0 border border-outline-variant/40">
          {firstImage
            ? <img src={`http://localhost:8000/${firstImage}`} alt={product.product_name} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
            : <ImageIcon />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-on-surface font-semibold text-sm truncate">{product.product_name}</h3>
          <p className="text-on-surface-variant text-xs mt-0.5 truncate">{product.brand}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] font-mono text-outline uppercase bg-surface-high px-2 py-0.5 rounded-md">{product.category}</span>
            <span className="text-xs text-cyan-400 font-semibold">{product.price}</span>
          </div>
        </div>
      </div>
      {product.description && (
        <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">{product.description}</p>
      )}
      {product.product_images?.length > 1 && (
        <div className="flex gap-1.5">
          {product.product_images.slice(1, 4).map((img, i) => (
            <img key={i} src={`http://localhost:8000/${img}`} alt={`img-${i}`}
              className="w-10 h-10 rounded-lg object-cover border border-outline-variant/40"
              onError={e => { e.target.style.display = 'none' }} />
          ))}
          {product.product_images.length > 4 && (
            <div className="w-10 h-10 rounded-lg bg-surface-high border border-outline-variant/40 flex items-center justify-center text-[10px] text-outline">
              +{product.product_images.length - 4}
            </div>
          )}
        </div>
      )}
      <button
        onClick={() => onEdit(product)}
        className="flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-white/10 text-on-surface-variant text-xs font-semibold hover:bg-surface-high hover:text-on-surface hover:border-purple-500/30 transition-all"
      >
        <EditIcon /> Edit Product
      </button>
    </div>
  )
}

// ── Inventory Page ─────────────────────────────────────────────────────────────
const InventoryPage = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingProduct, setEditingProduct] = useState(null)

  useEffect(() => {
    api.get('/agent/products').then(r => setProducts(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleSaved = (updated) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p))
    setEditingProduct(null)
  }

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    return !q || (p.product_name || '').toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q)
  })

  return (
    <div className="min-h-screen flex bg-surface-lowest text-on-surface">
      <Sidebar onNewProject={() => navigate('/analyze')} />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader title="Product Inventory" />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto flex flex-col gap-6 animate-slide-up">

            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-on-surface tracking-tight">Product Inventory</h1>
                <p className="text-on-surface-variant text-sm mt-1">{products.length} product{products.length !== 1 ? 's' : ''} in catalog</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none"><SearchIcon /></span>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2.5 bg-surface-low border border-outline-variant rounded-xl text-on-surface text-sm placeholder-outline outline-none focus:border-secondary transition-colors" />
            </div>

            {/* Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                  <p className="text-on-surface-variant text-sm">Loading products...</p>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface-high flex items-center justify-center text-outline"><PackageIcon /></div>
                <div>
                  <p className="text-on-surface font-semibold">{search ? 'No products match your search' : 'No products yet'}</p>
                  <p className="text-on-surface-variant text-sm mt-1">{search ? 'Try a different search term' : 'Products are added during the analysis flow'}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(p => <ProductCard key={p.id} product={p} onEdit={setEditingProduct} />)}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Edit Modal */}
      {editingProduct && <EditModal product={editingProduct} onClose={() => setEditingProduct(null)} onSaved={handleSaved} />}
    </div>
  )
}

export default InventoryPage
