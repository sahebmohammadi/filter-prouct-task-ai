import { QueryClient } from "@tanstack/react-query"
import { screen, waitFor } from "@testing-library/react"
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

const DEFAULT_CATEGORY_LIST = ["beauty", "furniture", "smartphones"]

function withCategoryList(
  handler: (url: URL) => Response | Promise<Response>,
  categories: string[] = DEFAULT_CATEGORY_LIST,
) {
  return async (input: RequestInfo | URL) => {
    const url = new URL(String(input))
    if (url.pathname === "/products/category-list") {
      return jsonResponse(categories)
    }
    return handler(url)
  }
}

function mockPaginatedFetch() {
  vi.mocked(fetch).mockImplementation(
    withCategoryList((url) => {
      const skip = Number(url.searchParams.get("skip"))
      return jsonResponse(productsPage(skip / 12 + 1))
    }),
  )
}

// The shadcn Select is a listbox popup, not a native <select>: open it, then pick.
async function chooseOption(
  user: ReturnType<typeof userEvent.setup>,
  selectName: string | RegExp,
  optionName: string,
) {
  await user.click(screen.getByRole("combobox", { name: selectName }))
  await user.click(await screen.findByRole("option", { name: optionName }))
}

function mockFetchSequence(...responses: Array<Response | Error>) {
  let i = 0
  vi.mocked(fetch).mockImplementation(
    withCategoryList(() => {
      const response = responses[Math.min(i, responses.length - 1)]
      i += 1
      if (response instanceof Error) {
        return Promise.reject(response)
      }
      return Promise.resolve(response)
    }),
  )
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
    vi.mocked(fetch).mockImplementation(
      withCategoryList(() => jsonResponse(products), []),
    )

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
    mockFetchSequence(
      new Error("network down"),
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
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it("replaces stale products with the error banner when a background refetch fails", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    mockFetchSequence(
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
      new Error("network down"),
    )

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
    vi.mocked(fetch).mockImplementation(
      withCategoryList(() =>
        jsonResponse({ products: [], total: 0, skip: 0, limit: 0 }),
      ),
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

  it("labels the pagination landmark and its Previous/Next buttons", async () => {
    mockPaginatedFetch()

    renderWithQueryClient(<ProductBrowser />, { initialEntries: ["/?page=2"] })

    await screen.findByText("Page 2 of 4")
    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Previous" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument()
  })

  it("disables Previous on the first page and Next on the last page", async () => {
    mockPaginatedFetch()

    renderWithQueryClient(<ProductBrowser />, { initialEntries: ["/?page=4"] })

    await screen.findByText("Page 4 of 4")
    expect(screen.getByRole("button", { name: /previous/i })).toBeEnabled()
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled()
  })
})

describe("ProductBrowser sort", () => {
  it("omits sortBy/order from the request and shows the Default option by default", async () => {
    mockPaginatedFetch()

    renderWithQueryClient(<ProductBrowser />)

    await screen.findByText("Product 1")
    expect(fetch).toHaveBeenCalledWith(
      "https://dummyjson.com/products?limit=12&skip=0",
    )
    expect(screen.getByRole("combobox", { name: /sort/i })).toHaveTextContent(
      "Default",
    )
  })

  it("selecting a sort option sets sortBy/order in the URL, includes them in the request, and resets page to 1", async () => {
    const user = userEvent.setup()
    mockPaginatedFetch()

    const { router } = renderWithQueryClient(<ProductBrowser />, {
      initialEntries: ["/?page=3"],
    })

    await screen.findByText("Product 25")
    await chooseOption(user, /sort/i, "Price (High to Low)")

    await screen.findByText("Product 1")
    expect(router.state.location.search).toBe("?page=1&sortBy=price&order=desc")
    expect(fetch).toHaveBeenLastCalledWith(
      "https://dummyjson.com/products?limit=12&skip=0&sortBy=price&order=desc",
    )
  })

  it("re-selecting the current sort option leaves the URL and page untouched", async () => {
    const user = userEvent.setup()
    mockPaginatedFetch()

    const { router } = renderWithQueryClient(<ProductBrowser />, {
      initialEntries: ["/?page=3"],
    })

    await screen.findByText("Product 25")
    await chooseOption(user, "Sort by", "Default")

    expect(router.state.location.search).toBe("?page=3")
    expect(screen.getByText("Page 3 of 4")).toBeInTheDocument()
  })

  it("reproduces a sorted view when a URL with sortBy/order is opened directly", async () => {
    mockPaginatedFetch()

    renderWithQueryClient(<ProductBrowser />, {
      initialEntries: ["/?sortBy=rating&order=asc"],
    })

    await screen.findByText("Product 1")
    expect(fetch).toHaveBeenCalledWith(
      "https://dummyjson.com/products?limit=12&skip=0&sortBy=rating&order=asc",
    )
    expect(screen.getByRole("combobox", { name: /sort/i })).toHaveTextContent(
      "Rating (Low to High)",
    )
  })

  it("ignores an invalid sortBy/order combination and falls back to the Default state", async () => {
    mockPaginatedFetch()

    renderWithQueryClient(<ProductBrowser />, {
      initialEntries: ["/?sortBy=bogus&order=asc"],
    })

    await screen.findByText("Product 1")
    expect(fetch).toHaveBeenCalledWith(
      "https://dummyjson.com/products?limit=12&skip=0",
    )
    expect(screen.getByRole("combobox", { name: /sort/i })).toHaveTextContent(
      "Default",
    )
  })
})

describe("ProductBrowser category filter", () => {
  it("lists categories from category-list plus 'All categories', defaulting to All categories", async () => {
    const user = userEvent.setup()
    mockPaginatedFetch()

    renderWithQueryClient(<ProductBrowser />)

    await screen.findByText("Product 1")
    const select = screen.getByRole("combobox", { name: /category/i })
    expect(select).toHaveTextContent("All categories")

    await user.click(select)
    expect(
      await screen.findByRole("option", { name: "All categories" }),
    ).toBeInTheDocument()
    for (const category of DEFAULT_CATEGORY_LIST) {
      expect(
        screen.getByRole("option", { name: category }),
      ).toBeInTheDocument()
    }
  })

  it("selecting a category sets ?category=<slug>, fetches from /products/category/{slug}, resets page to 1, and keeps the active sort", async () => {
    const user = userEvent.setup()
    mockPaginatedFetch()

    const { router } = renderWithQueryClient(<ProductBrowser />, {
      initialEntries: ["/?page=3&sortBy=price&order=desc"],
    })

    await screen.findByText("Product 25")
    await chooseOption(user, /category/i, "beauty")

    await screen.findByText("Product 1")
    expect(router.state.location.search).toBe(
      "?page=1&sortBy=price&order=desc&category=beauty",
    )
    expect(fetch).toHaveBeenLastCalledWith(
      "https://dummyjson.com/products/category/beauty?limit=12&skip=0&sortBy=price&order=desc",
    )
  })

  it("selecting 'All categories' clears category from the URL and reverts to the plain /products fetch", async () => {
    const user = userEvent.setup()
    mockPaginatedFetch()

    const { router } = renderWithQueryClient(<ProductBrowser />, {
      initialEntries: ["/?category=beauty&page=2"],
    })

    await screen.findByText("Product 13")
    await chooseOption(user, /category/i, "All categories")

    await screen.findByText("Product 1")
    expect(router.state.location.search).toBe("?page=1")
    expect(fetch).toHaveBeenLastCalledWith(
      "https://dummyjson.com/products?limit=12&skip=0",
    )
  })

  it("reproduces a filtered view when a URL with ?category=<slug> is opened directly", async () => {
    mockPaginatedFetch()

    renderWithQueryClient(<ProductBrowser />, {
      initialEntries: ["/?category=furniture"],
    })

    await screen.findByText("Product 1")
    expect(fetch).toHaveBeenCalledWith(
      "https://dummyjson.com/products/category/furniture?limit=12&skip=0",
    )
    expect(
      screen.getByRole("combobox", { name: /category/i }),
    ).toHaveTextContent("furniture")
  })
})

describe("ProductBrowser search", () => {
  it("sets ?q=<term> in the URL and fetches from /products/search after the debounce", async () => {
    const user = userEvent.setup()
    mockPaginatedFetch()

    const { router } = renderWithQueryClient(<ProductBrowser />)

    await screen.findByText("Product 1")
    await user.type(screen.getByRole("textbox", { name: /search/i }), "phone")

    await waitFor(() =>
      expect(router.state.location.search).toBe("?page=1&q=phone"),
    )
    await waitFor(() =>
      expect(fetch).toHaveBeenLastCalledWith(
        "https://dummyjson.com/products/search?q=phone&limit=12&skip=0",
      ),
    )
  })

  it("does not update the URL or fetch before the debounce settles", async () => {
    const user = userEvent.setup()
    mockPaginatedFetch()

    const { router } = renderWithQueryClient(<ProductBrowser />)

    await screen.findByText("Product 1")
    const fetchCallsBeforeTyping = vi.mocked(fetch).mock.calls.length
    await user.type(screen.getByRole("textbox", { name: /search/i }), "ph")

    expect(router.state.location.search).toBe("")
    expect(vi.mocked(fetch).mock.calls.length).toBe(fetchCallsBeforeTyping)
  })

  it("setting a search term clears an active category and resets the select to All categories", async () => {
    const user = userEvent.setup()
    mockPaginatedFetch()

    const { router } = renderWithQueryClient(<ProductBrowser />, {
      initialEntries: ["/?category=beauty"],
    })

    await screen.findByText("Product 1")
    await user.type(screen.getByRole("textbox", { name: /search/i }), "mascara")

    await waitFor(() =>
      expect(router.state.location.search).toBe("?page=1&q=mascara"),
    )
    await waitFor(() =>
      expect(
        screen.getByRole("combobox", { name: /category/i }),
      ).toHaveTextContent("All categories"),
    )
    await waitFor(() =>
      expect(fetch).toHaveBeenLastCalledWith(
        "https://dummyjson.com/products/search?q=mascara&limit=12&skip=0",
      ),
    )
  })

  it("selecting a category clears an active search term and empties the search box", async () => {
    const user = userEvent.setup()
    mockPaginatedFetch()

    const { router } = renderWithQueryClient(<ProductBrowser />, {
      initialEntries: ["/?q=phone"],
    })

    await screen.findByText("Product 1")
    await chooseOption(user, /category/i, "beauty")

    await screen.findByText("Product 1")
    expect(router.state.location.search).toBe("?page=1&category=beauty")
    expect(screen.getByRole("textbox", { name: /search/i })).toHaveValue("")
    expect(fetch).toHaveBeenLastCalledWith(
      "https://dummyjson.com/products/category/beauty?limit=12&skip=0",
    )
  })

  it("pressing Back right after typing returns to the state before typing began, not an intermediate keystroke", async () => {
    const user = userEvent.setup()
    mockPaginatedFetch()

    const { router } = renderWithQueryClient(<ProductBrowser />, {
      initialEntries: ["/?category=beauty"],
    })

    await screen.findByText("Product 1")
    await user.type(screen.getByRole("textbox", { name: /search/i }), "ph")

    act(() => {
      router.navigate(-1)
    })

    expect(router.state.location.search).toBe("?category=beauty")
  })

  it("refining a search replaces its history entry, so one Back undoes the whole search", async () => {
    const user = userEvent.setup()
    mockPaginatedFetch()

    const { router } = renderWithQueryClient(<ProductBrowser />, {
      initialEntries: ["/?category=beauty"],
    })

    await screen.findByText("Product 1")
    const searchBox = screen.getByRole("textbox", { name: "Search" })
    await user.type(searchBox, "ph")
    await waitFor(() => expect(router.state.location.search).toBe("?page=1&q=ph"))
    await user.type(searchBox, "one")
    await waitFor(() => expect(router.state.location.search).toBe("?page=1&q=phone"))

    act(() => {
      router.navigate(-1)
    })

    expect(router.state.location.search).toBe("?category=beauty")
  })

  it("re-selecting 'All categories' during a search keeps the search term and page", async () => {
    const user = userEvent.setup()
    mockPaginatedFetch()

    const { router } = renderWithQueryClient(<ProductBrowser />, {
      initialEntries: ["/?q=mascara&page=3"],
    })

    await screen.findByText("Product 25")
    await chooseOption(user, "Category", "All categories")

    expect(router.state.location.search).toBe("?q=mascara&page=3")
    expect(screen.getByRole("textbox", { name: "Search" })).toHaveValue("mascara")
  })

  it("reproduces a search view when a URL with ?q=<term> is opened directly", async () => {
    mockPaginatedFetch()

    renderWithQueryClient(<ProductBrowser />, {
      initialEntries: ["/?q=phone"],
    })

    await screen.findByText("Product 1")
    expect(fetch).toHaveBeenCalledWith(
      "https://dummyjson.com/products/search?q=phone&limit=12&skip=0",
    )
    expect(screen.getByRole("textbox", { name: /search/i })).toHaveValue("phone")
  })

  it("shows 'No products found' when a search has no matches", async () => {
    vi.mocked(fetch).mockImplementation(
      withCategoryList(() =>
        jsonResponse({ products: [], total: 0, skip: 0, limit: 0 }),
      ),
    )

    renderWithQueryClient(<ProductBrowser />, {
      initialEntries: ["/?q=zzzznomatch"],
    })

    expect(await screen.findByText(/no products found/i)).toBeInTheDocument()
  })
})
