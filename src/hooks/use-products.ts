import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { ProductsResponse } from "@/lib/types"

export const PAGE_LIMIT = 12

const SORT_FIELDS = ["title", "price", "rating"] as const
export type SortField = (typeof SORT_FIELDS)[number]
const SORT_ORDERS = ["asc", "desc"] as const
export type SortOrder = (typeof SORT_ORDERS)[number]

export interface Sort {
  sortBy?: SortField
  order?: SortOrder
}

export function isSortField(value: string): value is SortField {
  return (SORT_FIELDS as readonly string[]).includes(value)
}

export function isSortOrder(value: string): value is SortOrder {
  return (SORT_ORDERS as readonly string[]).includes(value)
}

export interface ProductQuery {
  skip: number
  sort: Sort
  category: string | undefined
  searchTerm: string
}

async function fetchProducts({
  skip,
  sort,
  category,
  searchTerm,
}: ProductQuery): Promise<ProductsResponse> {
  const base = searchTerm
    ? "https://dummyjson.com/products/search"
    : category
      ? `https://dummyjson.com/products/category/${category}`
      : "https://dummyjson.com/products"
  let url = searchTerm
    ? `${base}?q=${encodeURIComponent(searchTerm)}&limit=${PAGE_LIMIT}&skip=${skip}`
    : `${base}?limit=${PAGE_LIMIT}&skip=${skip}`
  if (sort.sortBy && sort.order) {
    url += `&sortBy=${sort.sortBy}&order=${sort.order}`
  }
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error("Failed to fetch products")
  }
  return (await response.json()) as ProductsResponse
}

export function useProducts(query: ProductQuery) {
  const { skip, sort, category, searchTerm } = query
  return useQuery({
    queryKey: ["products", { skip, limit: PAGE_LIMIT, category, searchTerm, ...sort }],
    queryFn: () => fetchProducts(query),
    placeholderData: keepPreviousData,
  })
}
