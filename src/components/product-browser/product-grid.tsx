import { CircleAlert, RefreshCw } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { Product } from "@/lib/types"

const PRODUCT_GRID_CLASSES = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"

interface ProductGridProps {
  products: Product[] | undefined
  isPending: boolean
  isError: boolean
  onRetry: () => void
}

export function ProductGrid({
  products,
  isPending,
  isError,
  onRetry,
}: ProductGridProps) {
  if (isPending) {
    return (
      <div className={PRODUCT_GRID_CLASSES}>
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} data-testid="product-skeleton" className="h-64 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-8 text-center"
      >
        <CircleAlert className="size-6 text-destructive" aria-hidden="true" />
        <p className="text-sm text-destructive">Couldn't load products. Please try again.</p>
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw aria-hidden="true" />
          Retry
        </Button>
      </div>
    )
  }

  if (!products) {
    return null
  }

  if (products.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">No products found.</p>
    )
  }

  return (
    <div className={PRODUCT_GRID_CLASSES}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
