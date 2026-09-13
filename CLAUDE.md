## Code structure

Three layers, kept separate. Add new code to the layer that matches; don't blur them.

- **`src/hooks/`** — data and state, no JSX. `use-products.ts` and `use-categories.ts` each own their fetch function and wrap `useQuery`; values tied to a query (`PAGE_LIMIT`, the `Sort` types and guards) live with it. `use-browse-state.ts` owns all Browse State: URL parsing, the search debounce, and the filter handlers. ADRs 0001 and 0002 are enforced here, not in components — no component touches `useSearchParams` itself.
- **`src/components/ui/`** — reusable presentational primitives, added with the `shadcn` CLI (the `base-nova` flavor, built on Base UI — not Radix). Never import from `hooks/`; never mention products, categories, or Browse State. `LabeledSelect` and `LabeledInput` are the shared label+control wrappers: use `LabeledSelect` for any dropdown rather than composing `Select` inline.
- **`src/components/product-browser/`** — feature components. `index.tsx` is the only one that calls hooks; `filter-bar.tsx`, `product-grid.tsx`, and `product-pagination.tsx` take props and render, nothing else.

### Rules

- Every control is a shadcn component. No native `<select>`/`<input>`, no hand-styled Tailwind copy of one.
- `sm:` is this project's breakpoint: below it controls stack full width, from `sm:` up they sit inline in a row. That layout lives once in `LabeledInput` / `LabeledSelect` — don't reimplement it per control.
- Repeated class strings get a named constant at the top of the file (`PRODUCT_GRID_CLASSES`), not a copy per element.
- Tests drive the whole feature through `ProductBrowser` (`src/components/product-browser.test.tsx`), not the leaf components.

### Two gotchas

- `npx shadcn add <component>` also rewrites existing files whose markup matches the component it added. Check `git status` after running it and revert edits you didn't ask for.
- The category/sort dropdowns are listbox popups, not native `<select>`s, so tests open the trigger and click an option via the `chooseOption` helper. Base UI's popup also needs the jsdom polyfills in `src/test/setup.ts`. See `docs/adr/0003-shadcn-primitives-for-browse-controls.md`.

## Agent skills

### Issue tracker

Issues are tracked as GitHub issues via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.
