import { LabeledInput } from "@/components/ui/labeled-input"
import { LabeledSelect, type SelectOption } from "@/components/ui/labeled-select"
import { ALL_CATEGORIES_VALUE, SORT_OPTIONS } from "@/hooks/use-browse-state"

interface FilterBarProps {
  searchInput: string
  categoryValue: string
  categoryOptions: string[]
  sortValue: string
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onSortChange: (value: string) => void
}

export function FilterBar({
  searchInput,
  categoryValue,
  categoryOptions,
  sortValue,
  onSearchChange,
  onCategoryChange,
  onSortChange,
}: FilterBarProps) {
  const categorySelectOptions: SelectOption[] = [
    { value: ALL_CATEGORIES_VALUE, label: "All categories" },
    ...categoryOptions.map((option) => ({ value: option, label: option })),
  ]

  return (
    <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
      <LabeledInput
        id="search"
        label="Search"
        value={searchInput}
        onValueChange={onSearchChange}
        placeholder="Search products..."
        className="w-full sm:w-56"
      />
      <LabeledSelect
        id="category"
        label="Category"
        value={categoryValue}
        options={categorySelectOptions}
        onValueChange={onCategoryChange}
        className="w-full sm:w-44"
      />
      <LabeledSelect
        id="sort"
        label="Sort"
        value={sortValue}
        options={SORT_OPTIONS}
        onValueChange={onSortChange}
        className="w-full sm:w-48"
      />
    </div>
  )
}
