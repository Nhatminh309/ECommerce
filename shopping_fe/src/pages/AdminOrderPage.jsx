import { useEffect, useMemo, useState } from 'react';
import Alert from '../components/Alert.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { getApiErrorMessage } from '../services/api';
import { orderService } from '../services/orderService';
import { formatCurrency, formatDate } from '../utils/format';

const statuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

export default function AdminOrderPage() {
  const [pageData, setPageData] = useState(null);
  const [page, setPage] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const orders = useMemo(() => pageData?.items || [], [pageData]);
  const totalPages = Math.ceil((pageData?.total ?? 0) / (pageData?.size ?? 10));

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await orderService.getAllOrders({ page, size: 10 });
      setPageData(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page]);

  const handleStatusChange = async (orderId, status) => {
    setError('');
    setSuccess('');
    setUpdatingId(orderId);
    try {
      await orderService.updateOrderStatus(orderId, status);
      setSuccess(`Order #${orderId} updated.`);
      await loadOrders();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section>
      <div>
        <h1 className="text-3xl font-semibold">Paid Orders</h1>
        <p className="mt-2 text-slate-600">Manage orders with successful payment only.</p>
      </div>

      <div className="mt-6 space-y-3">
        <Alert>{error}</Alert>
        <Alert type="success">{success}</Alert>
      </div>

      {loading ? (
        <p className="mt-10 text-slate-600">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="mt-10 text-slate-600">No orders found.</p>
      ) : (
        <div className="mt-8 space-y-5">
          {orders.map((order) => (
            <article className="rounded-lg border border-slate-200 p-5" key={order.id}>
              <div className="flex flex-col justify-between gap-4 lg:flex-row">
                <div>
                  <h2 className="text-xl font-semibold">Order #{order.id}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {order.username} / {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <span className="font-semibold text-coral">{formatCurrency(order.totalPrice)}</span>
                  <select
                    className="field-input mt-0 min-w-44"
                    disabled={updatingId === order.id}
                    value={order.status}
                    onChange={(event) => handleStatusChange(order.id, event.target.value)}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5 divide-y divide-slate-200">
                {(order.orderItems || []).map((item) => (
                  <div className="flex gap-4 py-4" key={item.id}>
                    <ProductImage
                      className="h-16 w-16 rounded-md"
                      src={item.imageUrls?.[0]}
                      alt={item.productName}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Qty {item.quantity} / {formatCurrency(item.price)}
                      </p>
                    </div>
                    <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            className="btn-secondary"
            type="button"
            disabled={page === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page {page + 1} of {totalPages}
          </span>
          <button
            className="btn-secondary"
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
