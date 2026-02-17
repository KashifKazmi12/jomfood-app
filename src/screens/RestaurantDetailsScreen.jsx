import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Linking,
    Platform,
    Dimensions,
    Image,
    Modal,
    TouchableWithoutFeedback,
    TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
    Store,
    MapPin,
    Phone,
    Mail,
    ArrowLeft,
    Tag,
    SlidersHorizontal,
    X,
    Flame,
    Percent,
    DollarSign,
    Sparkles,
    TrendingUp,
    TrendingDown,
    Clock,
    Navigation as NavigationIcon,
} from 'lucide-react-native';

import useThemeColors from '../theme/useThemeColors';
import useThemeTypography from '../theme/useThemeTypography';
import { restaurantsAPI } from '../api/restaurants';
import { dealsAPI } from '../api/deals';
import DealCarouselSection from '../components/deals/DealCarouselSection';
import GradientBackground from '../components/GradientBackground';
import RangeSlider from '../components/RangeSlider';
import { showToast } from '../components/toast';
import { BottomNavigationSpace } from '../navigation/AppNavigator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RestaurantDetailsScreen() {
    const { id } = useRoute().params;
    const navigation = useNavigation();
    const { t } = useTranslation();
    const colors = useThemeColors();
    const typography = useThemeTypography();
    const styles = getStyles(colors, typography);

    // Filters State
    const [filters, setFilters] = useState({
        deal_type: '',
        min_price: 0,
        max_price: 500,
        min_discount: 0,
        max_discount: 100,
        sort_by: 'discount_desc',
        text_search: '',
        tags: [],
        business_id: id,
    });

    const [showFilters, setShowFilters] = useState(false);
    const [tempFilters, setTempFilters] = useState(filters);
    const [availableTags, setAvailableTags] = useState([]);
    const [loadingTags, setLoadingTags] = useState(false);

    // Fetch Restaurant Details
    const { data: restaurant, isLoading: restLoading, error: restError } = useQuery({
        queryKey: ['restaurant', id],
        queryFn: () => restaurantsAPI.getRestaurant(id),
        enabled: !!id,
    });

    // Fetch Tags for filters
    useEffect(() => {
        if (showFilters && availableTags.length === 0) {
            setLoadingTags(true);
            dealsAPI.getAllTags()
                .then(tags => {
                    setAvailableTags(tags);
                    setLoadingTags(false);
                })
                .catch(() => setLoadingTags(false));
        }
    }, [showFilters, availableTags.length]);

    const handleApplyFilters = () => {
        setFilters(tempFilters);
        setShowFilters(false);
    };

    const handleClearFilters = () => {
        const cleared = {
            deal_type: '',
            min_price: 0,
            max_price: 500,
            min_discount: 0,
            max_discount: 100,
            sort_by: 'discount_desc',
            text_search: '',
            tags: [],
            business_id: id,
        };
        setTempFilters(cleared);
        setFilters(cleared);
        setShowFilters(false);
    };

    const handleDealView = useCallback((item) => {
        navigation.navigate('DealDetail', { id: item._id });
    }, [navigation]);

    const getWhatsAppUrl = () => {
        if (restaurant?.office_phone) {
            const phoneNumber = restaurant.office_phone.replace(/\D/g, '');
            return `https://wa.me/${phoneNumber}`;
        }
        return null;
    };

    const openMaps = () => {
        if (restaurant?.lat && restaurant?.lng) {
            const lat = restaurant.lat;
            const lng = restaurant.lng;
            const url = Platform.select({
                ios: `maps://app?daddr=${lat},${lng}&directionsmode=driving`,
                android: `google.navigation:q=${lat},${lng}`,
            });
            const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

            Linking.canOpenURL(url).then(supported => {
                if (supported) {
                    Linking.openURL(url);
                } else {
                    Linking.openURL(googleMapsUrl);
                }
            });
        } else if (restaurant?.address) {
            const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`;
            Linking.openURL(url);
        }
    };

    const openWhatsApp = () => {
        const url = getWhatsAppUrl();
        if (url) {
            Linking.openURL(url).catch(() => {
                showToast.error(t('common.error'), t('common.couldNotOpenWhatsApp'));
            });
        }
    };

    if (restLoading && !restaurant) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (restError || (!restaurant && !restLoading)) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>{restError?.message || t('common.restaurantNotFound')}</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>{t('common.goBack')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <GradientBackground>
            <SafeAreaView style={styles.safe} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
                        <ArrowLeft size={20} color={colors.primary} />
                    </TouchableOpacity>

                    <View style={styles.headerLogoContainer}>
                        <Image
                            source={require('../assets/images/jomfood.png')}
                            style={styles.headerLogoImage}
                            resizeMode="contain"
                        />
                    </View>

                    <TouchableOpacity onPress={() => setShowFilters(true)} style={styles.headerIconBtn}>
                        <SlidersHorizontal size={20} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Professional Unified Restaurant Profile Header */}
                    <View style={styles.sleekHeader}>
                        <View
                            style={styles.sleekHeaderContainer}
                        >

                            {/* Left Column: Logo */}
                            {/* <View style={styles.sleekLogoWrapper}>
                                <View style={styles.sleekLogoBox}>
                                    <Store size={34} color={colors.primary} strokeWidth={1.5} />
                                </View>
                            </View> */}

                            {/* Middle Column: Unified Info */}
                            <View style={styles.sleekInfoColumn}>
                                <View style={styles.sleekTitleRow}>
                                    {/* <View style={styles.sleekLogoBox}>
                                        <Store size={20} color={colors.primary} strokeWidth={1.5} />
                                    </View> */}
                                    <Text style={styles.sleekTitleText} numberOfLines={1}>
                                        {restaurant?.company_name}
                                    </Text>
                                    <View style={styles.sleekStatusBadge}>
                                        <Text style={styles.sleekStatusText}>Active</Text>
                                    </View>
                                </View>

                                {/* horzontal line */}
                                {/* <View style={styles.sleekDivider} /> */}

                                <View style={styles.sleekDetailsBlock}>
                                    {restaurant?.office_phone && (
                                        <View style={styles.sleekInfoRow}>
                                            <View style={styles.sleekIconWrap}>
                                                <Phone size={12} color={colors.primary} />
                                            </View>
                                            <Text style={styles.sleekInfoText}>{restaurant.office_phone}</Text>
                                        </View>
                                    )}

                                    {restaurant?.email && (
                                        <View style={styles.sleekInfoRow}>
                                            <View style={styles.sleekIconWrap}>
                                                <Mail size={12} color={colors.primary} />
                                            </View>
                                            <Text style={styles.sleekInfoText} numberOfLines={1}>{restaurant.email}</Text>
                                        </View>
                                    )}

                                    {restaurant?.address && (
                                        <View style={styles.sleekInfoRow}>
                                            <View style={styles.sleekIconWrap}>
                                                <MapPin size={12} color={colors.primary} />
                                            </View>
                                            <Text style={styles.sleekAddressText}>
                                                {restaurant.address}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Right Column: Key Actions */}
                            <View style={styles.sleekActionsColumn}>
                                <TouchableOpacity
                                    onPress={openMaps}
                                    style={[styles.sleekActionCircle, { backgroundColor: '#4285F4' }]}
                                    activeOpacity={0.8}
                                >
                                    <NavigationIcon size={16} color="#FFFFFF" strokeWidth={2.5} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={openWhatsApp}
                                    style={[styles.sleekActionCircle, { backgroundColor: '#25D366' }]}
                                    activeOpacity={0.8}
                                >
                                    <WhatsAppIconSVG size={16} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Deals Sections */}
                    <View style={styles.dealsContainer}>
                        <DealCarouselSection
                            title={t('deals.hotDealsToday')}
                            params={{
                                ...filters,
                                is_hot_deal: true,
                            }}
                            onItemView={handleDealView}
                            hideWhenEmpty={true}
                        />

                        <View style={styles.sectionDivider} />

                        <DealCarouselSection
                            title={t('deals.allDeals')}
                            params={{
                                ...filters,
                                is_hot_deal: false,
                            }}
                            onItemView={handleDealView}
                            hideWhenEmpty={false}
                        />
                    </View>

                    <View style={{ height: BottomNavigationSpace }} />
                </ScrollView>

                {/* Filter Modal */}
                <Modal
                    visible={showFilters}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowFilters(false)}
                >
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback onPress={() => setShowFilters(false)}>
                            <View style={styles.modalBackdrop} />
                        </TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{t('filters.title')}</Text>
                                <TouchableOpacity onPress={() => setShowFilters(false)}>
                                    <X size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                                {/* Search */}
                                <View style={styles.filterSection}>
                                    <Text style={styles.sectionLabel}>{t('filters.search')}</Text>
                                    <TextInput
                                        style={styles.searchInput}
                                        placeholder={t('filters.enterDealNameTagsRestaurant')}
                                        placeholderTextColor={colors.textMuted}
                                        value={tempFilters.text_search}
                                        onChangeText={(text) => setTempFilters(f => ({ ...f, text_search: text }))}
                                    />
                                </View>

                                {/* Sort By */}
                                <View style={styles.filterSection}>
                                    <Text style={styles.sectionLabel}>{t('filters.sortBy')}</Text>
                                    <View style={styles.chipsRow}>
                                        {[
                                            { id: 'discount_desc', label: t('filters.bestDiscount') },
                                            { id: 'newest', label: t('filters.newest') },
                                            { id: 'price_asc', label: t('filters.priceLowToHigh') },
                                            { id: 'price_desc', label: t('filters.priceHighToLow') },
                                            { id: 'expiry_asc', label: t('filters.expiringSoon') },
                                        ].map(option => (
                                            <TouchableOpacity
                                                key={option.id}
                                                style={[styles.chip, tempFilters.sort_by === option.id && styles.chipActive]}
                                                onPress={() => setTempFilters(f => ({ ...f, sort_by: option.id }))}
                                            >
                                                <Text style={[styles.chipText, tempFilters.sort_by === option.id && styles.chipTextActive]}>
                                                    {option.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Deal Type */}
                                <View style={styles.filterSection}>
                                    <Text style={styles.sectionLabel}>{t('filters.dealType')}</Text>
                                    <View style={styles.chipsRow}>
                                        {[
                                            { id: 'percentage', label: t('filters.percentage') },
                                            { id: 'fixed_amount', label: t('filters.fixedAmount') },
                                            { id: 'combo', label: t('filters.combo') },
                                        ].map(type => (
                                            <TouchableOpacity
                                                key={type.id}
                                                style={[styles.chip, tempFilters.deal_type === type.id && styles.chipActive]}
                                                onPress={() => setTempFilters(f => ({ ...f, deal_type: f.deal_type === type.id ? '' : type.id }))}
                                            >
                                                <Text style={[styles.chipText, tempFilters.deal_type === type.id && styles.chipTextActive]}>
                                                    {type.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Price Range */}
                                <View style={styles.filterSection}>
                                    <RangeSlider
                                        label={t('filters.priceRange')}
                                        min={0}
                                        max={500}
                                        minValue={tempFilters.min_price}
                                        maxValue={tempFilters.max_price}
                                        onMinChange={(val) => setTempFilters(f => ({ ...f, min_price: val }))}
                                        onMaxChange={(val) => setTempFilters(f => ({ ...f, max_price: val }))}
                                        step={10}
                                    />
                                </View>

                                {/* Discount Range */}
                                <View style={styles.filterSection}>
                                    <RangeSlider
                                        label={t('filters.discountRange')}
                                        min={0}
                                        max={100}
                                        minValue={tempFilters.min_discount}
                                        maxValue={tempFilters.max_discount}
                                        onMinChange={(val) => setTempFilters(f => ({ ...f, min_discount: val }))}
                                        onMaxChange={(val) => setTempFilters(f => ({ ...f, max_discount: val }))}
                                        step={5}
                                    />
                                </View>
                            </ScrollView>

                            <View style={styles.modalFooter}>
                                <TouchableOpacity style={styles.clearBtn} onPress={handleClearFilters}>
                                    <Text style={styles.clearBtnText}>{t('common.clear')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.applyBtn} onPress={handleApplyFilters}>
                                    <Text style={styles.applyBtnText}>{t('common.apply')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </GradientBackground>
    );
}

const getStyles = (colors, typography) => StyleSheet.create({
    safe: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        position: 'relative',
        height: 60,
    },
    headerLogoContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 0,
        pointerEvents: 'box-none',
    },
    headerLogoImage: {
        width: 110,
        height: 32.5,
    },
    headerIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    restaurantCard: {
        margin: 16,
        padding: 20,
        backgroundColor: colors.white,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 8 },
        elevation: 5,
    },
    restaurantHeaderRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
    },
    logoContainer: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: colors.primaryLighter,
        alignItems: 'center',
        justifyContent: 'center',
    },
    restInfo: {
        flex: 1,
    },
    titleBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },
    restName: {
        fontSize: typography.fontSize.xl,
        fontFamily: typography.fontFamily.bold,
        color: colors.text,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        backgroundColor: '#E8F5E9',
    },
    statusText: {
        fontSize: 10,
        color: '#2E7D32',
        fontFamily: typography.fontFamily.bold,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    infoText: {
        fontSize: typography.fontSize.sm,
        color: colors.textMuted,
        fontFamily: typography.fontFamily.regular,
        flex: 1,
    },
    contactRow: {
        marginTop: 4,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    actionButtonText: {
        fontSize: typography.fontSize.sm,
        fontFamily: typography.fontFamily.medium,
        color: colors.text,
    },

    // Unified Professional Header Styles
    sleekHeader: {
        width: '100%',
        // backgroundColor: 'colors.white',
        paddingTop: 20,
        paddingBottom: 24,
        paddingHorizontal: 16,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        // shadowColor: '#000',
        // shadowOpacity: 0.05,
        // shadowRadius: 15,
        // shadowOffset: { width: 0, height: 8 },
        // elevation: 6,
        // marginBottom: 20,
    },
    sleekHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sleekLogoWrapper: {
        width: 72,
        alignItems: 'flex-start',
    },
    sleekLogoBox: {
        width: 30,
        height: 30,
        borderRadius: 16,
        // backgroundColor: colors.primaryLighter,
        alignItems: 'center',
        justifyContent: 'center',
        // borderWidth: 1,
        // borderColor: colors.primary + '15',
    },
    sleekInfoColumn: {
        flex: 1,
        paddingLeft: 4,
        paddingRight: 10,
    },
    sleekTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    sleekTitleText: {
        fontSize: 20,
        fontFamily: typography.fontFamily.bold,
        color: colors.text,
        flexShrink: 1,
    },
    sleekStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        backgroundColor: '#E8F5E9',
        borderRadius: 8,
    },
    sleekStatusText: {
        fontSize: 10,
        fontFamily: typography.fontFamily.bold,
        color: '#2E7D32',
    },
    sleekDivider: {
        height: 1,
        backgroundColor: colors.primary,
        width: '30%',
        marginBottom: 8,
    },
    sleekDetailsBlock: {
        gap: 4,
    },
    sleekInfoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    sleekIconWrap: {
        width: 14,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
    },
    sleekInfoText: {
        fontSize: 13,
        fontFamily: typography.fontFamily.medium,
        color: colors.textMuted,
        lineHeight: 18,
    },
    sleekAddressText: {
        fontSize: 12,
        fontFamily: typography.fontFamily.medium,
        color: colors.textMuted,
        lineHeight: 17,
        flex: 1,
    },
    sleekActionsColumn: {
        width: 36,
        gap: 10,
        alignItems: 'center',
    },
    sleekActionCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    dealsContainer: {
        paddingHorizontal: 16,
    },
    sectionDivider: {
        height: 3,
    },
    errorText: {
        fontSize: typography.fontSize.lg,
        color: colors.text,
        fontFamily: typography.fontFamily.medium,
        marginBottom: 16,
    },
    backButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: colors.primary,
    },
    backButtonText: {
        color: colors.white,
        fontFamily: typography.fontFamily.bold,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: '85%',
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalTitle: {
        fontSize: typography.fontSize.xl,
        fontFamily: typography.fontFamily.bold,
        color: colors.text,
    },
    modalBody: {
        padding: 24,
    },
    filterSection: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: typography.fontSize.base,
        fontFamily: typography.fontFamily.bold,
        color: colors.text,
        marginBottom: 12,
    },
    searchInput: {
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 16,
        fontSize: typography.fontSize.base,
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.border,
    },
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
    },
    chipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    chipText: {
        fontSize: typography.fontSize.sm,
        fontFamily: typography.fontFamily.medium,
        color: colors.text,
    },
    chipTextActive: {
        color: colors.white,
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 24,
        gap: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    clearBtn: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    clearBtnText: {
        fontSize: typography.fontSize.base,
        fontFamily: typography.fontFamily.bold,
        color: colors.textMuted,
    },
    applyBtn: {
        flex: 2,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        backgroundColor: colors.primary,
    },
    applyBtnText: {
        fontSize: typography.fontSize.base,
        fontFamily: typography.fontFamily.bold,
        color: colors.white,
    },
});

// WhatsApp Icon SVG - Real WhatsApp icon
function WhatsAppIconSVG({ size = 20, color = "#FFFFFF" }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
                fill={color}
            />
        </Svg>
    );
}

