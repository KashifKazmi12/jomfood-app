import React from 'react';
import { View, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import DealCard from './DealCard';
import { useNavigation } from '@react-navigation/native';
import { dealsAPI } from '../../api/deals';
import { useSelector } from 'react-redux';
import { showToast } from '../toast';
import ClaimedDealModal from './ClaimedDealModal';

export default function DealsList() {
  const user = useSelector(state => state.auth.user);
  const navigation = useNavigation();
  const [claimVisible, setClaimVisible] = React.useState(false);
  const [claimData, setClaimData] = React.useState(null);

  const {
    data,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    isRefetching,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['deals', 'active'],
    queryFn: ({ pageParam = 1 }) => dealsAPI.listActive({ page: pageParam, limit: 12, sort_by: 'newest' }),
    getNextPageParam: lastPage => {
      const p = lastPage?.pagination;
      if (p?.has_next && p?.current_page) return p.current_page + 1;
      // If no pagination provided, stop after first page
      return undefined;
    },
  });

  const items = React.useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(p => p.deals || []);
  }, [data]);

  const onEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  const renderItem = ({ item }) => (
    <DealCard
      deal={item}
      onView={() => navigation.navigate('DealDetail', { id: item._id })}
      onQuickClaim={async () => {
        if (!user?._id) {
          showToast.info('Login required', 'Please log in to claim this deal');
          return;
        }
        try {
          const res = await dealsAPI.claim({ dealId: item._id, customerId: user._id });
          setClaimData(res);
          setClaimVisible(true);
          showToast.success('Deal claimed', 'QR code is ready');
        } catch (e) {
          showToast.error('Failed to claim', e.message || 'Please try again');
        }
      }}
    />
  );

  if (isLoading) {
    return (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <>
    <FlatList
      data={items}
      keyExtractor={item => item._id}
      renderItem={renderItem}
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null}
    />
    <ClaimedDealModal visible={claimVisible} onClose={() => setClaimVisible(false)} data={claimData} />
    </>
  );
}


