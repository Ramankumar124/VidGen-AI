import { useSelector } from 'react-redux'

const useAuth = () => {
  const { user, loader } = useSelector((state) => state.auth)
  return { user, loading: loader, isAuthenticated: !!user }
}

export default useAuth
