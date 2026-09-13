import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

// 44px: page controls must stay usable one-handed on a phone (issue #4).
const PAGE_BUTTON_CLASSES = "h-11"

interface ProductPaginationProps {
  page: number
  totalPages: number | undefined
  isFetching: boolean
  onPageChange: (page: number) => void
}

export function ProductPagination({
  page,
  totalPages,
  isFetching,
  onPageChange,
}: ProductPaginationProps) {
  return (
    <Pagination className="mt-6">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isFetching}
            className={PAGE_BUTTON_CLASSES}
          />
        </PaginationItem>
        <PaginationItem className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(page + 1)}
            disabled={(totalPages !== undefined && page >= totalPages) || isFetching}
            className={PAGE_BUTTON_CLASSES}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
