# shadcn primitives back the Browse State controls

The category/sort dropdowns and the search box are built on shadcn components (`Select`, `Input`, `Button`, `Pagination`) rather than hand-styled native elements, so the filter bar inherits one design system instead of three copies of the same Tailwind class string. This project's shadcn flavor is `base-nova`, built on Base UI — not Radix.

The category and sort controls share a single `LabeledSelect` wrapper; both were previously duplicated `<select>` markup.

**Consequences**: shadcn's `Select` is a listbox popup, not a native `<select>`. Tests can no longer drive it with `userEvent.selectOptions` or assert `toHaveValue` — they open the trigger and click an option (see the `chooseOption` helper in `product-browser.test.tsx`) and assert the trigger's `toHaveTextContent`. The trigger still exposes `role="combobox"` with its label as the accessible name, so queries are unchanged. Base UI's popup also needs jsdom polyfills (`matchMedia`, `ResizeObserver`, pointer capture, `scrollIntoView`) in `src/test/setup.ts`.

`Pagination`'s `Previous`/`Next` were changed from shadcn's default `<a>` to real `<button>`s: this pagination is callback-driven rather than href-driven, and anchors have no meaningful disabled state. The numbered-page pieces (`PaginationLink`, `PaginationEllipsis`) were dropped — the UI is Previous/Next only.
