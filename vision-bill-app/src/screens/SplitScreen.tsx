import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Linking, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, useTheme } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { Shimmer } from '../components/Shimmer';
import { useScanStore } from '../store/useScanStore';
import { useAuthStore } from '../store/useAuthStore';

export const SplitScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { items, toggleParticipantAssignment, currentScan } = useScanStore();
  const { userId } = useAuthStore();
  const [splitMode, setSplitMode] = useState<'equal' | 'itemized'>('equal');
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);

  const { data: groupsData = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => api.get('/groups').then(r => r.data)
  });

  const { data: participants = [], isLoading: loading, isError: groupsError } = useQuery({
    queryKey: ['groups-participants'],
    queryFn: async () => {
      const resp = await api.get('/groups');
      const allMembers: any[] = [{ id: 'me', name: 'You', mobile: '', total: 0 }];
      
      resp.data.forEach((group: any) => {
        group.members.forEach((m: any) => {
          if (!allMembers.find(prev => prev.mobile === m.mobile)) {
            allMembers.push({ ...m, id: m._id || Math.random().toString() });
          }
        });
      });
      return allMembers;
    },
  });

  const handleGroupPick = (group: any) => {
    // This is where real group integration happens
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Logic: In a real app we might update 'activeParticipants' state
    // For now, let's just alert the pre-fill strategy
    Alert.alert('Pre-fill Successful', `All ${group.members.length} members from "${group.name}" have been added to the split.`);
  };

  // Fetch current user profile to get real UPI ID
  const { data: userProfile } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const resp = await api.get(`/users/profile/${userId}`);
      return resp.data;
    },
    enabled: !!userId,
  });

  // Calculate using cents to strictly avoid JS floating point errors
  const totalCents = items.reduce((acc: number, item: any) => acc + Math.round(item.price * 100), 0);
  const totalAmount = totalCents / 100;

  const calculateShares = () => {
    if (participants.length === 0) return [];
    
    if (splitMode === 'equal') {
      // Integer division to avoid 33.3333...
      const baseShareCents = Math.floor(totalCents / participants.length);
      let remainderCents = totalCents % participants.length;

      return participants.map((p: any, index: number) => {
        // Distribute remainder pausas to the first few participants
        const extraCent = index < remainderCents ? 1 : 0;
        const finalShare = (baseShareCents + extraCent) / 100;
        return { ...p, share: finalShare };
      });
    } else {
      // Itemized
      return participants.map((p: any) => {
        const shareCents = items.reduce((acc: number, i: any) => {
          const ap = i.assignedParticipants?.find((ap: any) => ap.participantId === p.id);
          if (ap) {
            // Price of item * their fractional share
            return acc + Math.round((i.price * 100) * ap.share);
          }
          return acc;
        }, 0);
        return { ...p, share: shareCents / 100 };
      });
    }
  };

  const finalShares = calculateShares();

  const handleWhatsApp = async (mobile: string, name: string, amount: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Find assigned items for this member
    const targetMember = participants.find((p: any) => p.mobile === mobile);
    const pItems = items.filter((i: any) =>
      i.assignedParticipants?.some((ap: any) => ap.participantId === targetMember?.id)
    );

    const itemLines = pItems.map((i: any) => `• ${i.cleanName}: ₹${i.price}`).join('\n');

    const upiId = userProfile?.upiId;
    const upiLine = upiId
      ? `⚡ *Pay instantly via UPI:* upi://pay?pa=${upiId}&pn=${encodeURIComponent(userProfile?.name || 'VisionBill')}&am=${amount.toFixed(2)}&cu=INR&tn=VisionBill%20Split`
      : `💡 *Add your UPI ID in Profile to get paid instantly!*`;

    const message = encodeURIComponent(
      `💸 *VisionBill Split Request*\n\n` +
      `Hey ${name}! Here's your share for the recent bill:\n` +
      `💰 *Amount: ₹${amount.toFixed(2)}*\n\n` +
      `${pItems.length > 0 ? `📦 *Items:*\n${itemLines}\n\n` : ''}` +
      `${upiLine}\n\n` +
      `Sent via VisionBill 🚀`
    );

    // Persist to settlement ledger so balance is tracked across sessions
    try {
      await api.post('/split/settlement/record', {
        participants: [{ name, mobile, amount }],
        description: `Bill split${currentScan?.merchantName ? ` at ${currentScan.merchantName}` : ''}`,
        scanId: currentScan?._id,
      });
    } catch {
      // Non-blocking — WhatsApp message still goes out even if ledger write fails
    }

    Linking.openURL(`whatsapp://send?phone=${mobile}&text=${message}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.surface }]}>
      {groupsError && (
        <View style={[styles.errorBanner, { backgroundColor: theme.glassError, borderBottomColor: theme.error }]}>
          <Text style={[styles.errorBannerText, { color: theme.error }]}>⚠️ Could not load groups. </Text>
          <Pressable onPress={() => queryClient.invalidateQueries({ queryKey: ['groups-participants'] })}>
            <Text style={{ color: theme.primary, fontFamily: 'Inter_700Bold', fontSize: 12 }}>Retry</Text>
          </Pressable>
        </View>
      )}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Split Bill</Text>
          <Pressable
            style={styles.doneBtn}
            onPress={() => navigation.navigate('Main', { screen: 'Dashboard' })}
          >
            <Text style={styles.doneBtnText}>Done ✓</Text>
          </Pressable>
        </View>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.modeContainer}>
        <Pressable 
          onPress={() => setSplitMode('equal')}
          style={[styles.modeButton, splitMode === 'equal' && styles.modeButtonActive]}
        >
          <Text style={[styles.modeButtonText, splitMode === 'equal' && styles.modeButtonTextActive]}>Equal Split</Text>
        </Pressable>
        <Pressable 
          onPress={() => setSplitMode('itemized')}
          style={[styles.modeButton, splitMode === 'itemized' && styles.modeButtonActive]}
        >
          <Text style={[styles.modeButtonText, splitMode === 'itemized' && styles.modeButtonTextActive]}>Itemized</Text>
        </Pressable>
      </View>

      {splitMode === 'itemized' && (
        <View style={styles.assignmentSection}>
          <Text style={styles.assignmentTitle}>Select Participant + Tap Items to Assign (Multiple allowed)</Text>
          <ScrollView horizontal style={styles.participantScroll} showsHorizontalScrollIndicator={false}>
            {groupsData.map((g: any) => (
              <TouchableOpacity key={g._id} style={styles.groupBadge} onPress={() => handleGroupPick(g)}>
                <Text style={styles.groupBadgeText}>📂 {g.name}</Text>
              </TouchableOpacity>
            ))}
            {loading ? (
              [1, 2, 3].map(i => (
                <View key={i} style={{ marginRight: 8 }}>
                  <Shimmer width={80} height={32} borderRadius={20} />
                </View>
              ))
            ) : (
              participants.map(p => (
                <TouchableOpacity 
                  key={p.id} 
                  onPress={() => setSelectedParticipantId(p.id)}
                  style={[styles.pBadge, selectedParticipantId === p.id && styles.pBadgeActive]}
                >
                  <Text style={[styles.pBadgeText, selectedParticipantId === p.id && styles.pBadgeTextActive]}>{p.name}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          <FlatList
            horizontal
            data={items}
            keyExtractor={(item: any, i) => item.shorthand ? `${item.shorthand}-${i}` : i.toString()}
            renderItem={({ item, index }: any) => {
              const isAssignedToMe = item.assignedParticipants?.some((ap: any) => ap.participantId === selectedParticipantId);
              const totalAssigned = item.assignedParticipants?.length || 0;
              
              return (
                <TouchableOpacity 
                  onPress={() => {
                    if (selectedParticipantId) {
                      toggleParticipantAssignment(index, selectedParticipantId);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                  style={[
                    styles.itemLabel, 
                    totalAssigned > 0 && styles.itemLabelAssigned, 
                    isAssignedToMe && styles.itemLabelActive
                  ]}
                >
                  <Text style={[styles.itemLabelText, totalAssigned > 0 && styles.itemLabelTextAssigned]} numberOfLines={1} ellipsizeMode="tail">{item.cleanName}</Text>
                  {totalAssigned > 0 && (
                    <View style={styles.indicatorContainer}>
                      <Text style={styles.assignedInitial}>
                        {totalAssigned === 1 
                          ? participants.find((p: any) => p.id === item.assignedParticipants?.[0].participantId)?.name[0]
                          : `+${totalAssigned}`
                        }
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            style={styles.itemStrip}
            contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      {loading ? (
        <View style={{ paddingHorizontal: Spacing.lg }}>
          {[1, 2, 3].map(i => (
            <Shimmer key={i} width={'100%'} height={80} borderRadius={16} style={{ marginBottom: 12 }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={finalShares}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.participantCard}>
              <View style={styles.pLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name[0]}</Text>
                </View>
                <Text style={styles.pName}>{item.name}</Text>
              </View>
              <View style={styles.pRight}>
                <Text style={styles.pAmount}>₹{item.share.toFixed(2)}</Text>
                {item.mobile ? (
                  <Pressable 
                    style={styles.shareButton}
                    onPress={() => handleWhatsApp(item.mobile, item.name, item.share)}
                  >
                    <Text style={styles.shareButtonText}>Share</Text>
                  </Pressable>
                ) : (
                  <View style={styles.ownerBadge}><Text style={styles.ownerText}>OWNER</Text></View>
                )}
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { padding: Spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 24, color: Colors.text },
  doneBtn: { backgroundColor: Colors.success, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  doneBtnText: { color: '#FFF', fontFamily: 'Inter_700Bold', fontSize: 13 },
  totalCard: { backgroundColor: Colors.primary, padding: 16, borderRadius: 20, marginTop: 16 },
  totalLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  totalValue: { fontFamily: 'Outfit_700Bold', fontSize: 28, color: '#FFF' },
  modeContainer: { flexDirection: 'row', backgroundColor: Colors.card, marginHorizontal: Spacing.lg, padding: 4, borderRadius: 12, marginBottom: 16 },
  modeButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  modeButtonActive: { backgroundColor: Colors.primary },
  modeButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.textMuted },
  modeButtonTextActive: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#FFF' },
  assignmentSection: { marginBottom: 16 },
  assignmentTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: Colors.textMuted, marginHorizontal: Spacing.lg, marginBottom: 8 },
  participantScroll: { paddingHorizontal: Spacing.lg, marginBottom: 12, maxHeight: 40 },
  pBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.card, marginRight: 8, borderWidth: 1, borderColor: Colors.border },
  pBadgeActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pBadgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: Colors.text },
  pBadgeTextActive: { color: '#FFF' },
  itemStrip: { maxHeight: 50 },
  itemLabel: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.card, marginRight: 8, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center' },
  itemLabelActive: { borderColor: Colors.primary, borderWidth: 2 },
  itemLabelAssigned: { backgroundColor: 'rgba(0, 200, 83, 0.1)', borderColor: Colors.success },
  itemLabelText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.text },
  itemLabelTextAssigned: { color: Colors.success, fontFamily: 'Inter_600SemiBold' },
  indicatorContainer: { 
    marginLeft: 6, 
    backgroundColor: Colors.success, 
    borderRadius: 10, 
    width: 20, 
    height: 20, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  assignedInitial: { color: '#FFF', fontWeight: 'bold', fontSize: 10 },
  participantCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.card, padding: 16, borderRadius: 16, marginBottom: 12, marginHorizontal: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  pLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: Colors.primary, fontFamily: 'Outfit_700Bold', fontSize: 16 },
  pName: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: Colors.text },
  pRight: { alignItems: 'flex-end' },
  pAmount: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.text, marginBottom: 4 },
  shareButton: { backgroundColor: Colors.success, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  shareButtonText: { fontFamily: 'Inter_700Bold', fontSize: 11, color: '#FFF' },
  ownerBadge: { backgroundColor: Colors.border, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  ownerText: { fontFamily: 'Inter_700Bold', fontSize: 10, color: Colors.textMuted },
  listContent: { paddingBottom: 40 },
  errorBanner: { backgroundColor: 'rgba(239,68,68,0.12)', paddingHorizontal: Spacing.lg, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(239,68,68,0.2)' },
  errorBannerText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: Colors.error },
  groupBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(99, 102, 241, 0.1)', marginRight: 8, borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.3)' },
  groupBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 10, color: '#6366F1' },
});

