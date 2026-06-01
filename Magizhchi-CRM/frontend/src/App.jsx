import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './lib/auth.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import CompanyDashboard from './pages/CompanyDashboard.jsx'
import MemberWorkspace from './pages/MemberWorkspace.jsx'

function Splash() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
    </div>
  )
}

function Home() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return user.accountType === 'COMPANY' ? (
    <Navigate to="/company" replace />
  ) : (
    <Navigate to="/member" replace />
  )
}

function Protected({ type, children }) {
  const { user, loading } = useAuth()
  if (loading) return <Splash />
  if (!user) return <Navigate to="/login" replace />
  if (type && user.accountType !== type) return <Home />
  return children
}

export default function App() {
  const { loading } = useAuth()
  if (loading) return <Splash />

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/company/*"
        element={
          <Protected type="COMPANY">
            <CompanyDashboard />
          </Protected>
        }
      />
      <Route
        path="/member/*"
        element={
          <Protected type="MEMBER">
            <MemberWorkspace />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
