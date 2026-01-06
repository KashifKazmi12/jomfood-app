# API & Web Integration Guide: My Deals

This document outlines the API endpoints for accessing Claimed Deal History and Favorites, along with UI/UX guidelines for integrating these features into a web application.

## 1. API Documentation

### A. Claimed Deal History

Retrieves the paginated history of deals claimed by a user.

- **Endpoint:** `GET /jomfood-deals/claims/history`
- **Function Ref:** `dealsAPI.getClaimHistory`

#### Request Parameters (Query)

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `customer_id` | `string` | **Yes** | User's MongoDB ID (24-char hex). |
| `page` | `number` | No | Page number (default: 1). |
| `limit` | `number` | No | Items per page (default: 10). |
| `lang` | `string` | No | Language code (`en` or `malay`). |

#### Response JSON

```json
{
    "success": true,
    "data": {
        "claims": [
            {
                "_id": "694d1101e1d055a0f60dc310",
                "qr_code_image": "data:image/png;base64,iVBORw0KGgoAAAA...",
                "qr_code_public_url": "https://jomsmart-staging.s3.amazonaws.com/qr-codes/qr-code-1766658305943-9bb878b5.png",
                "status": "active",
                "redeemed_at": null,
                "redeemed_by": null,
                "customer_phone": "03017422047",
                "customer_email": "kashifkazmi1412@gmail.com",
                "deal_id": "694351861f72b4c4da54c625",
                "customer_id": "692018bd208b40ce471b9580",
                "deal_name": "Ikan Siaka",
                "deal_total": 40.5,
                "deal_type": "percentage",
                "expires_at": "2025-12-31T09:45:00.000Z",
                "customer_name": "Syed Kashif Kazmi",
                "claimed_at": "2025-12-25T10:25:05.860Z",
                "createdAt": "2025-12-25T10:25:05.862Z",
                "updatedAt": "2025-12-25T10:25:06.272Z",
                "business_id": {
                    "_id": "6900a18b340f6be762b09188",
                    "company_name": "Iqan Bakar Cheras",
                    "image_url": "2020-02-03profileimg.png"
                },
                "deal_details": {
                    "_id": "694351861f72b4c4da54c625",
                    "deal_name": "Ikan Siaka",
                    "discount_percentage": 0,
                    "discount_amount": 4.5,
                    "deal_type": "fixed_amount",
                    "deal_total": 40.5,
                    "original_total": 45,
                    "deal_image": "https://jomsmart-staging.s3.amazonaws.com/6944d8c5c609e34e7dfae494/Ikan_Siaka/1766120475090_c3f80576-756d-41c5-a30c-2ec7db734c57_Ikan_Siaka_New.png"
                }
            }
        ],
        "pagination": {
            "has_next": true,
            "current_page": 1,
            "total_pages": 5
        }
    }
}
```

---

### B. Favorite Deals

Retrieves the paginated list of user's favorite deals.

- **Endpoint:** `GET /jomfood-deals/favorites`
- **Function Ref:** `favoritesAPI.getFavoriteDeals`

#### Request Parameters (Query)

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `page` | `number` | No | Page number (default: 1). |
| `limit` | `number` | No | Items per page (default: 12). |
| `sort_by` | `string` | No | Sort order (e.g., `favorited_newest`). |
| `deal_type` | `string` | No | Optional filter by deal type. |

#### Response JSON

```json
{
  "success": true,
  "data": {
    "deals": [
      {
        "_id": "654c12...",
        "title": "50% Off Sushi Platter",
        "description": "Fresh salmon and tuna platter...",
        "price": 25.00,
        "original_price": 50.00,
        "discount_percentage": 50,
        "images": [
          "https://cdn.jomfood.com/deals/sushi.jpg"
        ],
        "merchant": {
          "_id": "651a2b...",
          "name": "Sakura Japanese Dining",
          "logo": "https://cdn.jomfood.com/logos/sakura.jpg"
        },
        "is_favorite": true,
        "favorited_at": "2023-10-28T14:30:00.000Z"
      }
    ],
    "pagination": {
      "has_next": true,
      "current_page": 1,
      "total_pages": 3,
      "total_items": 28
    }
  }
}
```

---

## 2. Web UI Integration Guidelines

To translate the React Native `MyDealsScreen` to a responsive web interface, follow these guidelines.

### A. Layout Structure

The "My Deals" page should likely be a dashboard section or a dedicated page with two main views, toggleable via tabs or a sub-navigation menu.

**Tabs:**
1.  **Claimed Deals** (Defaults to this)
2.  **Favorites**

#### 1. Claimed Deals (List/Table View)
Since claimed deals are transaction records, a **List** or **Card Row** layout works best.

*   **Desktop:** Use a comfortable list view where each row represents a claim.
    *   **Columns/Sections:**
        *   **Left:** Deal Image (thumbnail) + Deal Name.
        *   **Middle:** Business Name + Price (formatted e.g., RM45.00).
        *   **Right:** Status Badge (Active, Redeemed, Expired) + Action Button (e.g., "View QR").
*   **Mobile:** Stacked card view (similar to the mobile app).
    *   Image/Title on top row.
    *   Business/Price on second row.
    *   Status/Date footer.

**UI Component: Status Badge**
*   **Active:** Green background/text (e.g., `bg-green-100 text-green-800`).
*   **Redeemed:** Blue or Gray (e.g., `bg-blue-100 text-blue-800`).
*   **Expired:** Gray or Red (muted) (e.g., `bg-gray-100 text-gray-500`).

**Interaction:**
*   Clicking a "View QR" button or the row should open a **Modal** (analogous to the BottomSheet in app) displaying the QR code and full details.

#### 2. Favorite Deals (Grid View)
Favorites are distinct items to be browsed. Use a **Grid Layout**.

*   **Grid Specs:**
    *   **Desktop:** 4 columns (`grid-cols-4`).
    *   **Tablet:** 3 columns (`grid-cols-3`).
    *   **Mobile:** 1 or 2 columns (`grid-cols-1` or `grid-cols-2`).
*   **Card Composition:**
    *   **Image:** Aspect ratio 4:3 or 16:9, taking up the top half.
    *   **Content:** Title (truncated 2 lines), Business Name (muted), Price (highlighted), Original Price (strikethrough).
    *   **Actions:** "Heart" icon (filled red) in top-right corner to un-favorite. "View" button or entire card clickable to navigate to Deal Detail page.

### B. Functional Requirements

1.  **Infinite Scroll vs. Pagination:**
    *   **Web Standard:** Traditional **Pagination** (Page 1, 2, 3...) is often better for web "My Account" sections than infinite scroll, as it allows easier navigation and footer access. However, if staying true to the mobile "feed" feel, use a "Load More" button rather than auto-triggering on scroll to prevent footer jumping.
    *   *Recommendation:* Use a "Load More" button at the bottom of the grid/list.

2.  **Empty States:**
    *   **No Claims:** Show a friendly illustration (e.g., shopping bag) with a "Browse Deals" button redirecting to the home/deals listing.
    *   **No Favorites:** "Heart" illustration with "Start saving deals you love!" text.

3.  **Loading Skeletons:**
    *   While fetching data (`isLoading`), display shimmer skeletons matching the layout (List skeletons for Claims, Card skeletons for Favorites) to reduce layout shift (`CLS`).

### C. Technology Suggestions (React Web)

*   **State Management:** Use `TanStack Query` (React Query) just like the app. It's perfect for web too (handling `isLoading`, `isFetchingNextPage`, caching).
*   **Styling:** TailwindCSS is highly recommended for rapid responsive grids.
    *   *Grid:* `className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"`
    *   *Card Hover:* `className="transition-shadow hover:shadow-lg duration-300"`

### D. Mockup Code Snippet (React/Tailwind)

```jsx
// Example Claimed Deal Row Component
const ClaimRow = ({ claim, onOpenQr }) => (
  <div className="flex flex-col md:flex-row items-start md:items-center p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition gap-4">
    {/* Info */}
    <div className="flex-1">
      <h3 className="font-semibold text-lg">{claim.deal_details.deal_name}</h3>
      <p className="text-gray-500 text-sm">{claim.business_id.company_name}</p>
    </div>
    
    {/* Price & Status */}
    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
      <span className="font-bold text-primary">RM{claim.deal_details.deal_total}</span>
      
      <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase
        ${claim.status === 'active' ? 'bg-green-100 text-green-700' : 
          claim.status === 'redeemed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
        {claim.status}
      </span>
      
      <button 
        onClick={() => onOpenQr(claim)}
        className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark text-sm"
      >
        View QR
      </button>
    </div>
  </div>
);
```

## 3. Field Display Mapping

### A. Claimed Deals List (Previous Claims)
Display the following fields for each item in the history list:

| UI Label | Field Source | Example | Notes |
| :--- | :--- | :--- | :--- |
| **Deal Name** | `claim.deal_details.deal_name` | "Ikan Siaka" | Truncate if too long (2 lines max). |
| **Business Name** | `claim.business_id.company_name` | "Iqan Bakar Cheras" | Fallback to `claim.group_id.name` if missing. |
| **Price** | `claim.deal_details.deal_total` | "RM40.50" | Format as currency. |
| **Status** | `claim.status` | "Active", "Redeemed", "Expired" | Use distinct badge colors. |
| **Claimed Date** | `claim.claimed_at` | "Dec 25, 2025" | Format: `MMM DD, YYYY`. |
| **Expiry Date** | `claim.expires_at` | "Dec 31, 2025" | Only show if status is "Active". |

### B. View QR Modal
When "View QR" is clicked, open a Modal displaying these specific details:

| UI Section | Field Source | Display Format |
| :--- | :--- | :--- |
| **Header** | | |
| Title | `claim.deal_name` | Full text. |
| Subtitle | `claim.business_id.company_name` | |
| **QR Section** | | |
| QR Code Image | `claim.qr_code_public_url` | Prefer this URL. Fallback to `qr_code_image` (Base64) if URL is missing. |
| **Info Section** | | |
| Price | `claim.deal_total` | "RM40.50" |
| Claimed At | `claim.claimed_at` | "Nov 25, 2025, 01:10 PM" (Full date & time) |
| Expires At | `claim.expires_at` | "Dec 31, 2025" (Show expiry warning if Active) |
| Redeemed At | `claim.redeemed_at` | Show only if `status == 'redeemed'`. |
| Address | `claim.business_id.address` | |
| **Action** | "View Deal Details" | Link to`/deal/:deal_id` |

## 4. Toggle Favorite API

A toggle endpoint to favorite or un-favorite a deal.

- **Endpoint:** `POST /jomfood-deals/favorites/:deal_id/toggle`
- **Function Ref:** `favoritesAPI.toggleFavorite`

### Request Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `deal_id` | `string` | **Yes** | The Deal ID (path parameter). |
| `lang` | `string` | No | Language code (`en` or `malay`) as query param. |

### Response JSON

```json
{
  "success": true,
  "data": {
    "is_favorite": true, 
    "message": "Deal added to favorites"
  }
}
```

*Note: Returns `is_favorite: false` when removed.*
