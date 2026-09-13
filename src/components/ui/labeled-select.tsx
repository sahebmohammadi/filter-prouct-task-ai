import { Label } from "@/components/ui/label"
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
    <div className="flex w-full flex-col gap-1 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
      <Label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </Label>
      <Select
        value={value}
        items={items}
        onValueChange={(next) => onValueChange(next ?? value)}
      >
        <SelectTrigger id={id} aria-label={label} className={className}>
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
    </div>
  )
}
