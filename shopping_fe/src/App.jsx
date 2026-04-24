import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminChatPage from './pages/AdminChatPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import AdminOrderPage from './pages/AdminOrderPage.jsx';
import AdminProductPage from './pages/AdminProductPage.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';
import CartPage from './pages/CartPage.jsx';
import ChatbotPage from './pages/ChatbotPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import CustomerChatPage from './pages/CustomerChatPage.jsx';
import DocumentQAPage from './pages/DocumentQAPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import PaymentResultPage from './pages/PaymentResultPage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ReportPage from './pages/ReportPage.jsx';
import { paths } from './routes/paths.js';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to={paths.products} replace />} />
        <Route path={paths.login} element={<LoginPage />} />
        <Route path={paths.register} element={<RegisterPage />} />
        <Route path={paths.products} element={<ProductsPage />} />
        <Route path={paths.productDetail()} element={<ProductDetailPage />} />
        <Route
          path={paths.cart}
          element={
            <ProtectedRoute requiredRole="CUSTOMER">
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={paths.checkout}
          element={
            <ProtectedRoute requiredRole="CUSTOMER">
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={paths.orders}
          element={
            <ProtectedRoute requiredRole="CUSTOMER">
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={paths.adminProducts}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminProductPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={paths.adminOrders}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminOrderPage />
            </ProtectedRoute>
          }
        />
        <Route path={paths.paymentResult} element={<PaymentResultPage />} />
        <Route
          path={paths.chat}
          element={
            <ProtectedRoute>
              <ChatbotPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={paths.documents}
          element={
            <ProtectedRoute>
              <DocumentQAPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={paths.report}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <ReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={paths.adminDashboard}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={paths.adminUsers}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={paths.adminChat}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={paths.customerChat}
          element={
            <ProtectedRoute>
              <CustomerChatPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={paths.products} replace />} />
      </Route>
    </Routes>
  );
}
