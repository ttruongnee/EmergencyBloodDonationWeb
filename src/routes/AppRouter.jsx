import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import AdminLayout from '../components/layout/AdminLayout'

// Pages
import LoginPage from '../pages/Login/LoginPage'
import DashboardPage from '../pages/Dashboard/DashboardPage'
import UserListPage from '../pages/Users/UserListPage'
import UserDetailPage from '../pages/Users/UserDetailPage'
import PostListPage from '../pages/Posts/PostListPage'
import PostDetailPage from '../pages/Posts/PostDetailPage'
import ReportListPage from '../pages/Reports/ReportListPage'
import ReportDetailPage from '../pages/Reports/ReportDetailPage'
import NotificationListPage from '../pages/Notifications/NotificationListPage'
import SendNotificationPage from '../pages/Notifications/SendNotificationPage'
import HospitalListPage from '../pages/Hospitals/HospitalListPage'
import ProfilePage from '../pages/Profile/ProfilePage'

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected — Admin only */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <AdminLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="users" element={<UserListPage />} />
                    <Route path="users/:id" element={<UserDetailPage />} />
                    <Route path="posts" element={<PostListPage />} />
                    <Route path="posts/:id" element={<PostDetailPage />} />
                    <Route path="reports" element={<ReportListPage />} />
                    <Route path="reports/:id" element={<ReportDetailPage />} />
                    <Route path="notifications" element={<NotificationListPage />} />
                    <Route path="notifications/send" element={<SendNotificationPage />} />
                    <Route path="hospitals" element={<HospitalListPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    )
}