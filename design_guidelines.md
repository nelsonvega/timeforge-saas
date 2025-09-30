# Design Guidelines: Multi-Tenant Time Tracking System

## Design Approach

**Selected Framework:** Design System Approach with Linear and Material Design inspiration

**Justification:** As a productivity-focused SaaS platform with data-dense interfaces (dashboards, tables, reports, time entries), this application prioritizes efficiency, clarity, and professional credibility over visual experimentation. Drawing from Linear's clean aesthetic and Material Design's systematic approach ensures scalability across complex multi-tenant workflows.

**Key Design Principles:**
1. Information clarity over decoration
2. Efficient task completion through predictable patterns
3. Professional, trustworthy appearance for B2B users
4. Consistent hierarchy across tenant boundaries

---

## Core Design Elements

### A. Color Palette

**Light Mode:**
- Primary: 220 90% 56% (Professional blue for CTAs, active states)
- Neutral Base: 220 14% 96% (Background)
- Neutral Surface: 0 0% 100% (Cards, panels)
- Neutral Border: 220 13% 91%
- Text Primary: 220 9% 15%
- Text Secondary: 220 9% 46%
- Success: 142 76% 36% (Approved time, positive metrics)
- Warning: 38 92% 50% (Budget warnings)
- Error: 0 84% 60% (Rejected entries, overruns)

**Dark Mode:**
- Primary: 220 90% 56% (Unchanged for consistency)
- Neutral Base: 222 47% 11% (Background)
- Neutral Surface: 217 33% 17% (Cards, panels)
- Neutral Border: 217 20% 24%
- Text Primary: 210 20% 98%
- Text Secondary: 215 16% 65%
- Success: 142 71% 45%
- Warning: 38 100% 60%
- Error: 0 72% 65%

**Usage Strategy:**
- Minimal accent colors - rely on neutral scale for 90% of interface
- Primary blue reserved for actionable elements only
- Status colors (success/warning/error) for data visualization and feedback

### B. Typography

**Font Families:**
- Primary: 'Inter' (Google Fonts) - UI elements, body text, data tables
- Monospace: 'JetBrains Mono' (Google Fonts) - Time displays, numeric data

**Type Scale:**
- Headings: text-2xl (30px) font-semibold for page titles
- Section Headers: text-lg (18px) font-semibold
- Body: text-sm (14px) regular - default for all interfaces
- Small: text-xs (12px) - metadata, table headers, secondary info
- Monospace Time: text-base (16px) - timer displays, duration fields

**Line Heights:** Use tight leading (leading-tight) for headings, normal (leading-normal) for body content

### C. Layout System

**Spacing Primitives:** Use Tailwind units of **2, 4, 6, and 8** consistently
- Component padding: p-4 (buttons, cards)
- Section spacing: space-y-6 between major sections
- Page margins: p-8 for main content areas
- Gaps: gap-4 for grids, gap-2 for tight groupings

**Grid System:**
- Dashboards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 for metric cards
- Data tables: Full-width with responsive horizontal scroll
- Forms: max-w-2xl centered with single column on mobile, 2-column on desktop
- Sidebar navigation: Fixed 256px width on desktop, slide-over on mobile

### D. Component Library

**Navigation:**
- Sidebar: Fixed left navigation with collapsible sections (Clients, Projects, Users, Reports, Settings)
- Top bar: Tenant switcher (for super admins), user profile, quick timer widget
- Breadcrumbs: Show current location in nested views (Client > Project > Time Entries)

**Core UI Elements:**
- Buttons: Solid primary, ghost secondary, outline tertiary; consistent h-9 height
- Input fields: Border on all sides with focus ring, consistent h-10 height
- Cards: Rounded corners (rounded-lg), subtle shadow (shadow-sm), white/surface background
- Tables: Striped rows, sticky headers, sortable columns, row hover states
- Tabs: Underline style for section switching (Active Projects vs Archived)

**Data Displays:**
- Metric cards: Large number with label, trend indicator (up/down arrow with percentage)
- Time duration: Monospace font with HH:MM:SS format, prominent display
- Status badges: Rounded full with colored background (Active: green, Pending: yellow, Rejected: red)
- Progress bars: For budget utilization, thin height with percentage label

**Forms:**
- Grouped fields with consistent spacing
- Inline validation with error messages below fields
- Required field indicators (asterisk)
- Submit actions right-aligned

**Modals/Overlays:**
- Centered modal for create/edit actions (max-w-2xl)
- Slide-over panel for quick views and filters (from right)
- Toast notifications: Top-right corner, auto-dismiss after 4s

### E. Key Interface Patterns

**Dashboard Layout:**
- Hero metrics row: 4 cards showing Total Hours, Billable %, Active Projects, Team Utilization
- Time tracking widget: Prominent "Start Timer" button with recent tasks list
- Recent activity table: Last 10 time entries with approve/reject actions
- Charts section: 2-column grid with Time Distribution (pie) and Weekly Trend (line)

**Time Tracking Interface:**
- Timer: Large central display with start/stop button, project/task selector above
- Manual entry form: Date picker, duration input, project dropdown, notes textarea, billable toggle
- Entry list: Table with columns: Date, Project, Task, Duration, Status, Actions (Edit/Delete)

**Project Management:**
- Project cards in grid view: Show client, active users, hours logged, budget progress bar
- Detail view: Tabbed interface (Overview, Assigned Users, Time Entries, Reports)
- Assignment interface: Multi-select user list with role dropdown per user

**Client/Project Selectors:**
- Searchable dropdowns with client/project hierarchy
- Recent items at top for quick access
- "Create new" option at bottom

### F. Responsive Behavior

**Mobile (< 768px):**
- Hamburger menu for navigation
- Single-column layouts throughout
- Swipe actions on table rows (instead of action buttons)
- Bottom-fixed timer controls

**Desktop (≥ 1024px):**
- Persistent sidebar navigation
- Multi-column dashboards and forms
- Hover interactions enabled
- Keyboard shortcuts for common actions

---

## Images

**No hero images** - This is a data-focused productivity application where screen real estate is valuable for functional content. All visual elements should serve utilitarian purposes:
- User avatars (generated initials with colored backgrounds)
- Company logos in tenant switcher
- Empty state illustrations for zero-data scenarios (simple line art, not photographs)
- Chart/graph visualizations for data representation