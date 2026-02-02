

# Fix Mobile Banner, Add Razorpay, and Fix Image/Video Display

## Issues Identified

### 1. Mobile Banner Missing
**Root Cause**: The `MobileLayout` receives `showBanner={true}` from `ResponsiveLayout`, and it does render `BannerDisplay` with position "mobile-home". However, the banner might not be showing because:
- The database might not have any active banners with position "mobile-home"
- Or the banner is rendering but with incorrect styling

**Current Code** (MobileLayout.tsx lines 28-31):
```typescript
{showBanner && (
  <div className="px-3 pt-3">
    <BannerDisplay position="mobile-home" />
  </div>
)}
```

**Fix**: Ensure banners are properly fetched and displayed. Add a fallback banner position check for "home-hero" if "mobile-home" has no banners.

### 2. Image and Video Posts Not Showing
**Root Cause Found**: 
- The `Voice` interface in `Wall.tsx` and `Index.tsx` does NOT include `video_url`
- The VoiceCard is not receiving `videoUrl` prop when rendered
- The database has posts with `image_url` but the data is not being passed correctly

**Evidence from Database**:
```
id: 6eb15da4-7c15-4f3d-a9f7-d896341c57f7
image_url: https://steljdkdysarqxuapwmc.supabase.co/storage/v1/object/public/blog-images/team-post-1770034787184.jpeg
video_url: null
```

**Fix Required**:
- Add `video_url` to Voice interface in Wall.tsx and Index.tsx
- Pass `videoUrl` prop to VoiceCard in both files
- Update VoiceDetailDialog to display images and videos

### 3. Add Razorpay Integration
**Current State**: The Donate page only supports UPI payments with manual confirmation.

**Fix Required**:
- Add Razorpay payment gateway for automated payments
- Create edge function to handle Razorpay order creation
- Add Razorpay checkout button on frontend
- Store Razorpay API keys as secrets

---

## Implementation Plan

### Phase 1: Fix Image/Video Display

#### 1.1 Update Voice Interface in Wall.tsx
Add `video_url` to the Voice interface:
```typescript
interface Voice {
  id: string;
  content: string;
  mood: "happy" | "calm" | "sad" | "angry" | "love";
  category: string;
  is_anonymous: boolean;
  username: string | null;
  support_count: number;
  comment_count: number;
  likes_count?: number;
  reshare_count?: number;
  image_url?: string;
  video_url?: string;  // ADD THIS
  created_at: string;
}
```

#### 1.2 Pass videoUrl to VoiceCard in Wall.tsx
Update VoiceCard rendering (around line 410):
```typescript
<VoiceCard
  key={voice.id}
  id={voice.id}
  content={voice.content}
  mood={voice.mood}
  category={voice.category}
  isAnonymous={voice.is_anonymous}
  username={voice.username || undefined}
  supportCount={voice.support_count}
  commentCount={voice.comment_count}
  imageUrl={voice.image_url}
  videoUrl={voice.video_url}  // ADD THIS
  createdAt={voice.created_at}
  onSupport={handleSupport}
  onClick={handleVoiceClick}
  onLikeChange={fetchVoices}
/>
```

#### 1.3 Update Voice Interface in Index.tsx
Same change - add `video_url` to interface and pass to VoiceCard.

#### 1.4 Update VoiceDetailDialog to Show Images/Videos
Add `image_url` and `video_url` to Voice interface and render them in the dialog content.

---

### Phase 2: Fix Mobile Banner

#### 2.1 Update MobileLayout Banner Logic
Modify to show banner more prominently and check for fallback positions:
```typescript
{showBanner && (
  <div className="px-4 pt-4 pb-2">
    <BannerDisplay position="mobile-home" className="mb-0" />
  </div>
)}
```

#### 2.2 Update BannerDisplay to Support Fallback
If no banners found for "mobile-home", optionally fall back to "home-hero":
```typescript
// In BannerDisplay query - check both positions for mobile
const positions = position === "mobile-home" ? ["mobile-home", "home-hero"] : [position];
```

---

### Phase 3: Add Razorpay Integration

#### 3.1 Create Razorpay Edge Function
Create `supabase/functions/create-razorpay-order/index.ts`:
- Accept amount and donation details
- Create Razorpay order using API
- Return order ID for frontend checkout

#### 3.2 Add Razorpay Secret Keys
Use the secrets tool to request:
- `RAZORPAY_KEY_ID` - Razorpay Key ID
- `RAZORPAY_KEY_SECRET` - Razorpay Key Secret

#### 3.3 Update Donate.tsx Frontend
- Add Razorpay checkout script
- Add "Pay with Razorpay" button
- Handle payment success/failure callbacks
- Auto-submit donation form on successful payment

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Wall.tsx` | Add `video_url` to Voice interface, pass `videoUrl` to VoiceCard |
| `src/pages/Index.tsx` | Add `video_url` to Voice interface, pass `videoUrl` to VoiceCard |
| `src/components/VoiceDetailDialog.tsx` | Add `image_url` and `video_url` to Voice interface, render media |
| `src/layouts/MobileLayout.tsx` | Improve banner display styling |
| `src/components/BannerDisplay.tsx` | Add fallback position support for mobile |
| `src/pages/Donate.tsx` | Add Razorpay checkout integration |

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/create-razorpay-order/index.ts` | Edge function to create Razorpay orders |

---

## Technical Details

### Razorpay Integration Flow
1. User clicks "Pay with Razorpay"
2. Frontend calls edge function to create order
3. Edge function uses Razorpay API to create order
4. Frontend receives order_id and opens Razorpay checkout
5. User completes payment in Razorpay popup
6. On success, frontend records donation with payment details

### Razorpay Checkout Script
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### Order Creation Request
```typescript
const response = await supabase.functions.invoke('create-razorpay-order', {
  body: { amount: 500, currency: 'INR' }
});
```

---

## Implementation Order

1. **First**: Fix image/video display (highest impact, quick fix)
2. **Second**: Fix mobile banner display
3. **Third**: Add Razorpay integration (requires API keys)

