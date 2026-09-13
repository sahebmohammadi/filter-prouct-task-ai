import { cn } from "cn"
import { LabeledField } from "@/components/ui/labeled-field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface SelectOption {
  value: string
  label: string
}

interface LabeledSelectProps {
  id: string
  label: string
  value: string
  options: SelectOption[]
  onValueChange: (value: string) => void
  className?: string
}

export function LabeledSelect({
  id,
  label,
  value,
  options,
  onValueChange,
  className,
}: LabeledSelectProps) {
  const items = Object.fromEntries(options.map((option) => [option.value, option.label]))

  return (
    <LabeledField id={id} label={label}>
      <Select
        value={value}
        items={items}
        onValueChange={(next) => {
          // Base UI fires on every item click, including the already-selected one;
          // a native <select> doesn't, and callers treat this as a real change.
          if (next !== null && next !== value) onValueChange(next)
        }}
      >
        <SelectTrigger
          id={id}
          className={cn("w-full data-[size=default]:h-9", className)}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </LabeledField>
  )
}
