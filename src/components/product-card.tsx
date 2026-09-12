import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Product } from "@/lib/types"

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 text-card-foreground">
      <img
        src={product.thumbnail}
        alt={product.title}
        className="aspect-square w-full rounded-md object-cover"
      />
      <h3 className="line-clamp-2 text-sm font-medium">{product.title}</h3>
      <p className="text-xs capitalize text-muted-foreground">
        {product.category}
      </p>
      <p className="text-sm font-semibold">
        {currencyFormatter.format(product.price)}
      </p>
      <div
        className="flex items-center gap-1"
        aria-label={`Rating: ${product.rating.toFixed(1)} out of 5`}
      >
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            aria-hidden="true"
            className={cn(
              "size-3.5",
              i < Math.round(product.rating)
                ? "fill-primary text-primary"
                : "text-muted-foreground",
            )}
          />
        ))}
        <span className="ml-1 text-xs text-muted-foreground">
          {product.rating.toFixed(1)}
        </span>
      </div>
    </article>
  )
}
