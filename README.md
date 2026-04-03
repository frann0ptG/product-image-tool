# 🖼️ Product Image Link Tool

A lightweight browser-based tool that helps small businesses bulk-add image URLs to their product catalogs — without any server, installation, or technical setup required.

## The Problem

A friend running a small retail business received a spreadsheet with **1,850 product names** from their web developer — and needed to manually find and attach a photo URL for each one. Doing this by hand (open browser → search → find image → copy URL → paste → repeat) would take days.

## The Solution

Upload your spreadsheet → click search buttons for each product → paste the image URL → download the result. That's it.

The tool opens **Wildberries, Ozon, Yandex Market, Yandex Images, and Google Images** for each product in one click, so finding the right photo takes seconds instead of minutes.

## Key Features

- **Zero installation** — compiled into a single `.html` file, just open in any browser
- **Multi-format support** — reads `.xlsx`, `.xls`, `.csv`, `.xml`
- **Live image preview** — paste a URL and instantly see the photo
- **Progress tracking** — see how many products are done at a glance
- **Export to XLSX or XML** — download the completed catalog in your preferred format

## Tech Stack

| Tool | Purpose |
|------|---------|
| React 19 + TypeScript | UI and state management |
| Vite + `vite-plugin-singlefile` | Bundles everything into one portable HTML file |
| `xlsx` | Parses and exports spreadsheet files |
| Tailwind CSS v4 | Styling |
| Lucide React | Icons |

## Architecture

```
src/
├── components/
│   ├── FileUpload.tsx      # Drag-and-drop file input
│   └── ProductTable.tsx    # Product list with search links and URL input
├── services/
│   ├── fileParser.ts       # Parses XLSX / XML / CSV → internal product model
│   └── imageSearch.ts      # Generates search URLs for each marketplace
└── App.tsx                 # State management and layout
```

The project follows a clear **separation of concerns**: parsing logic lives in `services/`, rendering in `components/`, and state orchestration in `App.tsx`.

## How to Run Locally

```bash
npm install
npm run dev
```

To build the portable single-file version:

```bash
npm run build
# Output: dist/index.html — send this file to anyone, no setup needed
```

## Roadmap

- [ ] Save progress to `localStorage` (survive accidental tab close)
- [ ] Keyboard navigation (`Tab` to jump to next unfilled product)
- [ ] Filter view — show only unfilled items
