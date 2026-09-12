import { QueryClient } from "@tanstack/react-query"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { act } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ProductBrowser } from "@/components/product-browser"
import type { ProductsResponse } from "@/lib/types"
import { renderWithQueryClient } from "@/test/render"

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as Response
}

function productsPage(page: number, total = 40): ProductsResponse {
  const limit = 12
  const skip = (page - 1) * limit
  const count = Math.min(limit, Math.max(total - skip, 0))
  return {
    products: Array.from({ length: count }, (_, i) => ({
      id: skip + i + 1,
      title: `Product ${skip + i + 1}`,
      category: "beauty",
      price: 9.99,
      rating: 4,
      thumbnail: "https://cdn.dummyjson.com/products/images/1/thumbnail.png",
    })),
    total,
    skip,
    limit,
  }
}

function mockPaginatedFetch() {
  vi.mocked(fetch).mockImplementation(async (input) => {
    const url = new URL(String(input))
    const skip = Number(url.searchParams.get("skip"))
    return jsonResponse(productsPage(skip / 12 + 1))
  })
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn())
})

describe("ProductBrowser", () => {
  it("shows a skeleton grid while the product list is loading", () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}))

    renderWithQueryClient(<ProductBrowser />)

    expect(screen.getAllByTestId("product-skeleton").length).toBeGreaterThan(0)
  })

  it("renders product cards once the fetch succeeds", async () => {
    const products: ProductsResponse = {
      products: [
        {
          id: 1,
          title: "Essence Mascara Lash Princess",
          category: "beauty",
          price: 9.99,
          rating: 4.94,
          thumbnail: "https://cdn.dummyjson.com/products/images/1/thumbnail.png",
        },
        {
          id: 2,
          title: "Eyeshadow Palette with Mirror",
          category: "beauty",
          price: 19.99,
          rating: 3.28,
          thumbnail: "https://cdn.dummyjson.com/products/images/2/thumbnail.png",
        },
      ],
      total: 2,
      skip: 0,
      limit: 2,
    }
    vi.mocked(fetch).mockResolvedValue(jsonResponse(products))

    renderWithQueryClient(<ProductBrowser />)

    expect(
      await screen.findByText("Essence Mascara Lash Princess"),
    ).toBeInTheDocument()
    expect(screen.getByText("Eyeshadow Palette with Mirror")).toBeInTheDocument()
    expect(screen.getAllByText("beauty")).toHaveLength(2)
    expect(screen.getByText("$9.99")).toBeInTheDocument()
    expect(screen.getByText("$19.99")).toBeInTheDocument()
    expect(screen.getByText("4.9")).toBeInTheDocument()
    expect(screen.getByText("3.3")).toBeInTheDocument()
    expect(
      screen.getByAltText("Essence Mascara Lash Princess"),
    ).toHaveAttribute(
      "src",
      "https://cdn.dummyjson.com/products/images/1/thumbnail.png",
    )
  })

  it("shows an inline error message with a retry action when the fetch fails", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network down"))

    renderWithQueryClient(<ProductBrowser />)

    expect(
      await screen.findByText(/couldn't load products/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /retry/i }),
    ).toBeInTheDocument()
  })

  it("re-fetches the product list when retry is clicked", async () => {
    const user = userEvent.setup()
    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(
        jsonResponse({
          products: [
            {
              id: 1,
              title: "Essence Mascara Lash Princess",
              category: "beauty",
              price: 9.99,
              rating: 4.94,
              thumbnail:
                "https://cdn.dummyjson.com/products/images/1/thumbnail.png",
            },
          ],
          total: 1,
          skip: 0,
          limit: 1,
        }),
      )

    renderWithQueryClient(<ProductBrowser />)

    await screen.findByRole("button", { name: /retry/i })
    await user.click(screen.getByRole("button", { name: /retry/i }))

    expect(
      await screen.findByText("Essence Mascara Lash Princess"),
    ).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it("replaces stale products with the error banner when a background refetch fails", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({
          products: [
            {
              id: 1,
              title: "Essence Mascara Lash Princess",
              category: "beauty",
              price: 9.99,
              rating: 4.94,
              thumbnail:
                "https://cdn.dummyjson.com/products/images/1/thumbnail.png",
            },
          ],
          total: 1,
          skip: 0,
          limit: 1,
        }),
      )
      .mockRejectedValueOnce(new Error("network down"))

    renderWithQueryClient(<ProductBrowser />, { client })

    await screen.findByText("Essence Mascara Lash Princess")

    await act(async () => {
      await client.refetchQueries({ queryKey: ["products"] })
    })

    expect(
      await screen.findByText(/couldn't load products/i),
    ).toBeInTheDocument()
    expect(
      screen.queryByText("Essence Mascara Lash Princess"),
    ).not.toBeInTheDocument()
  })

  it("shows a 'No products found' message when the response has zero products", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ products: [], total: 0, skip: 0, limit: 0 }),
    )

    renderWithQueryClient(<ProductBrowser />)

    expect(await screen.findByText(/no products found/i)).toBeInTheDocument()
  })
})

describe("ProductBrowser pagination", () => {
  it("fetches the first page with skip=0 and limit=12 by default", async () => {
    mockPaginatedFetch()

    renderWithQueryClient(<ProductBrowser />)

    await screen.findByText("Product 1")
    expect(fetch).toHaveBeenCalledWith(
      "https://dummyjson.com/products?limit=12&skip=0",
    )
    expect(screen.getByText("Page 1 of 4")).toBeInTheDocument()
  })

  it("navigating to page 2 sets ?page=2 in the URL and fetches with skip=12", async () => {
    const user = userEvent.setup()
    mockPaginatedFetch()

    const { router } = renderWithQueryClient(<ProductBrowser />)

    await screen.findByText("Product 1")
    await user.click(screen.getByRole("button", { name: /next/i }))

    await screen.findByText("Product 13")
    expect(router.state.location.search).toBe("?page=2")
    expect(fetch).toHaveBeenLastCalledWith(
      "https://dummyjson.com/products?limit=12&skip=12",
    )
  })

  it("shows page N directly when a URL with ?page=N is opened", async () => {
    mockPaginatedFetch()

    renderWithQueryClient(<ProductBrowser />, { initialEntries: ["/?page=3"] })

    await screen.findByText("Product 25")
    expect(fetch).toHaveBeenCalledWith(
      "https://dummyjson.com/products?limit=12&skip=24",
    )
    expect(screen.getByText("Page 3 of 4")).toBeInTheDocument()
  })

  it("returns to the previous page's view when navigating back", async () => {
    const user = userEvent.setup()
    mockPaginatedFetch()

    const { router } = renderWithQueryClient(<ProductBrowser />)

    await screen.findByText("Product 1")
    await user.click(screen.getByRole("button", { name: /next/i }))
    await screen.findByText("Product 13")

    act(() => {
      router.navigate(-1)
    })

    await screen.findByText("Product 1")
    expect(router.state.location.search).toBe("")
  })

  it("disables Previous on the first page and Next on the last page", async () => {
    mockPaginatedFetch()

    renderWithQueryClient(<ProductBrowser />, { initialEntries: ["/?page=4"] })

    await screen.findByText("Page 4 of 4")
    expect(screen.getByRole("button", { name: /previous/i })).toBeEnabled()
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled()
  })
})
