// Token key in localStorage
const TOKEN_KEY = 'token'

export const saveToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY)
}

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY)
}

export const isTokenValid = () => {
  const token = getToken()
  if (!token) return false
  try {
    // Decode JWT payload (no verification — server handles that)
    const payload = JSON.parse(atob(token.split('.')[1]))
    const now = Math.floor(Date.now() / 1000)
    return payload.exp > now
  } catch {
    return false
  }
}
