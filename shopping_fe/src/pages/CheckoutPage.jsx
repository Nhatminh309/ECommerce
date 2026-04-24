import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { getApiErrorMessage } from '../services/api';
import { orderService } from '../services/orderService';
import { paymentService } from '../services/paymentService';
import { formatCurrency } from '../utils/format';

export default function CheckoutPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { cart, loading, loadCart } = useCart();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    address: '',
    note: '',
  });

  useEffect(() => {
    loadCart().catch((err) => setError(getApiErrorMessage(err)));
  }, [loadCart]);

  const items = cart?.cartItems || [];
  const isFormValid = formData.full_name && formData.phone_number && formData.address;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || submitting) return;

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      // Step 1: Create order with shipping info
      const order = await orderService.createOrder(formData);

      // Step 2: Create payment
      const paymentResult = await paymentService.createPayment({
        order_id: order.data.id
      });

      // Step 3: Redirect to OnePay
      const paymentUrl = paymentResult?.data?.payment_url;

      if (!paymentUrl) {
        throw new Error("Payment URL not found");
      }

      window.location.href = paymentUrl;
    } catch (err) {
      setError(getApiErrorMessage(err));
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="mt-10 text-slate-600">Loading checkout...</p>;
  }

  if (items.length === 0) {
    return (
      <section>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold">Checkout</h1>
            <p className="mt-2 text-slate-600">Create an order from your current cart.</p>
          </div>
          <Link className="btn-secondary" to="/cart">
            Back to cart
          </Link>
        </div>
        <div className="mt-10 rounded-lg border border-slate-200 p-6">
          <p className="text-slate-600">Your cart is empty.</p>
          <Link className="btn-primary mt-4" to="/products">
            Browse products
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold">Checkout</h1>
          <p className="mt-2 text-slate-600">Complete your order and proceed to payment.</p>
        </div>
        <Link className="btn-secondary" to="/cart">
          Back to cart
        </Link>
      </div>

      <div className="mt-6">
        <Alert>{error}</Alert>
        <Alert type="success">{success}</Alert>
      </div>

      <form className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]" onSubmit={handleSubmit}>
        {/* Left: Shipping Information Form */}
        <div className="space-y-6 rounded-lg border border-slate-200 p-6">
          <h2 className="text-xl font-semibold">Shipping Information</h2>

          <div className="grid gap-4">
            <div>
              <label className="field-label" htmlFor="full_name">
                Full Name <span className="text-coral">*</span>
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                className="field-input"
                value={formData.full_name}
                onChange={handleChange}
                required
                minLength={1}
                maxLength={100}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="phone_number">
                Phone Number <span className="text-coral">*</span>
              </label>
              <input
                id="phone_number"
                name="phone_number"
                type="tel"
                className="field-input"
                value={formData.phone_number}
                onChange={handleChange}
                required
                minLength={1}
                maxLength={20}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="address">
                Address <span className="text-coral">*</span>
              </label>
              <textarea
                id="address"
                name="address"
                className="field-input"
                value={formData.address}
                onChange={handleChange}
                required
                minLength={1}
                rows={3}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="note">
                Note (optional)
              </label>
              <textarea
                id="note"
                name="note"
                className="field-input"
                value={formData.note}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <aside className="h-fit rounded-lg border border-slate-200 p-5">
          <h2 className="text-xl font-semibold">Order Summary</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Items ({items.length})</span>
              <span className="font-medium">{formatCurrency(cart.totalPrice)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
              <span className="font-semibold">Total</span>
              <span className="font-semibold text-coral">{formatCurrency(cart.totalPrice)}</span>
            </div>
          </div>
          <button
            className="btn-primary mt-5 w-full"
            type="submit"
            disabled={submitting || !isFormValid}
          >
            {submitting ? 'Processing...' : 'Place Order & Pay'}
          </button>
          <p className="mt-3 text-center text-xs text-slate-500">
            You will be redirected to OnePay to complete payment
          </p>
        </aside>
      </form>
    </section>
  );
}
