import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { useCart } from '../context/CartContext.jsx';
import { getApiErrorMessage } from '../services/api';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../context/AuthContext.jsx';

export default function CartPage() {
  const { user } = useAuth();
  const isCustomer = user?.role === 'CUSTOMER';
  const { cart, loading, loadCart, updateCart, removeFromCart } = useCart();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadCart().catch((err) => setError(getApiErrorMessage(err)));
  }, [loadCart]);

  const items = cart?.cartItems || [];

  const handleQuantityChange = async (productId, quantity) => {
    setError('');
    setSuccess('');
    const nextQuantity = Math.max(1, Number(quantity || 1));

    try {
      await updateCart({ productId, quantity: nextQuantity });
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleRemove = async (productId) => {
    setError('');
    setSuccess('');

    try {
      await removeFromCart(productId);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold">Cart</h1>
          <p className="mt-2 text-slate-600">Review your items before ordering.</p>
        </div>
        <Link className="btn-secondary" to="/products">
          Continue shopping
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        <Alert>{error}</Alert>
        <Alert type="success">{success}</Alert>
      </div>

      {loading ? (
        <p className="mt-10 text-slate-600">Loading cart...</p>
      ) : items.length === 0 ? (
        <p className="mt-10 text-slate-600">Your cart is empty.</p>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {items.map((item) => (
              <article
                className="grid gap-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-[120px_1fr_auto]"
                key={item.id}
              >
                <ProductImage
                  className="aspect-square w-full rounded-md sm:w-[120px]"
                  src={item.imageUrls?.[0]}
                  alt={item.productName}
                />
                <div>
                  <Link
                    className="text-lg font-semibold hover:text-leaf"
                    to={`/products/${item.productId}`}
                  >
                    {item.productName}
                  </Link>
                  <p className="mt-1 text-sm text-slate-500">{formatCurrency(item.price)} each</p>
                  <label className="field-label mt-4 max-w-28" htmlFor={`qty-${item.productId}`}>
                    Quantity
                    <input
                      id={`qty-${item.productId}`}
                      className="field-input"
                      min={1}
                      type="number"
                      value={item.quantity}
                      onChange={(event) =>
                        handleQuantityChange(item.productId, event.target.value)
                      }
                    />
                  </label>
                </div>
                <div className="flex flex-row items-center justify-between gap-4 sm:flex-col sm:items-end">
                  <p className="text-lg font-semibold">{formatCurrency(item.subtotal)}</p>
                  <button
                    className="text-sm font-medium text-coral hover:underline"
                    type="button"
                    onClick={() => handleRemove(item.productId)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className="h-fit rounded-lg border border-slate-200 p-5">
            <h2 className="text-xl font-semibold">Summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Items</span>
                <span className="font-medium">{cart.totalItems}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
                <span className="font-semibold">Total</span>
                <span className="font-semibold text-coral">{formatCurrency(cart.totalPrice)}</span>
              </div>
            </div>
            {isCustomer ? (
              <Link className="btn-primary mt-5 w-full" to="/checkout">
                Checkout
              </Link>
            ) : (
              <p className="mt-5 text-center text-sm text-slate-500">
                Customers only
              </p>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
