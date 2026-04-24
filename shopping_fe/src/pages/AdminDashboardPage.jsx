import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '../services/api';
import { adminService } from '../services/adminService';
import { formatCurrency, formatDate } from '../utils/format';

const STATUS_ORDER = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

function StatCard({ label, value, icon, colorClasses }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6">
      <div className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl ${colorClasses}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-0.5 text-2xl font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    adminService
      .getDashboard()
      .then((res) => setData(res?.data ?? res))
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
        <span className="text-slate-500">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
        {error}
      </div>
    );
  }

  const statusCountMap = data?.orders_by_status ?? {};
  const recentOrders = data?.recent_orders ?? [];

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-slate-500">Overview of your store performance.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(data?.total_revenue)}
          icon="💰"
          colorClasses="bg-green-100"
        />
        <StatCard
          label="Total Orders"
          value={data?.total_orders ?? 0}
          icon="📦"
          colorClasses="bg-blue-100"
        />
        <StatCard
          label="Total Users"
          value={data?.total_users ?? 0}
          icon="👥"
          colorClasses="bg-purple-100"
        />
        <StatCard
          label="Total Products"
          value={data?.total_products ?? 0}
          icon="🛍️"
          colorClasses="bg-orange-100"
        />
      </div>

      {/* Orders by status */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-base font-medium text-slate-700">Orders by Status</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {STATUS_ORDER.map((status) => {
            const count = statusCountMap[status] ?? 0;
            const colorMap = {
              PENDING: 'bg-yellow-50 border-yellow-200 text-yellow-700',
              CONFIRMED: 'bg-blue-50 border-blue-200 text-blue-700',
              SHIPPED: 'bg-indigo-50 border-indigo-200 text-indigo-700',
              DELIVERED: 'bg-green-50 border-green-200 text-green-700',
            };
            return (
              <div
                key={status}
                className={`rounded-lg border px-4 py-3 text-center ${colorMap[status] ?? 'bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                <p className="text-2xl font-bold">{count}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide">{status}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent orders table */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-base font-medium text-slate-700">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-slate-400">No recent orders.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-2 text-left font-medium text-slate-600">Order ID</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">User</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">Total</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">#{order.id}</td>
                    <td className="px-4 py-3 text-slate-600">{order.username}</td>
                    <td className="px-4 py-3 text-slate-700">{formatCurrency(order.total_price)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function StatusBadge({ status }) {
  const colorMap = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    SHIPPED: 'bg-indigo-100 text-indigo-700',
    DELIVERED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${colorMap[status] ?? 'bg-slate-100 text-slate-600'}`}
    >
      {status}
    </span>
  );
}
