import { LabeledInput } from "@/components/ui/labeled-input"
import { LabeledSelect, type SelectOption } from "@/components/ui/labeled-select"

interface BrowseControlsProps {
  searchInput: string
  categoryValue: string
  categoryOptions: SelectOption[]
  sortValue: string
  sortOptions: SelectOption[]
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onSortChange: (value: string) => void
}

export function BrowseControls({
  searchInput,
  categoryValue,
  categoryOptions,
  sortValue,
  sortOptions,
  onSearchChange,
  onCategoryChange,
  onSortChange,
}: BrowseControlsProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-end gap-4">
      <LabeledInput
        id="search"
        label="Search"
        value={searchInput}
        onValueChange={onSearchChange}
        placeholder="Search products..."
        className="sm:w-56"
      />
      <LabeledSelect
        id="category"
        label="Category"
        value={categoryValue}
        options={categoryOptions}
        onValueChange={onCategoryChange}
        className="sm:w-44"
      />
      <LabeledSelect
        id="sort"
        label="Sort by"
        value={sortValue}
        options={sortOptions}
        onValueChange={onSortChange}
        className="sm:w-48"
      />
    </div>
  )
}
