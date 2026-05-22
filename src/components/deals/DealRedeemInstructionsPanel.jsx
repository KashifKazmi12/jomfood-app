import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { WebView } from 'react-native-webview';
import { Truck, UtensilsCrossed, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react-native';

const SERVICE_TYPES = [
  {
    id: 'delivery',
    contentKey: 'delivery',
    labelKey: 'common.delivery',
    defaultLabel: 'Delivery',
    Icon: Truck,
    badgeStyle: 'deliveryBadge',
    textStyle: 'deliveryText',
    iconColor: '#2563EB',
    activeBorder: '#3B82F6',
    activeBg: '#EFF6FF',
  },
  {
    id: 'dine-in',
    contentKey: 'dine_in',
    labelKey: 'common.dineIn',
    defaultLabel: 'Dine-in',
    Icon: UtensilsCrossed,
    badgeStyle: 'dineInBadge',
    textStyle: 'dineInText',
    iconColor: '#16A34A',
    activeBorder: '#22C55E',
    activeBg: '#F0FDF4',
  },
  {
    id: 'self_pickup',
    contentKey: 'self_pickup',
    labelKey: 'common.selfPickup',
    defaultLabel: 'Pickup',
    Icon: ShoppingBag,
    badgeStyle: 'pickupBadge',
    textStyle: 'pickupText',
    iconColor: '#EA580C',
    activeBorder: '#F97316',
    activeBg: '#FFF7ED',
  },
];

const stripHtml = (html) => {
  if (!html) return '';
  return String(html).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
};

const compactRichHtml = (html) => {
  if (!html) return '';
  let s = String(html);
  s = s.replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '');
  s = s.replace(/(<br\s*\/?>\s*){2,}/gi, '<br/>');
  return s.trim();
};

const normalizeRedeemTypography = (html) => {
  if (!html) return '';
  let s = String(html);
  s = s.replace(/\sstyle\s*=\s*("([^"]*)"|'([^']*)')/gi, (_m, dbl, sgl) => {
    const style = dbl || sgl || '';
    const kept = style
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .filter((part) => {
        const key = part.split(':')[0]?.trim().toLowerCase();
        return !['font-size', 'font-family', 'line-height'].includes(key);
      })
      .join('; ');
    return kept ? ` style="${kept}"` : '';
  });
  s = s.replace(/\sclass\s*=\s*("([^"]*)"|'([^']*)')/gi, (_m, dbl, sgl) => {
    const classes = (dbl || sgl || '').split(/\s+/).filter((cls) => cls && !/^ql-/.test(cls));
    return classes.length ? ` class="${classes.join(' ')}"` : '';
  });
  s = s.replace(/<font\b[^>]*>/gi, '').replace(/<\/font>/gi, '');
  return s;
};

const prepareRedeemHtml = (html) => normalizeRedeemTypography(compactRichHtml(html));

const buildHtmlDocument = (bodyHtml, fontSizePx = 14, textColor = '#6b7280') => {
  const base = Number(fontSizePx) || 14;
  const h1 = Math.round(base * 1.5);
  const h2 = Math.round(base * 1.33);
  const h3 = Math.round(base * 1.17);
  const h4 = Math.round(base * 1.08);
  const h5 = base;
  const h6 = Math.round(base * 0.92);

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: transparent; color: ${textColor}; }
    p, li { font-size: ${base}px; line-height: 1.4; font-weight: 400; margin: 0; color: ${textColor}; }
    p + p, h1 + p, h2 + p, h3 + p, h4 + p, h5 + p, h6 + p { margin-top: 4px; }
    h1 { font-size: ${h1}px; line-height: 1.3; font-weight: 600; margin: 0 0 4px; color: #111827; }
    h2 { font-size: ${h2}px; line-height: 1.35; font-weight: 600; margin: 0 0 4px; color: #111827; }
    h3 { font-size: ${h3}px; line-height: 1.4; font-weight: 600; margin: 0 0 4px; color: #1f2937; }
    h4 { font-size: ${h4}px; line-height: 1.4; font-weight: 600; margin: 0 0 4px; color: #1f2937; }
    h5 { font-size: ${h5}px; line-height: 1.4; font-weight: 600; margin: 0 0 4px; color: #374151; }
    h6 { font-size: ${h6}px; line-height: 1.4; font-weight: 600; margin: 0 0 4px; color: #4b5563; }
    ul, ol { margin: 0; padding-left: 18px; font-size: ${base}px; color: ${textColor}; }
    ul + p, ol + p, p + ul, p + ol { margin-top: 4px; }
    strong, b { font-weight: 600; }
    a { color: #ea580c; }
  </style>
</head>
<body>${bodyHtml || ''}</body>
</html>`;
};

export default function DealRedeemInstructionsPanel({
  consumptionTypes = [],
  redeemInstructions = null,
  styles: themeStyles,
  primaryColor = '#ea580c',
  descriptionFontSize = 14,
  descriptionColor = '#6b7280',
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [activeType, setActiveType] = useState('');
  const [webViewHeight, setWebViewHeight] = useState(1);

  const onWebViewMessage = useCallback((event) => {
    const height = Number(event.nativeEvent.data);
    if (height > 0) setWebViewHeight(height);
  }, []);

  const availableTypes = useMemo(() => {
    if (!Array.isArray(consumptionTypes) || !consumptionTypes.length) return [];
    return SERVICE_TYPES.filter((type) => consumptionTypes.includes(type.id));
  }, [consumptionTypes]);

  const sectionsWithContent = useMemo(() => {
    return availableTypes
      .map((type) => {
        const html = redeemInstructions?.[type.contentKey];
        if (!html || !stripHtml(html)) return null;
        return { ...type, html };
      })
      .filter(Boolean);
  }, [availableTypes, redeemInstructions]);

  useEffect(() => {
    if (!sectionsWithContent.length) {
      setActiveType('');
      return;
    }
    if (!sectionsWithContent.some((s) => s.id === activeType)) {
      setActiveType(sectionsWithContent[0].id);
    }
  }, [sectionsWithContent, activeType]);

  useEffect(() => {
    setWebViewHeight(1);
  }, [activeType, expanded]);

  if (!availableTypes.length) return null;

  const showRedeemToggle = sectionsWithContent.length > 0;
  const activeSection = sectionsWithContent.find((s) => s.id === activeType);

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      if (next && sectionsWithContent[0]) {
        setActiveType(sectionsWithContent[0].id);
      }
      return next;
    });
  };

  const handleBadgePress = (typeId) => {
    if (!expanded) return;
    if (sectionsWithContent.some((s) => s.id === typeId)) {
      setActiveType(typeId);
    }
  };

  const renderBadge = (type) => {
    const Icon = type.Icon;
    const label = t(type.labelKey, type.defaultLabel);
    const hasContent = sectionsWithContent.some((s) => s.id === type.id);
    const isActive = expanded && activeType === type.id;

    if (expanded && hasContent) {
      return (
        <TouchableOpacity
          key={type.id}
          onPress={() => handleBadgePress(type.id)}
          activeOpacity={0.7}
          style={[
            styles.badge,
            themeStyles?.[type.badgeStyle],
            isActive && {
              borderColor: type.activeBorder,
              backgroundColor: type.activeBg,
            },
          ]}
        >
          <Icon size={12} color={type.iconColor} />
          <Text style={[styles.badgeText, themeStyles?.[type.textStyle]]}>{label}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View key={type.id} style={[styles.badge, themeStyles?.[type.badgeStyle]]}>
        <Icon size={12} color={type.iconColor} />
        <Text style={[styles.badgeText, themeStyles?.[type.textStyle]]}>{label}</Text>
      </View>
    );
  };

  return (
    <View>
      <View style={styles.badgeRow}>{availableTypes.map(renderBadge)}</View>

      {showRedeemToggle && (
        <>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={toggleExpanded}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleText, { color: primaryColor, fontSize: descriptionFontSize }]}>
              {t('dealModal.howToRedeemQuestion', 'How to redeem?')}
            </Text>
            {expanded ? (
              <ChevronUp size={16} color={primaryColor} />
            ) : (
              <ChevronDown size={16} color={primaryColor} />
            )}
          </TouchableOpacity>

          {expanded && activeSection && (
            <WebView
              key={activeSection.id}
              originWhitelist={['*']}
              source={{
                html: buildHtmlDocument(
                  prepareRedeemHtml(activeSection.html),
                  descriptionFontSize,
                  descriptionColor
                ),
              }}
              style={[styles.webView, { height: webViewHeight }]}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              onMessage={onWebViewMessage}
              injectedJavaScript={`
                (function () {
                  function postHeight() {
                    var h = document.body.scrollHeight;
                    window.ReactNativeWebView.postMessage(String(h));
                  }
                  postHeight();
                  setTimeout(postHeight, 50);
                  setTimeout(postHeight, 200);
                })();
                true;
              `}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    marginBottom: 0,
    alignSelf: 'flex-start',
  },
  toggleText: {
    fontWeight: '600',
  },
  webView: {
    marginTop: 4,
    backgroundColor: 'transparent',
  },
});
