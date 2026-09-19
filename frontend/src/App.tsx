import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import { Loading } from './components/Spinner'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import WorkBoardPage from './pages/WorkBoardPage'
import CustomersPage from './pages/CustomersPage'
import ArchivedCustomersPage from './pages/ArchivedCustomersPage'
import CustomerProfilePage from './pages/CustomerProfilePage'
import InvoicesPage from './pages/InvoicesPage'
import InvoiceFormPage from './pages/InvoiceFormPage'
import InvoiceViewPage from './pages/InvoiceViewPage'
import DebtsPage from './pages/DebtsPage'
import SuppliersPage from './pages/SuppliersPage'
import SupplierProfilePage from './pages/SupplierProfilePage'
import SupplierDebtsPage from './pages/SupplierDebtsPage'
import DailyPage from './pages/DailyPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import WorkersPage from './pages/WorkersPage'

export default function App() {
  const { loading } = useAuth()

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loading /></div>
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/board" element={<WorkBoardPage />} />
          <Route path="/daily" element={<DailyPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/archived" element={<ArchivedCustomersPage />} />
          <Route path="/customers/:id" element={<CustomerProfilePage />} />
          {/* Old bookmark / shortcut target */}
          <Route path="/search" element={<Navigate to="/customers" replace />} />

          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/invoices/new" element={<InvoiceFormPage />} />
          <Route path="/invoices/:id" element={<InvoiceViewPage />} />
          <Route path="/invoices/:id/edit" element={<InvoiceFormPage />} />

          <Route path="/debts" element={<DebtsPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/suppliers/:id" element={<SupplierProfilePage />} />
          <Route path="/supplier-debts" element={<SupplierDebtsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/workers" element={<WorkersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
