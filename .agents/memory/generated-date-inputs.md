---
name: Generated date inputs
description: The type boundary between OpenAPI-generated date inputs and Drizzle SQL date columns.
---

OpenAPI-generated React/Zod inputs for date fields may be JavaScript `Date` values even when the database column is a string-backed SQL date.

**Why:** The generated client and the Drizzle schema represent the same date differently, so spreading parsed request data directly into an insert or update can fail typechecking or produce inconsistent writes.

**How to apply:** Normalize dates to `YYYY-MM-DD` at the API route boundary before passing values to Drizzle.