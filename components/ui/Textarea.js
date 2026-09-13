export default function Textarea({
  label,
  error,
  className = '',
  ...props
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-3 py-2.5 rounded-lg border border-border bg-white text-foreground placeholder:text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 resize-none ${
          error ? 'border-red-500' : ''
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
