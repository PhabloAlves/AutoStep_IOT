import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import Analise from './pages/Analise'
import Bottlenecks from './pages/Bottlenecks'
import History from './pages/History'
import ServiceOrders from './pages/ServiceOrders'
import Login from './pages/Login'
import './index.css'

function AuthGuard({ children }) {
  const token = localStorage.getItem('autostep_token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <AuthGuard>
              <Layout>
                <Routes>
                  <Route path="/"          element={<Overview />}      />
                  <Route path="/analise"   element={<Analise />}       />
                  <Route path="/gargalos"  element={<Bottlenecks />}   />
                  <Route path="/historico" element={<History />}       />
                  <Route path="/ordens"    element={<ServiceOrders />} />
                </Routes>
              </Layout>
            </AuthGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
