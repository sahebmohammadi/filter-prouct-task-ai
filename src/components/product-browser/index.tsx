import { BrowseControls } from "@/components/product-browser/browse-controls"
import { ProductGrid } from "@/components/product-browser/product-grid"
import { ProductPagination } from "@/components/product-browser/product-pagination"
import type { SelectOption } from "@/components/ui/labeled-select"
import { ALL_CATEGORIES_VALUE, SORT_OPTIONS, useBrowseState } from "@/hooks/use-browse-state"
import { useCategories } from "@/hooks/use-categories"
import { PAGE_LIMIT, useProducts } from "@/hooks/use-products"

export function ProductBrowser() {
  const {
    page,
    productQuery,
    searchInput,
    sortValue,
    categoryValue,
    goToPage,
    handleSortChange,
    handleCategoryChange,
    handleSearchChange,
  } = useBrowseState()

  const { data, isPending, isFetching, isError, refetch } = useProducts(productQuery)
  const { data: categoryList } = useCategories()

  const { category } = productQuery
  const categoryOptions: SelectOption[] = [
    { value: ALL_CATEGORIES_VALUE, label: "All categories" },
    ...(categoryList ?? (category ? [category] : [])).map((slug) => ({
      value: slug,
      label: slug,
    })),
  ]
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_LIMIT)) : undefined

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border px-4 py-3">
        <h1 className="text-lg font-semibold">Product Browser</h1>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-4">
        <BrowseControls
          searchInput={searchInput}
          categoryValue={categoryValue}
          categoryOptions={categoryOptions}
          sortValue={sortValue}
          sortOptions={SORT_OPTIONS}
          onSearchChange={handleSearchChange}
          onCategoryChange={handleCategoryChange}
          onSortChange={handleSortChange}
        />

        <ProductGrid
          products={data?.products}
          isPending={isPending}
          isError={isError}
          onRetry={() => refetch()}
        />

        {!isError && data && (
          <ProductPagination
            page={page}
            totalPages={totalPages}
            isFetching={isFetching}
            onPageChange={goToPage}
          />
        )}
      </main>
    </div>
  )
}
