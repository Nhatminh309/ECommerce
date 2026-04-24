import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { getApiErrorMessage } from '../services/api';
import { orderService } from '../services/orderService';
import { formatCurrency, formatDate } from '../utils/format';

export default function OrdersPage() {
  const location = useLocation();
  const [pageData, setPageData] = useState(null);
  const [page, setPage] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.message || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    orderService
      .getMyOrders({ page, size: 10 })
      .then((data) => {
        if (active) setPageData(data);
      })
      .catch((err) => {
        if (active) setError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page]);

  const orders = useMemo(() => pageData?.items || [], [pageData]);
  const totalPages = Math.ceil((pageData?.total ?? 0) / (pageData?.size ?? 10));

  return (
    <section>
      <h1 className="text-3xl font-semibold">Orders</h1>
      <p className="mt-2 text-slate-600">Review your order history.</p>

      <div className="mt-6">
        <Alert>{error}</Alert>
        <Alert type="success">{success}</Alert>
      </div>

      {loading ? (
        <p className="mt-10 text-slate-600">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="mt-10 text-slate-600">No orders yet.</p>
      ) : (
        <div className="mt-8 space-y-5">
          {orders.map((order) => (
            <article className="rounded-lg border border-slate-200 p-5" key={order.id}>
              <div className="flex flex-col justify-between gap-3 sm:flex-row">
                <div>
                  <h2 className="text-xl font-semibold">Order #{order.id}</h2>
                  <p className="mt-1 text-sm text-slate-500">{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-semibold text-coral">{formatCurrency(order.totalPrice)}</p>
                  <p className="mt-1 inline-flex rounded-md bg-mist px-2 py-1 text-xs font-semibold text-leaf">
                    {order.status}
                  </p>
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
