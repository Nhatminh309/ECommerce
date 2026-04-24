import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { getApiErrorMessage } from '../services/api';
import { productService } from '../services/productService';
import { formatCurrency } from '../utils/format';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const isCustomer = user?.role === 'CUSTOMER';

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    productService
      .getProduct(id)
      .then((data) => {
        if (!active) return;
        setProduct(data);
        setSelectedImage(data.imageUrls?.[0] || '');
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
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/products/${id}` } } });
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await addToCart({ productId: Number(id), quantity: Number(quantity) });
      setSuccess('Item added to cart.');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-slate-600">Loading product...</p>;
  }

  if (!product) {
    return (
      <section>
        <Alert>{error || 'Product not found.'}</Alert>
        <Link className="mt-4 inline-flex text-leaf hover:underline" to="/products">
          Back to products
        </Link>
      </section>
    );
  }

  return (
    <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <div>
        <ProductImage
          className="aspect-[4/3] w-full rounded-lg border border-slate-200"
          src={selectedImage}
          alt={product.name}
        />
        {product.imageUrls?.length > 1 && (
          <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6">
            {product.imageUrls.map((url) => (
              <button
                className={`overflow-hidden rounded-md border ${
                  selectedImage === url ? 'border-leaf ring-2 ring-leaf/20' : 'border-slate-200'
                }`}
                key={url}
                type="button"
                onClick={() => setSelectedImage(url)}
              >
                <ProductImage className="aspect-square w-full" src={url} alt={product.name} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <Link className="text-sm font-medium text-leaf hover:underline" to="/products">
          Back to products
        </Link>
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">{product.name}</h1>
          <p className="mt-3 text-2xl font-semibold text-coral">{formatCurrency(product.price)}</p>
          <p className="mt-2 text-sm text-slate-500">{product.quantity} available</p>
        </div>

        <p className="whitespace-pre-line text-slate-700">
          {product.description || 'No description available.'}
        </p>

        {isCustomer && (
          <div className="space-y-4 border-t border-slate-200 pt-6">
            <Alert>{error}</Alert>
            <Alert type="success">{success}</Alert>

            <label className="field-label max-w-36" htmlFor="quantity">
              Quantity
            <input
                id="quantity"
                className="field-input"
                min={1}
                max={product.quantity}
                type="number"
                value={quantity}
                onChange={(event) => setQuantity(Math.max(1, Number(event.target.value || 1)))}
              />
            </label>

            <button
              className="btn-primary"
              type="button"
              disabled={submitting || product.quantity < 1}
              onClick={handleAddToCart}
            >
              {submitting ? 'Adding...' : 'Add to cart'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
