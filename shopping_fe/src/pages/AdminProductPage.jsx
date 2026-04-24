import { useEffect, useMemo, useRef, useState } from 'react';
import Alert from '../components/Alert.jsx';
import FileUploadField from '../components/FileUploadField.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { getApiErrorMessage } from '../services/api';
import { productService } from '../services/productService';
import { formatCurrency } from '../utils/format';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  quantity: '',
};

const createImageItem = ({ id, url, previewUrl, status = 'ready', fileName = '' }) => ({
  id,
  url,
  previewUrl,
  status,
  fileName,
  error: '',
});

export default function AdminProductPage() {
  const [pageData, setPageData] = useState(null);
  const [page, setPage] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const imageIdRef = useRef(0);
  const objectUrlsRef = useRef(new Set());

  const products = useMemo(() => pageData?.items || [], [pageData]);
  const totalPages = Math.ceil((pageData?.total ?? 0) / (pageData?.size ?? 10));

  const isUploading = images.some((image) => image.status === 'uploading');
  const hasUploadError = images.some((image) => image.status === 'error');
  const canSubmit = !submitting && !isUploading && !hasUploadError;

  const revokePreviewUrls = (list) => {
    list.forEach((image) => {
      if (image.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(image.previewUrl);
        objectUrlsRef.current.delete(image.previewUrl);
      }
    });
  };

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await productService.getAllProducts({ page, size: 10 });
      setPageData(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [page]);

  useEffect(
    () => () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
    },
    [],
  );

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleEdit = (product) => {
    revokePreviewUrls(images);
    setEditingId(product.id);
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      quantity: product.quantity ?? '',
    });
    setImages(
      (product.imageUrls || []).map((url) =>
        createImageItem({
          id: `existing-${++imageIdRef.current}`,
          url,
          previewUrl: url,
          status: 'ready',
        }),
      ),
    );
    setError('');
    setSuccess('');
  };

  const resetForm = () => {
    revokePreviewUrls(images);
    setEditingId(null);
    setForm(emptyForm);
    setImages([]);
    setError('');
    setSuccess('');
  };

  const handleRemoveImage = (id) => {
    setImages((current) => {
      const next = current.filter((image) => image.id !== id);
      const removed = current.find((image) => image.id === id);
      if (removed?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(removed.previewUrl);
        objectUrlsRef.current.delete(removed.previewUrl);
      }
      return next;
    });
  };

  const uploadOneFile = async (file, itemId) => {
    try {
      const url = await productService.uploadImage(file);
      setImages((current) =>
        current.map((image) =>
          image.id === itemId
            ? {
                ...image,
                url,
                previewUrl: url,
                status: 'ready',
                error: '',
              }
            : image,
        ),
      );
    } catch (err) {
      setError(getApiErrorMessage(err));
      setImages((current) =>
        current.map((image) =>
          image.id === itemId
            ? {
                ...image,
                status: 'error',
                error: getApiErrorMessage(err),
              }
            : image,
        ),
      );
    }
  };

  const handleFilesSelected = async (event) => {
    const fileList = Array.from(event.target.files || []);
    event.target.value = '';

    if (fileList.length === 0) {
      return;
    }

    setError('');
    setSuccess('');

    const createdItems = fileList.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      objectUrlsRef.current.add(previewUrl);
      const itemId = `upload-${++imageIdRef.current}`;

      return createImageItem({
        id: itemId,
        url: '',
        previewUrl,
        status: 'uploading',
        fileName: file.name,
      });
    });

    setImages((current) => [...current, ...createdItems]);

    await Promise.all(
      createdItems.map((item, index) => uploadOneFile(fileList[index], item.id)),
    );
  };

  const validateForm = () => {
    if (!form.name.trim()) return 'Product name is required';
    if (!form.price || Number(form.price) <= 0) return 'Price must be greater than 0';
    if (form.quantity === '' || Number(form.quantity) < 0) return 'Quantity must be 0 or greater';
    if (isUploading) return 'Wait until image uploads finish';
    if (hasUploadError) return 'Remove or re-upload failed images before submitting';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        quantity: Number(form.quantity),
        imageUrls: images.filter((image) => image.status === 'ready' && image.url).map((image) => image.url),
      };

      if (editingId) {
        await productService.updateProduct(editingId, body);
        setSuccess('Product updated.');
      } else {
        await productService.createProduct(body);
        setSuccess('Product created.');
      }

      resetForm();
      await loadProducts();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId) => {
    setError('');
    setSuccess('');
    try {
      await productService.deleteProduct(productId);
      setSuccess('Product deleted.');
      await loadProducts();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <section>
      <div>
        <h1 className="text-3xl font-semibold">Admin products</h1>
        <p className="mt-2 text-slate-600">Create, update, and remove products.</p>
      </div>

      <div className="mt-6 space-y-3">
        <Alert>{error}</Alert>
        <Alert type="success">{success}</Alert>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[380px_1fr]">
        <form className="h-fit rounded-lg border border-slate-200 p-5" onSubmit={handleSubmit}>
          <h2 className="text-xl font-semibold">{editingId ? 'Edit product' : 'New product'}</h2>

          <div className="mt-5 space-y-4">
            <label className="field-label" htmlFor="name">
              Name
              <input
                id="name"
                className="field-input"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </label>
            <label className="field-label" htmlFor="description">
              Description
              <textarea
                id="description"
                className="field-input min-h-24"
                name="description"
                value={form.description}
                onChange={handleChange}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="field-label" htmlFor="price">
                Price
                <input
                  id="price"
                  className="field-input"
                  min="0.01"
                  name="price"
                  step="0.01"
                  type="number"
                  value={form.price}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="field-label" htmlFor="quantity">
                Quantity
                <input
                  id="quantity"
                  className="field-input"
                  min="0"
                  name="quantity"
                  type="number"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <div className="space-y-3">
              <FileUploadField onChange={handleFilesSelected} disabled={submitting} />
              {isUploading && <p className="text-sm text-slate-600">Uploading images...</p>}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((image) => (
                  <div key={image.id} className="space-y-2">
                    <div className="relative overflow-hidden rounded-md border border-slate-200">
                      <ProductImage
                        className="aspect-square w-full"
                        src={image.previewUrl}
                        alt={image.fileName || 'Uploaded image'}
                      />
                      <button
                        className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm"
                        type="button"
                        onClick={() => handleRemoveImage(image.id)}
                      >
                        Remove
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">
                      {image.status === 'uploading' && 'Uploading...'}
                      {image.status === 'ready' && 'Uploaded'}
                      {image.status === 'error' && image.error}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button className="btn-primary flex-1" type="submit" disabled={!canSubmit}>
              {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
            {editingId && (
              <button className="btn-secondary" type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <div>
          {loading ? (
            <p className="text-slate-600">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="text-slate-600">No products found.</p>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <article
                  className="grid gap-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-[96px_1fr_auto]"
                  key={product.id}
                >
                  <ProductImage
                    className="aspect-square w-full rounded-md sm:w-24"
                    src={product.imageUrls?.[0]}
                    alt={product.name}
                  />
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                      {product.description || 'No description available.'}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {formatCurrency(product.price)} / {product.quantity} in stock
                    </p>
                  </div>
                  <div className="flex gap-2 sm:flex-col">
                    <button className="btn-secondary" type="button" onClick={() => handleEdit(product)}>
                      Edit
                    </button>
                    <button
                      className="rounded-md border border-coral/30 px-4 py-2 text-sm font-semibold text-coral transition hover:bg-coral/10"
                      type="button"
                      onClick={() => handleDelete(product.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
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
        </div>
      </div>
    </section>
  );
}
