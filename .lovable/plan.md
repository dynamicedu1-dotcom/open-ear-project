
# Optimize Video Loading for Faster, Smoother Playback

## Current Issues

| Issue | Location | Impact |
|-------|----------|--------|
| Videos load immediately on page load | VoiceCard, VoiceDetailDialog | Slow initial page load, bandwidth waste |
| No poster/thumbnail shown | Both components | Blank video until loaded |
| No lazy loading | Both components | All videos load even if not visible |
| No loading state feedback | Both components | Poor UX - users don't know video is loading |

## Solution Overview

Implement a comprehensive video optimization strategy:

1. **Lazy Loading with Intersection Observer** - Only load videos when they scroll into view
2. **Video Thumbnail/Poster Generation** - Show first frame while loading
3. **Loading State with Skeleton** - Visual feedback during load
4. **Optimized Video Attributes** - Better preload strategy and playback hints

---

## Implementation Plan

### 1. Create Optimized Video Component

Create a new reusable `OptimizedVideo` component with:
- Intersection Observer for viewport detection
- Loading skeleton while video prepares
- Poster image support (auto-generated or from URL)
- Progressive loading with `preload="none"` until visible
- Smooth fade-in transition when ready

**File**: `src/components/OptimizedVideo.tsx`

```text
Key Features:
+----------------------------------+
|  Intersection Observer           |
|  (loads only when visible)       |
+----------------------------------+
           |
           v
+----------------------------------+
|  Loading Skeleton                |
|  (shown while loading)           |
+----------------------------------+
           |
           v
+----------------------------------+
|  Video Player                    |
|  - preload="metadata" when visible
|  - poster frame                  |
|  - smooth fade transition        |
+----------------------------------+
```

### 2. Update VoiceCard.tsx

Replace the basic video element with the new OptimizedVideo component:
- Pass video URL and optional poster
- Add lazy loading behavior
- Show skeleton during load
- Maintain existing click behavior

### 3. Update VoiceDetailDialog.tsx

Update the dialog video to use OptimizedVideo:
- Immediate load when dialog opens (already visible)
- Show loading state with skeleton
- Smooth transition when ready

---

## Technical Details

### OptimizedVideo Component Props

```typescript
interface OptimizedVideoProps {
  src: string;
  poster?: string;
  className?: string;
  maxHeight?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}
```

### Intersection Observer Strategy

```typescript
// Load video only when 20% visible
const observerOptions = {
  threshold: 0.2,
  rootMargin: '50px' // Pre-load slightly before visible
};
```

### Loading States

1. **Not visible**: `preload="none"` - No data loaded
2. **Entering viewport**: `preload="metadata"` - Load video info
3. **Ready to play**: Show video with smooth fade

### CSS Transitions

```css
/* Smooth fade-in when video is ready */
.video-loading { opacity: 0; }
.video-ready { opacity: 1; transition: opacity 0.3s ease; }
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/OptimizedVideo.tsx` | Reusable optimized video player component |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/VoiceCard.tsx` | Replace basic video with OptimizedVideo |
| `src/components/VoiceDetailDialog.tsx` | Replace basic video with OptimizedVideo |

---

## Performance Benefits

| Metric | Before | After |
|--------|--------|-------|
| Initial Page Load | All videos load | Only visible videos load |
| Bandwidth Usage | High (all videos) | Low (on-demand) |
| Perceived Speed | Slow (blank videos) | Fast (skeleton + fade) |
| User Experience | Jarring | Smooth transitions |

---

## Implementation Order

1. Create `OptimizedVideo` component with Intersection Observer and loading states
2. Update `VoiceCard` to use OptimizedVideo for feed videos
3. Update `VoiceDetailDialog` to use OptimizedVideo for detail view
4. Test video loading behavior across different network conditions
