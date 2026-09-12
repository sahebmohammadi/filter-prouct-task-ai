# Product Browser

A small client-side app for searching, filtering, sorting, and paging through DummyJSON's product catalog. No accounts, no cart, no persisted state beyond the URL.

## Language

**Product**:
A catalog item from DummyJSON, shown as a card with thumbnail, title, category, price, and rating.
_Avoid_: Item, Listing

**Category**:
One of a fixed set of slugs from DummyJSON's category-list (e.g. `smartphones`, `mens-shirts`) used to scope the product list to a single group via the category endpoint.
_Avoid_: Tag, Type, Section

**Search Term**:
Free text matched against product titles via DummyJSON's search endpoint. Setting a Search Term clears the active Category.
_Avoid_: Query, Keyword

**Active Filter**:
The single dimension currently narrowing the product list: either a Search Term or a Category, never both. No Active Filter means all products are shown. Sort and Page are independent of the Active Filter and combine with it freely.
_Avoid_: Filter (ambiguous — Sort and Page also live in the URL but aren't part of this mutual-exclusivity rule)

**Browse State**:
The complete set of values (Active Filter, sort field/order, page) that determines what's currently shown. It lives entirely in the URL query string — no component holds a parallel copy.
_Avoid_: Filters, App State
