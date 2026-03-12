interface IconButtonProps {
    variant?: 'primary' | 'bg';
    icon: React.ReactNode;
    onClick?: () => void;
    as?: 'button' | 'span';
    disabled?: boolean;
    className?: string;
}

export default function IconButton({ variant = 'primary', icon, disabled = false, onClick, as = 'button', className = ""}: IconButtonProps) {

    const variantStyles = {
        primary: 'inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-400 hover:text-white sm:h-10 sm:w-10',
        bg: 'inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-600 bg-slate-700 text-white sm:h-10 sm:w-10',
    };

    const classNames = `transition-colors ${variantStyles[variant]} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${className}`.trim();

    if (as === 'span') {
        return (
            <span onClick={onClick} className={classNames}>
                {icon}
            </span>
        );
    }

    return (
        <button type="button" disabled={disabled} onClick={onClick} className={classNames}>
            {icon}
        </button>
    )
}
