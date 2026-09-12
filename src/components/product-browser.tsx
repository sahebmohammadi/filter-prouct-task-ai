import { useQuery } from "@tanstack/react-query"
import { CircleAlert, RefreshCw } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { Skeleton } from "@/components/ui/skeleton"
import type { ProductsResponse } from "@/lib/types"

const PRODUCT_GRID_CLASSES = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"

async function fetchProducts(): Promise<ProductsResponse> {
  const response = await fetch("https://dummyjson.com/products")
  if (!response.ok) {
    throw new Error("Failed to fetch products")
  }
  return (await response.json()) as ProductsResponse
}

export function ProductBrowser() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  })

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border px-4 py-3">
        <h1 className="text-lg font-semibold">Product Browser</h1>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-4">
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
      </main>
    </div>
  )
}
