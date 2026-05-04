import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import Analise from './pages/Analise'
import Bottlenecks from './pages/Bottlenecks'
import History from './pages/History'
import ServiceOrders from './pages/ServiceOrders'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/"          element={<Overview />}      />
          <Route path="/analise"   element={<Analise />}       />
          <Route path="/gargalos"  element={<Bottlenecks />}   />
          <Route path="/historico" element={<History />}       />
          <Route path="/ordens"    element={<ServiceOrders />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
