export default function Select({
  label,
  options = [],
  error,
  placeholder = 'Seleccionar...',
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
      <select
        className={`w-full h-10 px-3 rounded-lg border border-border bg-white text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 ${
          error ? 'border-red-500' : ''
        } ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
