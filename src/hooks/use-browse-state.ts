import { useEffect, useRef, useState } from "react"
import { type NavigateOptions, useSearchParams } from "react-router"
import {
  isSortField,
  isSortOrder,
  PAGE_LIMIT,
  type ProductQuery,
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

function parseSearchTerm(searchParams: URLSearchParams): string {
  return searchParams.get("q") ?? ""
}

export function useBrowseState() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parsePage(searchParams.get("page"))
  const sort = parseSort(searchParams)
  const category = parseCategory(searchParams)
  const searchTerm = parseSearchTerm(searchParams)

  const [searchInput, setSearchInput] = useState(searchTerm)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    setSearchInput(searchTerm)
  }, [searchTerm])

  useEffect(() => {
    return () => clearTimeout(debounceTimerRef.current)
  }, [])

  function updateSearchParams(
    page: number,
    apply: (next: URLSearchParams) => void = () => {},
    options?: NavigateOptions,
  ) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set("page", String(page))
      apply(next)
      return next
    }, options)
  }

  function goToPage(nextPage: number) {
    updateSearchParams(nextPage)
  }

  function handleSortChange(value: string) {
    const option = SORT_OPTIONS.find((o) => o.value === value)
    updateSearchParams(1, (next) => {
      if (option?.sortBy && option.order) {
        next.set("sortBy", option.sortBy)
        next.set("order", option.order)
      } else {
        next.delete("sortBy")
        next.delete("order")
      }
    })
  }

  function handleCategoryChange(value: string) {
    clearTimeout(debounceTimerRef.current)
    setSearchInput("")
    updateSearchParams(1, (next) => {
      next.delete("q")
      if (value === ALL_CATEGORIES_VALUE) {
        next.delete("category")
      } else {
        next.set("category", value)
      }
    })
  }

  function handleSearchChange(value: string) {
    setSearchInput(value)
    clearTimeout(debounceTimerRef.current)
    // ADR 0002: the first settled Search Term pushes an entry; refining it replaces
    // that entry, so one Back undoes the whole search.
    const isRefiningSearch = searchTerm !== ""
    debounceTimerRef.current = setTimeout(() => {
      updateSearchParams(
        1,
        (next) => {
          if (value) {
            next.set("q", value)
            next.delete("category")
          } else {
            next.delete("q")
          }
        },
        { replace: isRefiningSearch },
      )
    }, SEARCH_DEBOUNCE_MS)
  }

  const productQuery: ProductQuery = {
    skip: (page - 1) * PAGE_LIMIT,
    sort,
    category,
    searchTerm,
  }

  return {
    page,
    productQuery,
    searchInput,
    sortValue: sortOptionValue(sort),
    categoryValue: category ?? ALL_CATEGORIES_VALUE,
    goToPage,
    handleSortChange,
    handleCategoryChange,
    handleSearchChange,
  }
}
