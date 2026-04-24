import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { paths } from '../routes/paths';

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const queryString = searchParams.toString();
    api
      .get(`/api/payment/return?${queryString}`)
      .then((res) => setResult(res.data?.data))
      .catch((err) => setError(err?.response?.data?.message || 'Payment verification failed'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
        <p className="text-slate-500">Verifying your payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto mt-16 max-w-md">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <span className="text-3xl font-bold text-red-600">✗</span>
          </div>
          <h1 className="mb-2 text-2xl font-semibold text-red-700">Payment Failed</h1>
          <p className="mb-6 text-red-600">{error}</p>
          <Link
            to={paths.cart}
            className="inline-block rounded-lg bg-red-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Back to Cart
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-16 max-w-md">
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <span className="text-3xl font-bold text-green-600">✓</span>
        </div>
        <h1 className="mb-2 text-2xl font-semibold text-green-700">Payment Successful!</h1>
        <p className="mb-6 text-green-600">Your order has been placed successfully.</p>

        {result && (
          <div className="mb-6 rounded-xl border border-green-200 bg-white p-4 text-left text-sm text-slate-700">
            {result.transactionRef && (
              <div className="mb-2 flex justify-between">
                <span className="font-medium text-slate-500">Transaction Ref</span>
                <span className="font-mono">{result.transactionRef}</span>
              </div>
            )}
            {result.amount && (
              <div className="mb-2 flex justify-between">
                <span className="font-medium text-slate-500">Amount</span>
                <span>
                  {Number(result.amount).toLocaleString('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                  })}
                </span>
              </div>
            )}
            {result.orderId && (
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">Order ID</span>
                <span>#{result.orderId}</span>
              </div>
            )}
          </div>
        )}

        <Link
          to={paths.orders}
          className="inline-block rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-green-700"
        >
          View My Orders
        </Link>
      </div>
    </div>
  );
}
