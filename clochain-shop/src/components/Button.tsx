import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

const baseStyles =
  'inline-flex items-center justify-center rounded-full border transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

type ButtonVariant = 'primary' | 'muted' | 'light'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-ink text-pearl border-transparent hover:bg-dusk focus-visible:outline-ink',
  muted:
    'bg-transparent text-ink border-ink/20 hover:border-ink/60 focus-visible:outline-ink',
  light:
    'bg-pearl text-ink border-transparent hover:bg-beige focus-visible:outline-beige',
}

type ButtonProps<T extends ElementType> = {
  as?: T
  variant?: ButtonVariant
  fullWidth?: boolean
  className?: string
  children: ReactNode
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>

const Button = <T extends ElementType = 'button'>({
  as,
  variant = 'primary',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps<T>) => {
  const Component = as || 'button'
  const computed = [
    baseStyles,
    variants[variant],
    fullWidth ? 'w-full' : '',
    'px-5 py-3 text-xs tracking-[0.28em] uppercase font-medium',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Component className={computed} {...(props as ComponentPropsWithoutRef<T>)}>
      {children}
    </Component>
  )
}

export default Button
