export default function FileUploadField({ onChange, disabled }) {
  return (
    <label className="field-label" htmlFor="product-images">
      Product images
      <input
        id="product-images"
        className="field-input mt-1"
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        multiple
        onChange={onChange}
        disabled={disabled}
      />
    </label>
  );
}
