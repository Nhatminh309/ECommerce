import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import ChatbotWidget from './ChatbotWidget.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { paths } from '../routes/paths.js';

const navClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-ink text-white' : 'text-ink hover:bg-mist'
  }`;

export default function AppLayout() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { cart, clearLocalCart } = useCart();

  const handleLogout = () => {
    logout();
    clearLocalCart();
    navigate(paths.login);
  };

  return (
    <div className="min-h-screen bg-white text-ink">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link to={paths.products} className="text-xl font-semibold tracking-tight">
            Cole Shopping
          </Link>

          <nav className="flex flex-wrap items-center gap-2">
            <NavLink to={paths.products} className={navClass}>
              Products
            </NavLink>
            {isAuthenticated && (
              <>
                {user?.role !== 'ADMIN' && (
                  <>
                    <NavLink to={paths.cart} className={navClass}>
                      Cart {cart?.totalItems ? `(${cart.totalItems})` : ''}
                    </NavLink>
                    <NavLink to={paths.orders} className={navClass}>
                      Orders
                    </NavLink>
                  </>
                )}
                <NavLink to={paths.chat} className={navClass}>
                  Chat AI
                </NavLink>
                <NavLink to={paths.customerChat} className={navClass}>
                  Chat Support
                </NavLink>
                <NavLink to={paths.documents} className={navClass}>
                  Documents
                </NavLink>
                {user?.role === 'ADMIN' && (
                  <>
                    <NavLink to={paths.adminDashboard} className={navClass}>
                      Dashboard
                    </NavLink>
                    <NavLink to={paths.adminProducts} className={navClass}>
                      Admin products
                    </NavLink>
                    <NavLink to={paths.adminOrders} className={navClass}>
                      Admin orders
                    </NavLink>
                    <NavLink to={paths.adminUsers} className={navClass}>
                      Users
                    </NavLink>
                    <NavLink to={paths.adminChat} className={navClass}>
                      Chat
                    </NavLink>
                    <NavLink to={paths.report} className={navClass}>
                      Report
                    </NavLink>
                  </>
                )}
              </>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="hidden text-sm text-slate-600 sm:inline">
                  {user?.username} / {user?.role}
                </span>
                <button className="btn-secondary" type="button" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link className="btn-secondary" to={paths.login}>
                  Login
                </Link>
                <Link className="btn-primary" to={paths.register}>
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>

      <ChatbotWidget />
    </div>
  );
}
