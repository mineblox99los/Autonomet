# Design Standards for No Name Defined

## Component Standards
- **Spartan UI**: ALWAYS use components from `@spartan-ng/*` for base UI elements (buttons, inputs, cards, dialogs, etc.). Do NOT create raw HTML elements for standard UI components if a Spartan alternative exists.
- **UI Patterns**: ALWAYS prioritize and use the reusable patterns found in `src/app/ui-patterns/` to maintain architectural consistency. You MUST explore this directory to identify the most appropriate component for each functional need.
- **Design System Integration**: When requested to integrate components from a folder into the Design System (e.g., from `(alert)` or `(accordion)`), you MUST perform an exhaustive, 1-to-1 transposition. This includes ALL descriptive text, identical HTML structure, CSS classes (like `hlmP`, `hlmCode`), section IDs, and exact code snippets from example files. Never summarize, simplify, or shorten the content.

## Color System Standards
- **Backgrounds**: ALWAYS use the established surface hierarchy for dark theme:
  - `bg-studio`: Base application background.
  - `bg-surface-100`: First level content panels.
  - `bg-surface-200`: Nested content panels or cards.
  - `bg-surface-300`: Deepest level nested elements or high-contrast utility blocks.
  - `bg-alternative`: Deepest background for empty frames or contrast areas.
- **Grid & Table Standards**:
  - Grid Header: Use `bg-surface-200` with standard border.
  - Content Row: Use `bg-200` with `border-border-secondary`.
- **Border Standards**:
  - Standard Border: Default `--border` (10% white).
  - `border-border-secondary`: Subtle separation (6% white).
  - `border-border-stronger`: High contrast separation (20% white).
- **Strict Prohibition**: NEVER use hardcoded hex dark colors (like `#09090b`) or generic `bg-muted` for main panel structures. Stick to the `bg-surface-*` tokens.
