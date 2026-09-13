import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface LabeledInputProps {
  id: string
  label: string
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function LabeledInput({
  id,
  label,
  value,
  onValueChange,
  placeholder,
  className,
}: LabeledInputProps) {
  return (
    <div className="flex w-full flex-col gap-1 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
      <Label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type="text"
        aria-label={label}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
    </div>
  )
}
