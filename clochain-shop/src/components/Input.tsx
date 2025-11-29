import type { InputHTMLAttributes } from 'react'

type InputProps = {
  label?: string
  hint?: string
  className?: string
  inputClassName?: string
} & InputHTMLAttributes<HTMLInputElement>

const Input = ({
  label,
  hint,
  className = '',
  inputClassName = '',
  ...props
}: InputProps) => {
  return (
    <label className={`block space-y-2 ${className}`}>
      {label && <span className="text-xs uppercase tracking-[0.2em] text-gray-500">{label}</span>}
      <input
        className={`w-full rounded-full border border-ink/20 bg-transparent px-5 py-3 text-sm text-ink placeholder:text-gray-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink/20 ${inputClassName}`}
        {...props}
      />
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </label>
  )
}

export default Input
