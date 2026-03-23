import * as React from "react"

export interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
    ({ className, checked, onCheckedChange, ...props }, ref) => (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onCheckedChange(!checked)}
            ref={ref}
            className={`peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal/50 focus-visible:ring-offset-2 focus-visible:ring-offset-alabaster disabled:cursor-not-allowed disabled:opacity-50 ${checked ? "bg-bordeaux" : "bg-charcoal/20"
                } ${className || ""}`}
            {...props}
        >
            <span
                className={`pointer-events-none block h-5 w-5 rounded-full bg-alabaster shadow-lg ring-0 transition-transform ${checked ? "translate-x-5" : "translate-x-0"
                    }`}
            />
        </button>
    )
)
Switch.displayName = "Switch"

export { Switch }
