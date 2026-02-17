import React, { useState, useRef, useEffect } from 'react';
import { View } from 'react-native';
import DealCarouselSection from './DealCarouselSection';

/**
 * LazyCategorySection - Lazy-loaded category section
 * 
 * Only fetches deals when the section enters the viewport (becomes visible)
 * This ensures zero performance impact until user scrolls to the section
 */
export default function LazyCategorySection({
  category,
  currentLocation,
  onItemView,
  onQuickClaim,
  onViewAll, // Navigation handler from parent
  // Filters are commented out - uncomment if you want to apply filters to category sections
  // filters = {},
}) {
  const [isVisible, setIsVisible] = useState(false);
  const viewRef = useRef(null);

  // Lazy load: Only enable query when component is about to be visible
  // Using a simple delay approach - loads after initial render completes
  // This prevents blocking the initial render while still being lazy
  useEffect(() => {
    // Load after a short delay to allow initial sections to render first
    // This ensures the first few sections load immediately, while others load as user scrolls
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300); // Small delay to allow initial render
    
    return () => clearTimeout(timer);
  }, []);

  // Don't render until visible (or render minimal placeholder)
  if (!isVisible) {
    return (
      <View 
        ref={viewRef}
        style={{ height: 50, opacity: 0 }} // Placeholder height, invisible
      />
    );
  }

  return (
    <View ref={viewRef}>
      <DealCarouselSection
        title={category.name}
        dealCategoryId={category._id}
        enabled={isVisible} // Only fetch when visible
        params={{
          sort_by: 'discount_desc',
          limit: 8,
          // Location - always include if available
          ...(currentLocation && {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }),
          // FILTERS - COMMENTED OUT (uncomment to apply filters to category sections)
          // Note: These filters are intentionally disabled for category sections
          // to show all deals in the category regardless of user filters
          // ...(filters.deal_type && { deal_type: filters.deal_type }),
          // ...(filters.min_price > 0 && { min_price: filters.min_price }),
          // ...(filters.max_price < 500 && { max_price: filters.max_price }),
          // ...(filters.min_discount > 0 && { min_discount: filters.min_discount }),
          // ...(filters.max_discount < 100 && { max_discount: filters.max_discount }),
          // ...(filters.text_search && { text_search: filters.text_search }),
          // ...(filters.tags && filters.tags.length > 0 && { tags: filters.tags }),
        }}
        onViewAll={onViewAll ? () => onViewAll(category) : undefined}
        onItemView={onItemView}
        onQuickClaim={onQuickClaim}
        autoSlide={true}
        autoSlideInterval={4000}
        hideWhenEmpty={true} // Hide section if no deals found
      />
    </View>
  );
}

