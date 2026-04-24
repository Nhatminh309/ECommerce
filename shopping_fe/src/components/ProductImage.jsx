import { resolveImageUrl } from '../utils/format';

export default function ProductImage({ src, alt, className = '' }) {
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-mist text-sm font-medium text-slate-500 ${className}`}
      >
        No image
      </div>
    );
  }

  return <img className={`object-cover ${className}`} src={resolveImageUrl(src)} alt={alt} />;
}
