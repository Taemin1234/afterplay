interface InputProps {
    placeholder?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string
  }

export default function Input({placeholder, value, onChange, className=""} : InputProps) {
    return (
        <input 
            type="text"
            value={value}
            placeholder={placeholder}
            onChange={onChange}
            className={`w-full focus:outline-none transition ${className}`}
        />
    )
}