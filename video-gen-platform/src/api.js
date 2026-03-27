// Centralized API client for VidGen AI
// Base URL is read from .env — defaults to http://localhost:8000

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

/**
 * Submit a batch of video URLs and stream the results back.
 */
export async function streamVideos(videoUrls, onChunk) {
    const res = await fetch(`${BASE_URL}/process-videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(videoUrls),
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(err.detail ?? 'Failed to connect to streaming endpoint')
    }
    await _readNDJSON(res, onChunk)
}

/**
 * Check server health.
 */
export async function checkHealth() {
    const res = await fetch(`${BASE_URL}/health`)
    if (!res.ok) throw new Error('Server unavailable')
    return res.json()
}

/**
 * Generate a custom advertisement script via NDJSON stream.
 */
export async function generateOwnScript(payload, onChunk) {
    const formData = new FormData()

    if (payload.example_script && Array.isArray(payload.example_script)) {
        payload.example_script.forEach((script) => {
            if (script) formData.append('example_scripts', script)
        })
    }

    formData.append('brand_name', payload.brand_name || '')
    formData.append('product_name', payload.product_name || '')
    formData.append('price_range', payload.price_range || '')
    formData.append('category', payload.category || '')
    formData.append('product_type', payload.product_type || '')
    formData.append('styling_type', payload.styling_type || '')
    formData.append('target_age_range', payload.target_age_range || '')
    formData.append('target_gender', payload.target_gender || '')
    formData.append('target_behavior', payload.target_behavior || '')
    formData.append('ideal_selling_location', payload.ideal_selling_location || '')
    formData.append('short_reasoning', payload.short_reasoning || '')

    if (payload.images && Array.isArray(payload.images)) {
        payload.images.forEach((image) => {
            if (image.file) formData.append('product_images', image.file)
        })
    }

    const res = await fetch(`${BASE_URL}/generate-our-script`, {
        method: 'POST',
        body: formData,
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(err.detail ?? 'Failed to generate custom script')
    }
    await _readNDJSON(res, onChunk)
}

/**
 * Trigger the full video generation pipeline.
 * Sends the script JSON + optional product/model images to /generate-video,
 * waits for the MP4 response, and triggers a browser download.
 *
 * @param {Object}   scriptData     - The GeneratedScript object
 * @param {File[]}   productImages  - Product reference images (optional)
 * @param {File[]}   modelImages    - Model reference photos (optional)
 * @param {function} onStatus       - Called with progress strings
 */
export async function generateVideo(
    scriptData,
    productImages = [],
    modelImages = [],
    onStatus = () => { },
    options = {},
) {
    onStatus('Uploading script and images…')

    const formData = new FormData()
    formData.append('script_json', JSON.stringify(scriptData))

    productImages.forEach((img) => formData.append('product_images', img))
    modelImages.forEach((img) => formData.append('model_images', img))

    onStatus('Running pipeline — this can take several minutes…')

    const res = await fetch(`${BASE_URL}/generate-video`, {
        method: 'POST',
        body: formData,
        signal: options.signal,
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(err.detail ?? 'Video generation failed')
    }

    // Download the returned MP4
    onStatus('Downloading final video…')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'advertisement_video.mp4'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    onStatus('Done!')
}

// ─── Internal helper ──────────────────────────────────────────────────────────
async function _readNDJSON(res, onChunk) {
    const reader = res.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''
            for (const line of lines) {
                if (!line.trim()) continue
                try { onChunk(JSON.parse(line)) }
                catch (e) { console.error('NDJSON parse error:', e, line) }
            }
        }
        if (buffer.trim()) {
            try { onChunk(JSON.parse(buffer)) }
            catch (e) { console.error('NDJSON final parse error:', e) }
        }
    } finally {
        reader.releaseLock()
    }
}
