import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function ProtectedRoute({ children }) {
    const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
    const role = useAuthStore((s) => s.role)

    if (!isLoggedIn) return <Navigate to="/login" replace />
    if (role !== 'admin') {
        // Nếu login nhưng không phải admin → logout + về login
        useAuthStore.getState().logout()
        return <Navigate to="/login" replace />
    }

    return children
}