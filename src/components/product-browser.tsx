import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, CircleAlert, RefreshCw } from "lucide-react"
import { useSearchParams } from "react-router"
import { ProductCard } from "@/components/product-card"
import { Skeleton } from "@/components/ui/skeleton"
import type { ProductsResponse } from "@/lib/types"

const PRODUCT_GRID_CLASSES = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
const PAGE_LIMIT = 12

const SORT_FIELDS = ["title", "price", "rating"] as const
type SortField = (typeof SORT_FIELDS)[number]
const SORT_ORDERS = ["asc", "desc"] as const
type SortOrder = (typeof SORT_ORDERS)[number]

interface Sort {
  sortBy?: SortField
  order?: SortOrder
}

const SORT_OPTIONS: { value: string; label: string; sortBy?: SortField; order?: SortOrder }[] = [
  { value: "default", label: "Default" },
  { value: "title-asc", label: "Title (A-Z)", sortBy: "title", order: "asc" },
  { value: "title-desc", label: "Title (Z-A)", sortBy: "title", order: "desc" },
  { value: "price-asc", label: "Price (Low to High)", sortBy: "price", order: "asc" },
  { value: "price-desc", label: "Price (High to Low)", sortBy: "price", order: "desc" },
  { value: "rating-asc", label: "Rating (Low to High)", sortBy: "rating", order: "asc" },
  { value: "rating-desc", label: "Rating (High to Low)", sortBy: "rating", order: "desc" },
]

const ALL_CATEGORIES_VALUE = "all"

function parsePage(value: string | null): number {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function parseSort(searchParams: URLSearchParams): Sort {
  const sortBy = searchParams.get("sortBy")
  const order = searchParams.get("order")
  if (
    sortBy &&
    order &&
    SORT_FIELDS.includes(sortBy as SortField) &&
    SORT_ORDERS.includes(order as SortOrder)
  ) {
    return { sortBy: sortBy as SortField, order: order as SortOrder }
  }
  return {}
}

function sortOptionValue(sort: Sort): string {
  return sort.sortBy && sort.order ? `${sort.sortBy}-${sort.order}` : "default"
}

function parseCategory(searchParams: URLSearchParams): string | undefined {
  return searchParams.get("category") ?? undefined
}

async function fetchProducts(
  skip: number,
  sort: Sort,
  category: string | undefined,
): Promise<ProductsResponse> {
  const base = category
    ? `https://dummyjson.com/products/category/${category}`
    : "https://dummyjson.com/products"
  let url = `${base}?limit=${PAGE_LIMIT}&skip=${skip}`
  if (sort.sortBy && sort.order) {
    url += `&sortBy=${sort.sortBy}&order=${sort.order}`
  }
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error("Failed to fetch products")
  }
  return (await response.json()) as ProductsResponse
}

async function fetchCategories(): Promise<string[]> {
  const response = await fetch("https://dummyjson.com/products/category-list")
  if (!response.ok) {
    throw new Error("Failed to fetch categories")
  }
  return (await response.json()) as string[]
}

export function ProductBrowser() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parsePage(searchParams.get("page"))
  const skip = (page - 1) * PAGE_LIMIT
  const sort = parseSort(searchParams)
  const category = parseCategory(searchParams)

  const { data, isPending, isFetching, isError, refetch } = useQuery({
    queryKey: ["products", { skip, limit: PAGE_LIMIT, category, ...sort }],
    queryFn: () => fetchProducts(skip, sort, category),
    placeholderData: keepPreviousData,
  })

  const { data: categoryList } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  })
  const categoryOptions = categoryList ?? (category ? [category] : [])

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_LIMIT)) : undefined

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
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set("page", "1")
      if (value === ALL_CATEGORIES_VALUE) {
        next.delete("category")
      } else {
        next.set("category", value)
      }
      return next
    })
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border px-4 py-3">
        <h1 className="text-lg font-semibold">Product Browser</h1>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-4">
        <div className="mb-4 flex items-center justify-end gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="category" className="text-sm text-muted-foreground">
              Category
            </label>
            <select
              id="category"
              aria-label="Category"
              value={category ?? ALL_CATEGORIES_VALUE}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="h-9 rounded-md border border-border bg-background px-2 text-sm"
            >
              <option value={ALL_CATEGORIES_VALUE}>All categories</option>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm text-muted-foreground">
              Sort
            </label>
            <select
              id="sort"
              aria-label="Sort by"
              value={sortOptionValue(sort)}
              onChange={(e) => handleSortChange(e.target.value)}
              className="h-9 rounded-md border border-border bg-background px-2 text-sm"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isPending && (
          <div className={PRODUCT_GRID_CLASSES}>
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton
                key={i}
                data-testid="product-skeleton"
                className="h-64 w-full rounded-lg"
              />
            ))}
          </div>
        )}

        {isError && (
          <div
            role="alert"
            className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-8 text-center"
          >
            <CircleAlert className="size-6 text-destructive" aria-hidden="true" />
            <p className="text-sm text-destructive">
              Couldn't load products. Please try again.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Retry
            </button>
          </div>
        )}

        {!isError && data && data.products.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No products found.
          </p>
        )}

        {!isError && data && data.products.length > 0 && (
          <div className={PRODUCT_GRID_CLASSES}>
            {data.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!isError && data && (
          <nav
            aria-label="Pagination"
            className="mt-6 flex items-center justify-center gap-3"
          >
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1 || isFetching}
              className="inline-flex h-11 items-center gap-1 rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={(totalPages !== undefined && page >= totalPages) || isFetching}
              className="inline-flex h-11 items-center gap-1 rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
            >
              Next
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </nav>
        )}
      </main>
    </div>
  )
}
