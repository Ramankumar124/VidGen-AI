import { useEffect } from 'react'

export default function Toast({ message, type, visible }) {
    if (!message) return null
    return (
        <div
            id="toast"
            className={`toast${visible ? ' show' : ''} ${type || ''}`}
            role="alert"
            aria-live="polite"
        >
            {message}
        </div>
    )
}
