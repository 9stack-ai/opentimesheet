# Design Guidelines — 9stimesheet

UI/UX standards and component library conventions for 9stimesheet.

---

## Design System Overview

**Tokens & Framework:**
- **Color:** Tailwind v4 (default palette: slate/gray for neutral, blue/red/green for semantic)
- **Typography:** System fonts (no custom web fonts; fast load)
- **Spacing:** Tailwind scale (4px increments: 1 = 4px, 2 = 8px, etc.)
- **Breakpoints:** Mobile-first (sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px)
- **Component Library:** shadcn/ui + Radix UI (accessible, unstyled base)
- **Icons:** Lucide React (consistent, 24x24 default)

---

## Color Palette

### Semantic Colors
| Usage | Tailwind Class | Hex | Notes |
|-------|----------------|-----|-------|
| Primary (CTA) | `bg-blue-600` `text-blue-600` | #2563eb | Links, buttons, focus |
| Success | `bg-green-600` `text-green-600` | #16a34a | Approved, done |
| Warning | `bg-amber-600` `text-amber-600` | #d97706 | Pending, caution |
| Danger | `bg-red-600` `text-red-600` | #dc2626 | Error, rejected, delete |
| Neutral (BG) | `bg-slate-50` `bg-slate-100` | #f8fafc | Card, section background |
| Neutral (Text) | `text-slate-900` `text-slate-600` | #0f172a | Body text, secondary |
| Neutral (Border) | `border-slate-200` `border-slate-300` | #e2e8f0 | Dividers, inputs |

### Dark Mode
- **Background:** `bg-slate-950` (deep navy, `#0f172a`)
- **Card:** `bg-slate-900` (lighter navy, `#0f172a`)
- **Text:** `text-slate-50` (off-white, `#f8fafc`)
- **Border:** `border-slate-700` (medium gray, `#334155`)
- **Next-themes:** Detects system preference; user can toggle via settings

---

## Typography

### Hierarchy

| Level | Use | Tailwind | Size | Weight |
|-------|-----|----------|------|--------|
| **H1** | Page title | `text-4xl font-bold` | 36px | 700 |
| **H2** | Section title | `text-2xl font-semibold` | 24px | 600 |
| **H3** | Subsection | `text-lg font-semibold` | 18px | 600 |
| **Body** | Default text | `text-base` | 16px | 400 |
| **Small** | Labels, helpers | `text-sm` | 14px | 400 |
| **Tiny** | Captions, muted | `text-xs` | 12px | 400 |
| **Mono** | Code, amounts | `font-mono text-sm` | 14px | 400 |

### Examples
```tsx
<h1 className="text-4xl font-bold">Timesheet</h1>
<h2 className="text-2xl font-semibold mt-6">Approvals</h2>
<p className="text-base text-slate-600">Description here</p>
<span className="text-xs text-slate-500">Helper text</span>
<code className="font-mono text-sm bg-slate-100 px-2 py-1">entry.id</code>
```

---

## Spacing & Layout

### Consistent Spacing Scale
```
1 = 4px    2 = 8px    3 = 12px   4 = 16px   6 = 24px
8 = 32px   10 = 40px  12 = 48px  16 = 64px  20 = 80px
```

### Page Layout
- **Top padding:** `pt-6` or `pt-8` (below nav)
- **Side padding:** `px-4` (mobile), `px-6` (tablet+)
- **Max width:** `max-w-7xl` for content (1280px)
- **Column gap:** `gap-4` or `gap-6` for grid layouts

**Example:**
```tsx
<main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
  {/* content */}
</main>
```

### Card & Container
- **Background:** `bg-white` (light) or `bg-slate-900` (dark)
- **Border:** `border border-slate-200` (light) or `border-slate-700` (dark)
- **Padding:** `p-4` or `p-6`
- **Rounded:** `rounded-lg` (8px, default)
- **Shadow:** `shadow-sm` (light) or none (dark)

```tsx
<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-6 shadow-sm">
  {/* content */}
</div>
```

---

## Components & Patterns

### Buttons

**Primary CTA (Actions)**
```tsx
<Button className="bg-blue-600 hover:bg-blue-700 text-white">
  Approve
</Button>
```

**Secondary (Alternative actions)**
```tsx
<Button variant="outline" className="border border-slate-300 text-slate-900">
  Cancel
</Button>
```

**Danger (Delete/Reject)**
```tsx
<Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white">
  Reject
</Button>
```

**Icon Button (Compact)**
```tsx
<Button variant="ghost" size="sm" className="p-2">
  <Trash2 className="w-4 h-4" />
</Button>
```

**Loading State**
```tsx
<SubmitButton disabled={isPending}>
  {isPending ? "Loading..." : "Submit"}
</SubmitButton>
```

### Form Inputs

**Text Input**
```tsx
<Input
  type="text"
  placeholder="Enter name"
  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
/>
```

**Select**
```tsx
<Select defaultValue="month">
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="week">Week</SelectItem>
    <SelectItem value="month">Month</SelectItem>
  </SelectContent>
</Select>
```

**Checkbox**
```tsx
<Checkbox id="approve" />
<label htmlFor="approve" className="text-sm font-medium">
  Approve this entry
</label>
```

**Date Input**
```tsx
<Input
  type="date"
  defaultValue="2026-06-22"
  className="px-3 py-2 border border-slate-300 rounded-md"
/>
```

### Data Tables

**Structure**
```tsx
<DataTable
  columns={columns}
  data={data}
  pageSize={50}
  sortBy={{ id: "date", desc: true }} // default sort
/>
```

**Column Definition** (in `*-columns.tsx`)
```typescript
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<TimeEntry>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => formatDate(row.getValue("date")),
  },
  {
    accessorKey: "hours",
    header: "Hours",
    cell: ({ row }) => `${row.getValue("hours")}h`,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
```

### Dialogs & Modals

**Create/Edit Dialog**
```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Add Entry</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create Time Entry</DialogTitle>
    </DialogHeader>
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <DialogFooter>
        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        <Button type="submit">Create</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

### Notifications (Toast)

**Success**
```typescript
import { toast } from "sonner";
toast.success("Entry approved");
```

**Error**
```typescript
toast.error("Failed to approve: " + error.message);
```

**Loading**
```typescript
const id = toast.loading("Processing...");
// later
toast.dismiss(id);
toast.success("Done");
```

### Charts (Recharts)

**Bar Chart**
```tsx
<BarChart width={500} height={300} data={data}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Bar dataKey="hours" fill="#2563eb" />
  <Bar dataKey="amount" fill="#16a34a" />
</BarChart>
```

**Line Chart (Time Series)**
```tsx
<LineChart width={500} height={300} data={data}>
  <CartesianGrid />
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Line type="monotone" dataKey="actualNet" stroke="#2563eb" />
  <Line type="monotone" dataKey="projectedNet" stroke="#16a34a" strokeDasharray="5 5" />
</LineChart>
```

---

## Accessibility (WCAG 2.1 AA)

### Keyboard Navigation
- All interactive elements must be focusable (buttons, links, inputs, selects)
- Tab order should follow logical flow (left-to-right, top-to-bottom)
- Use `:focus-visible` for keyboard focus ring (Tailwind: `focus:ring-2 focus:ring-offset-2`)
- Escape key closes dialogs, dropdowns

### Color Contrast
- Text on background: ≥4.5:1 ratio (AA standard)
- UI components (borders, icons): ≥3:1 ratio
- Never rely on color alone; use text labels or icons

**Example: Error State**
```tsx
<div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
  <p className="text-sm text-red-700">Error message here</p>
</div>
```

### Semantic HTML
- Use proper headings (`<h1>`, `<h2>`, etc.)
- Use `<button>` for buttons (not `<div onclick>`)
- Use `<label htmlFor="id">` for form labels
- Use `<table>` with `<thead>`, `<tbody>` for data tables
- Use `<nav>` for navigation regions

### ARIA Labels
```tsx
// Icon-only button
<Button
  variant="ghost"
  size="sm"
  aria-label="Edit this entry"
>
  <Edit className="w-4 h-4" />
</Button>

// Screen reader hidden text
<span className="sr-only">Last updated 2 hours ago</span>
```

---

## Dark Mode

**Implementation:** next-themes + Tailwind

**Markup Pattern:**
```tsx
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50">
  Content automatically adapts
</div>
```

**Colors to Update (per element):**
- Background: `bg-white` → `dark:bg-slate-900`
- Text: `text-slate-900` → `dark:text-slate-50`
- Border: `border-slate-200` → `dark:border-slate-700`
- Card: `shadow-sm` → `dark:shadow-none` (shadows often don't work well in dark)

**Example Card (Light + Dark):**
```tsx
<div className="
  bg-white dark:bg-slate-900
  border border-slate-200 dark:border-slate-700
  rounded-lg p-6 shadow-sm dark:shadow-none
">
  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
    Title
  </h3>
  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
    Description
  </p>
</div>
```

---

## Responsive Design

### Mobile-First Approach
- Design for mobile (320px) first
- Add breakpoints for larger screens
- Use Tailwind breakpoint prefixes: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`

**Example:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 1 column on mobile, 2 on tablet, 3 on desktop */}
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

### Common Patterns

**Full-Width on Mobile, Constrained on Desktop**
```tsx
<main className="w-full md:max-w-4xl md:mx-auto px-4 md:px-0">
  {/* content */}
</main>
```

**Stack Vertically on Mobile, Horizontal on Desktop**
```tsx
<div className="flex flex-col md:flex-row gap-4">
  <aside className="w-full md:w-48 flex-shrink-0">
    {/* sidebar */}
  </aside>
  <main className="flex-1">
    {/* content */}
  </main>
</div>
```

**Hide on Mobile, Show on Desktop**
```tsx
<div className="hidden md:block">
  {/* Only visible on tablet+ */}
</div>
```

---

## Naming & Class Organization

### CSS Class Order (Tailwind Convention)
```
1. Layout & display (flex, grid, block, hidden)
2. Sizing (w, h, max-w, max-h)
3. Spacing (p, m, gap)
4. Border & outline (border, rounded)
5. Background & text colors (bg, text)
6. Effects & transitions (shadow, opacity, hover)
7. State (dark:, md:, hover:, focus:)
```

**Example:**
```tsx
<div className="
  flex items-center justify-between
  w-full max-w-4xl
  px-6 py-4
  border border-slate-200 dark:border-slate-700
  rounded-lg
  bg-white dark:bg-slate-900
  shadow-sm dark:shadow-none
  hover:shadow-md hover:dark:shadow-none
  transition-shadow duration-200
">
  {/* content */}
</div>
```

---

## Component Library Usage

### shadcn/ui Components
Pre-installed and available (import from `@/components/ui`):

```tsx
// Examples of commonly used
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/data-table/data-table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
```

### Icons (Lucide React)
```tsx
import { Plus, Edit, Trash2, ChevronDown, CheckCircle, AlertCircle } from "lucide-react";

<Button>
  <Plus className="w-4 h-4 mr-2" />
  Add Entry
</Button>
```

---

## Layout Patterns

### Main App Layout
```tsx
<div className="flex h-screen flex-col md:flex-row">
  {/* Sidebar Navigation */}
  <aside className="w-full md:w-48 bg-slate-100 dark:bg-slate-900 border-b md:border-r">
    <Navigation />
  </aside>

  {/* Main Content */}
  <main className="flex-1 overflow-auto">
    <header className="sticky top-0 bg-white dark:bg-slate-900 border-b px-6 py-4">
      {/* Page title, breadcrumbs, actions */}
    </header>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Page content */}
    </div>
  </main>
</div>
```

### Card Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <Card key={item.id}>
      <CardHeader>
        <CardTitle>{item.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Details */}
      </CardContent>
    </Card>
  ))}
</div>
```

### Form Layout
```tsx
<form className="space-y-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <label htmlFor="name" className="block text-sm font-medium mb-2">
        Name
      </label>
      <Input id="name" type="text" placeholder="Enter name" />
    </div>
    <div>
      <label htmlFor="email" className="block text-sm font-medium mb-2">
        Email
      </label>
      <Input id="email" type="email" placeholder="Enter email" />
    </div>
  </div>

  <div className="flex justify-end gap-4">
    <Button variant="outline">Cancel</Button>
    <Button type="submit">Save</Button>
  </div>
</form>
```

---

## Vietnamese UI Localization

- **Date format:** DD/MM/YYYY (e.g., "22/06/2026")
- **Money format:** 1.234.567 ₫ (grouped by thousands, space before ₫)
- **Time format:** HH:mm (24-hour, e.g., "14:30")
- **Month names & day names:** Vietnamese (Tháng 1, T2 for Monday, etc.)
- **Button labels:** Common Vietnamese terms
  - Submit → "Gửi" or "Nộp"
  - Approve → "Duyệt" or "Phê duyệt"
  - Reject → "Từ chối"
  - Delete → "Xoá"
  - Cancel → "Huỷ"

**Example:**
```tsx
<div className="space-y-2">
  <p className="text-sm text-slate-600">
    Ngày: <span className="font-medium">{formatDate(entry.date)}</span>
  </p>
  <p className="text-sm text-slate-600">
    Số tiền: <span className="font-mono font-medium">{formatVnd(amount)}</span>
  </p>
</div>
```

---

## Accessibility Checklist

Before shipping a component:

- [ ] All interactive elements are keyboard-focusable
- [ ] Color contrast ≥4.5:1 for text, ≥3:1 for UI
- [ ] Icon-only buttons have aria-label or screen reader text
- [ ] Form inputs have associated `<label>` elements
- [ ] Dialogs can be closed with Escape key
- [ ] Focus is managed appropriately (dialog focus trap, etc.)
- [ ] Tables use semantic `<table>`, `<thead>`, `<tbody>`
- [ ] Responsive layout tested on mobile (320px), tablet (768px), desktop (1024px)

---

## Performance Considerations

- **Images:** Optimize with Next.js `<Image>` component
- **Fonts:** Use system fonts (no web font requests)
- **Animations:** Use `transition` classes (GPU-accelerated)
- **Code splitting:** Next.js does this automatically per route
- **Heavy components:** Lazy-load charts/tables if below fold (React.lazy + Suspense)

---

## Notes

These guidelines describe the design system as it currently exists in the code
(`components/ui/`, `app/globals.css`, Tailwind v4 + shadcn/radix). The accessibility
target (WCAG 2.1 AA) is a goal, not an audited certification. Design decisions favor
simplicity, accessibility, and Vietnamese-first localization.
