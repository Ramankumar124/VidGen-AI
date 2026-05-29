import api from './api'

const authService = {
  /**
   * Login user
   * POST /auth/login
   */
  login: (email, password) => {
    return api.post('/auth/login', { email, password })
  },

  /**
   * Register new user
   * POST /auth/register
   */
  register: (name, email, password) => {
    return api.post('/auth/register', { name, email, password })
  },
}

export default authService
