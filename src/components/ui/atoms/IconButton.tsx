interface IconButtonProps {
    variant?: 'primary' | 'bg';
    icon : React.ReactNode;
    onClick? : () => void;
    as?: 'button' | 'span';
}

export default function IconButton ({variant = 'primary', icon, onClick, as = 'button',} : IconButtonProps) {

    const variantStyles = {
        primary: 'text-slate-400 hover:text-white',
        bg: 'w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white border border-slate-600',
    };

    const className = `cursor-pointer transition-colors ${variantStyles[variant]}`;

    if (as === 'span') {
        return (
            <span onClick={onClick} className={className}>
            {icon}
            </span>
        );
    }

    return (
        <button type="button" onClick={onClick} className={className}>
            {icon}
        </button>
    )
}