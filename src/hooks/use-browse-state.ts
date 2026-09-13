import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router"
import {
  isSortField,
  isSortOrder,
  PAGE_LIMIT,
  type Sort,
  type SortField,
  type SortOrder,
} from "@/hooks/use-products"

const SEARCH_DEBOUNCE_MS = 300

export const ALL_CATEGORIES_VALUE = "all"

export const SORT_OPTIONS: {
  value: string
  label: string
  sortBy?: SortField
  order?: SortOrder
}[] = [
  { value: "default", label: "Default" },
  { value: "title-asc", label: "Title (A-Z)", sortBy: "title", order: "asc" },
  { value: "title-desc", label: "Title (Z-A)", sortBy: "title", order: "desc" },
  { value: "price-asc", label: "Price (Low to High)", sortBy: "price", order: "asc" },
  { value: "price-desc", label: "Price (High to Low)", sortBy: "price", order: "desc" },
  { value: "rating-asc", label: "Rating (Low to High)", sortBy: "rating", order: "asc" },
  { value: "rating-desc", label: "Rating (High to Low)", sortBy: "rating", order: "desc" },
]

function parsePage(value: string | null): number {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function parseSort(searchParams: URLSearchParams): Sort {
  const sortBy = searchParams.get("sortBy")
  const order = searchParams.get("order")
  if (sortBy && order && isSortField(sortBy) && isSortOrder(order)) {
    return { sortBy, order }
  }
  return {}
}

function sortOptionValue(sort: Sort): string {
  return sort.sortBy && sort.order ? `${sort.sortBy}-${sort.order}` : "default"
}

function parseCategory(searchParams: URLSearchParams): string | undefined {
  return searchParams.get("category") ?? undefined
}

function parseQuery(searchParams: URLSearchParams): string {
  return searchParams.get("q") ?? ""
}

export function useBrowseState() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parsePage(searchParams.get("page"))
  const skip = (page - 1) * PAGE_LIMIT
  const sort = parseSort(searchParams)
  const category = parseCategory(searchParams)
  const q = parseQuery(searchParams)

  const [searchInput, setSearchInput] = useState(q)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    setSearchInput(q)
  }, [q])

  useEffect(() => {
    return () => clearTimeout(debounceTimerRef.current)
  }, [])

  function goToPage(nextPage: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set("page", String(nextPage))
      return next
    })
  }

  function handleSortChange(value: string) {
    const option = SORT_OPTIONS.find((o) => o.value === value)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set("page", "1")
      if (option?.sortBy && option.order) {
        next.set("sortBy", option.sortBy)
        next.set("order", option.order)
      } else {
        next.delete("sortBy")
        next.delete("order")
      }
      return next
    })
  }

  function handleCategoryChange(value: string) {
    clearTimeout(debounceTimerRef.current)
    setSearchInput("")
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set("page", "1")
      next.delete("q")
      if (value === ALL_CATEGORIES_VALUE) {
        next.delete("category")
      } else {
        next.set("category", value)
      }
      return next
    })
  }

  function handleSearchChange(value: string) {
    setSearchInput(value)
    clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set("page", "1")
        if (value) {
          next.set("q", value)
          next.delete("category")
        } else {
          next.delete("q")
        }
        return next
      })
    }, SEARCH_DEBOUNCE_MS)
  }

  return {
    page,
    skip,
    sort,
    category,
    q,
    searchInput,
    sortValue: sortOptionValue(sort),
    categoryValue: category ?? ALL_CATEGORIES_VALUE,
    goToPage,
    handleSortChange,
    handleCategoryChange,
    handleSearchChange,
  }
}
