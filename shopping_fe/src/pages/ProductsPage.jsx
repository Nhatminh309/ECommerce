import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { getApiErrorMessage } from '../services/api';
import { productService } from '../services/productService';
import { formatCurrency } from '../utils/format';

export default function ProductsPage() {
  const [pageData, setPageData] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    productService
      .getAllProducts({ keyword: keyword || undefined, page, size: 12 })
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
  }, [keyword, page]);

  const products = useMemo(() => pageData?.items || [], [pageData]);
  const totalPages = Math.ceil((pageData?.total ?? 0) / (pageData?.size ?? 12));

  const handleSearch = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setKeyword(String(formData.get('keyword') || '').trim());
    setPage(0);
  };

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold">Products</h1>
          <p className="mt-2 text-slate-600">Browse available products.</p>
        </div>

        <form className="flex w-full gap-2 sm:w-auto" onSubmit={handleSearch}>
          <input
            className="field-input min-w-0 sm:w-72"
            name="keyword"
            placeholder="Search products"
            defaultValue={keyword}
          />
          <button className="btn-primary" type="submit">
            Search
          </button>
        </form>
      </div>

      <div className="mt-6">
        <Alert>{error}</Alert>
      </div>

      {loading ? (
        <p className="mt-10 text-slate-600">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="mt-10 text-slate-600">No products found.</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <Link
              className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft transition hover:-translate-y-0.5 hover:border-leaf/40"
              key={product.id}
              to={`/products/${product.id}`}
            >
              <ProductImage
                className="aspect-[4/3] w-full"
                src={product.imageUrls?.[0]}
                alt={product.name}
              />
              <div className="space-y-3 p-4">
                <div>
                  <h2 className="line-clamp-2 text-lg font-semibold group-hover:text-leaf">
                    {product.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">{product.quantity} in stock</p>
                </div>
                <p className="line-clamp-2 min-h-10 text-sm text-slate-600">
                  {product.description || 'No description available.'}
                </p>
                <p className="text-lg font-semibold text-coral">{formatCurrency(product.price)}</p>
              </div>
            </Link>
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
