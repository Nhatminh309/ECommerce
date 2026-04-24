export default function Alert({ type = 'error', children }) {
  if (!children) return null;

  const className =
    type === 'success'
      ? 'border-leaf/30 bg-leaf/10 text-leaf'
      : 'border-coral/30 bg-coral/10 text-coral';

  return <div className={`rounded-md border px-4 py-3 text-sm ${className}`}>{children}</div>;
}
