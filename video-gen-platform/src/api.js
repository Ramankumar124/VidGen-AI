// Centralized API client for VidGen AI
// Base URL is read from .env — defaults to http://localhost:8000

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

/**
 * Submit a batch of video URLs and stream the results back.
 * The backend streams newline-delimited JSON (NDJSON).
 * 
 * @param {string[]} videoUrls - Array of video URLs
 * @param {function(Object): void} onChunk - Callback fired for each result chunk
 * @returns {Promise<void>} Resolves when the stream is fully consumed
 */
export async function streamVideos(videoUrls, onChunk) {
    const res = await fetch(`${BASE_URL}/process-videos`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(videoUrls),
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(err.detail ?? 'Failed to connect to streaming endpoint')
    }

    // Read the stream
    const reader = res.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })

            // Process complete lines (NDJSON format)
            const lines = buffer.split('\n')

            // Keep the last incomplete line in the buffer
            buffer = lines.pop() ?? ''

            for (const line of lines) {
                if (!line.trim()) continue
                try {
                    const chunk = JSON.parse(line)
                    onChunk(chunk)
                } catch (err) {
                    console.error('Failed to parse NDJSON chunk:', err, line)
                }
            }
        }

        // Process any remaining content in buffer (if no trailing newline)
        if (buffer.trim()) {
            try {
                const chunk = JSON.parse(buffer)
                onChunk(chunk)
            } catch (err) {
                console.error('Failed to parse final NDJSON chunk:', err)
            }
        }
    } finally {
        reader.releaseLock()
    }
}

/**
 * Check server health.
 * @returns {Promise<{ status: string }>}
 */
export async function checkHealth() {
    const res = await fetch(`${BASE_URL}/health`)
    if (!res.ok) throw new Error('Server unavailable')
    return res.json()
}

/**
 * Generate a custom advertisement script based on product details
 * and example scripts from video analysis. Streams results via NDJSON.
 * 
 * @param {Object} payload - The request payload
 * @param {string[]} payload.example_script - Selected example scripts/summaries
 * @param {string} payload.price_range - Product price range
 * @param {string} payload.category - Product category
 * @param {string} payload.product_type - Type of product
 * @param {string} payload.styling_type - Styling preference
 * @param {string} payload.target_age_range - Target age range
 * @param {string} payload.target_gender - Target gender
 * @param {string} payload.target_behavior - Target behavior/interests
 * @param {string} payload.ideal_selling_location - Where to sell
 * @param {string} payload.short_reasoning - Brief reasoning
 * @param {File[]} payload.images - Product images
 * @param {function(Object): void} onChunk - Callback fired for each generated script
 * @returns {Promise<void>} Resolves when the stream is fully consumed
 */
export async function generateOwnScript(payload, onChunk) {
    const formData = new FormData()

    // Add example scripts as multiple form fields with the same key
    // Backend expects List[str] in FastAPI Form()
    if (payload.example_script && Array.isArray(payload.example_script)) {
        payload.example_script.forEach((script) => {
            if (script) {
                formData.append('example_scripts', script)
            }
        })
    }

    // Add other form fields
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

    // Add product images with correct field name 'product_images'
    if (payload.images && Array.isArray(payload.images)) {
        payload.images.forEach((image) => {
            if (image.file) {
                formData.append('product_images', image.file)
            }
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

    // Read the stream (NDJSON format)
    const reader = res.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })

            // Process complete lines (NDJSON format)
            const lines = buffer.split('\n')

            // Keep the last incomplete line in the buffer
            buffer = lines.pop() ?? ''

            for (const line of lines) {
                if (!line.trim()) continue
                try {
                    const chunk = JSON.parse(line)
                    onChunk(chunk)
                } catch (err) {
                    console.error('Failed to parse NDJSON chunk:', err, line)
                }
            }
        }

        // Process any remaining content in buffer (if no trailing newline)
        if (buffer.trim()) {
            try {
                const chunk = JSON.parse(buffer)
                onChunk(chunk)
            } catch (err) {
                console.error('Failed to parse final NDJSON chunk:', err)
            }
        }
    } finally {
        reader.releaseLock()
    }
}
