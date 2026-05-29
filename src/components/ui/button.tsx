import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    let baseStyles = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
    
    let variantStyles = ""
    switch(variant) {
      case 'default':
        variantStyles = "bg-primary text-white shadow hover:opacity-90"
        break
      case 'outline':
        variantStyles = "border border-outline-variant bg-transparent shadow-sm hover:bg-surface-container"
        break
      case 'secondary':
        variantStyles = "bg-secondary text-white shadow-sm hover:opacity-90"
        break
      case 'ghost':
        variantStyles = "hover:bg-surface-container text-text-primary"
        break
      case 'link':
        variantStyles = "text-primary underline-offset-4 hover:underline"
        break
      case 'destructive':
        variantStyles = "bg-red-600 text-white shadow-sm hover:bg-red-700"
        break
    }

    let sizeStyles = ""
    switch(size) {
      case 'default':
        sizeStyles = "h-9 px-4 py-2"
        break
      case 'sm':
        sizeStyles = "h-8 rounded-md px-3 text-xs"
        break
      case 'lg':
        sizeStyles = "h-10 rounded-md px-8"
        break
      case 'icon':
        sizeStyles = "h-9 w-9"
        break
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
