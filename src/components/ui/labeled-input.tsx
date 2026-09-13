import { cn } from "cn"
import { Input } from "@/components/ui/input"
import { LabeledField } from "@/components/ui/labeled-field"

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
    <LabeledField id={id} label={label}>
      <Input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        className={cn("h-9 w-full", className)}
      />
    </LabeledField>
  )
}
