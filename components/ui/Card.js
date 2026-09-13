export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-xl border border-border p-6 transition-shadow duration-200 hover:shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
