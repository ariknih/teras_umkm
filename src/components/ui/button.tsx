import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline' | 'soft' | 'transparent' | 'anchor' | 'default' | 'destructive' | 'secondary' | 'ghost' | 'link'
  size?: 'xl' | 'lg' | 'md' | 'sm' | 'default' | 'icon'
  iconOnly?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'solid', size = 'md', iconOnly = false, ...props }, ref) => {
    let baseStyles = "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:bg-[#f7f7f7] disabled:text-[#d1d1d1] disabled:border-transparent [&_svg]:pointer-events-none [&_svg]:shrink-0"
    
    let variantStyles = ""
    switch(variant) {
      case 'solid':
      case 'default':
        variantStyles = "bg-primary text-white shadow-sm hover:bg-[#438a1a] active:bg-[#326814]"
        break
      case 'outline':
        variantStyles = "border border-primary text-primary bg-white hover:bg-[#438a1a] hover:text-white active:bg-[#326814] active:text-white active:border-[#326814]"
        break
      case 'soft':
        variantStyles = "bg-[#eef8e9] text-primary hover:bg-[#ddf1d3] active:bg-[#bbed91]"
        break
      case 'transparent':
        variantStyles = "bg-transparent text-primary hover:bg-[#ddf1d3] active:bg-[#bbed91]"
        break
      case 'anchor':
      case 'link':
        variantStyles = "bg-transparent text-primary hover:text-[#438a1a] active:text-[#326814] underline-offset-4 hover:underline"
        break
      case 'destructive':
        variantStyles = "bg-red-600 text-white shadow-sm hover:bg-red-700"
        break
      case 'secondary':
        variantStyles = "bg-secondary text-white shadow-sm hover:opacity-90"
        break
      case 'ghost':
        variantStyles = "hover:bg-surface-container text-text-primary"
        break
    }

    let sizeStyles = ""
    if (variant === 'anchor' || variant === 'link') {
       sizeStyles = "p-0"
    } else {
      switch(size) {
        case 'xl':
          sizeStyles = iconOnly ? "w-12 h-12 p-3 rounded-[10px]" : "px-4 py-2.5 rounded-[10px] text-base"
          break
        case 'lg':
          sizeStyles = iconOnly ? "w-10 h-10 p-2 rounded-lg" : "px-4 py-2 rounded-lg text-base"
          break
        case 'md':
        case 'default':
          sizeStyles = iconOnly ? "w-8 h-8 p-2 rounded-md" : "px-2.5 py-2 rounded-md text-sm"
          break
        case 'sm':
          sizeStyles = iconOnly ? "w-6 h-6 p-1.5 rounded-sm" : "px-2 py-1.5 rounded-sm text-xs"
          break
        case 'icon':
          sizeStyles = "h-9 w-9 rounded-md"
          break
      }
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
