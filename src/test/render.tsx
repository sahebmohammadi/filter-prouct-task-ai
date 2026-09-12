import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@testing-library/react"
import type { ReactElement } from "react"
import { createMemoryRouter, RouterProvider } from "react-router"

export function renderWithQueryClient(
  ui: ReactElement,
  options: { client?: QueryClient; initialEntries?: string[] } = {},
) {
  const client =
    options.client ??
    new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  const router = createMemoryRouter([{ path: "/", element: ui }], {
    initialEntries: options.initialEntries ?? ["/"],
  })

  return {
    ...render(
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
    router,
    client,
  }
}
