import type { ReactNode } from "react"
import { Label } from "@/components/ui/label"

interface LabeledFieldProps {
  id: string
  label: string
  children: ReactNode
}

// Below `sm:` the label stacks above a full-width control; from `sm:` up they sit
// inline. Controls take `w-full` here and set only their `sm:` width at the call site.
export function LabeledField({ id, label, children }: LabeledFieldProps) {
  return (
    <div className="flex w-full flex-col gap-1 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
      <Label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  )
}
