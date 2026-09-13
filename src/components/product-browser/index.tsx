import { FilterBar } from "@/components/product-browser/filter-bar"
import { ProductGrid } from "@/components/product-browser/product-grid"
import { ProductPagination } from "@/components/product-browser/product-pagination"
import { useBrowseState } from "@/hooks/use-browse-state"
import { useCategories } from "@/hooks/use-categories"
import { PAGE_LIMIT, useProducts } from "@/hooks/use-products"

export function ProductBrowser() {
  const {
    page,
    skip,
    sort,
    category,
    q,
    searchInput,
    sortValue,
    categoryValue,
    goToPage,
    handleSortChange,
    handleCategoryChange,
    handleSearchChange,
  } = useBrowseState()

  const { data, isPending, isFetching, isError, refetch } = useProducts({
    skip,
    sort,
    category,
    q,
  })
  const { data: categoryList } = useCategories()

  const categoryOptions = categoryList ?? (category ? [category] : [])
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_LIMIT)) : undefined

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border px-4 py-3">
        <h1 className="text-lg font-semibold">Product Browser</h1>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-4">
        <FilterBar
          searchInput={searchInput}
          categoryValue={categoryValue}
          categoryOptions={categoryOptions}
          sortValue={sortValue}
          onSearchChange={handleSearchChange}
          onCategoryChange={handleCategoryChange}
          onSortChange={handleSortChange}
        />

        <ProductGrid
          products={isError ? undefined : data?.products}
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
