# Search and category are mutually exclusive

DummyJSON's search endpoint ignores a `category` param and its category endpoint ignores a `q` param (confirmed live) — there is no server-side way to apply both at once, and client-side filtering is disallowed. We decided that setting a Search Term clears the active Category and vice versa, so the URL only ever carries one Active Filter, rather than letting both sit in the URL with one silently taking precedence (e.g. search wins, category shown disabled) — a control that looks selected but does nothing is worse on a one-handed mobile layout than one that visibly resets.

**Consequences**: the category select and search input must be wired to clear each other on change; there is no UI state where both display as active.
