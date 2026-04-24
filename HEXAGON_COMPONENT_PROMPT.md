Create a reusable HexagonImage component (`components/ui/HexagonImage.vue`) with the following requirements:

**Component Structure:**
- A wrapper div that contains TWO images:
  1. Background image: A hexagon-shaped background image (default: `/assets/images/hexagons/background.png`)
  2. Foreground image: The model/person image that sits on top

**Props:**
- `src` (required): Path to the foreground/model image
- `backgroundImage` (optional): Path to background hexagon image (defaults to `/assets/images/hexagons/background.png`)
- `alt` (optional): Alt text for accessibility
- `class` (optional): Additional CSS classes for positioning/spacing

**Styling Requirements:**
- Wrapper must have these size constraints: `min-w-[202px] max-w-[202px] lg:min-w-[304px] lg:max-w-[304px] min-h-[176px] max-h-[176px] lg:min-h-[263px] lg:max-h-[263px]`
- Wrapper must have: `overflow-hidden pointer-events-auto relative`
- Background image: Absolutely positioned, `z-index: 1`, `object-fit: contain`, `pointer-events: none`
- Foreground image: Absolutely positioned, `z-index: 2`, `object-fit: contain`, has transition classes for smooth animation
- Both images should be `width: 100%; height: 100%`

**Hover Behavior:**
- On hover over the wrapper, ONLY the foreground image should zoom (`transform: scale(1.05)`)
- Background image should stay static (no transform)
- Smooth transition: `duration-300 ease-in-out`

**Critical Requirements:**
- The component MUST NOT break the layout in `components/sections/Hero.vue`
- The wrapper should be a drop-in replacement for the original `<img>` tags
- No clip-path should be used (let the background image's natural hexagon shape show through)
- The wrapper's overflow-hidden will clip the zoom animation to the hexagon boundaries

**Usage Example:**
```vue
<UiHexagonImage src="/assets/images/hexagons/hero/image5.png" />
<UiHexagonImage src="/assets/images/hexagons/hero/image5.png" class="-ml-10 lg:-ml-14" />
```

Once created, replace all hexagon `<img>` tags in `components/sections/Hero.vue` with this component.

