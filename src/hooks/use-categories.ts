import { useQuery } from "@tanstack/react-query"

async function fetchCategories(): Promise<string[]> {
  const response = await fetch("https://dummyjson.com/products/category-list")
  if (!response.ok) {
    throw new Error("Failed to fetch categories")
  }
  return (await response.json()) as string[]
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  })
}
