export function Button({
    children,
    variant = 'primary',
    className = '',
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' }) {

    const baseStyles = "px-4 py-3 rounded-xl font-semibold text-base tracking-wide transition-all duration-120 ease-out active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2";

    const variants = {
        primary: "bg-brand-blue-900 text-brand-gold-400 hover:bg-brand-blue-800 hover:shadow-lg border border-brand-gold-500/30",
        secondary: "bg-brand-blue-800 text-white hover:bg-brand-blue-700 hover:shadow-lg font-black",
        outline: "border-2 border-brand-blue-900 text-brand-blue-900 hover:bg-brand-blue-50"
    };

    return (
        <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
}
