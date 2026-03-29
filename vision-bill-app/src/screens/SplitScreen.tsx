import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Linking, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { useScanStore } from '../store/useScanStore';
import { Shimmer } from '../components/Shimmer';
import axios from 'axios';

export const SplitScreen = () => {
  const { items } = useScanStore();
  const [splitMode, setSplitMode] = useState<'equal' | 'itemized'>('equal');
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<any[]>([
    { id: 'me', name: 'You', mobile: '', total: 0 },
  ]);

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    try {
      const resp = await axios.get('http://localhost:3000/groups');
      const allMembers: any[] = [];
      
      resp.data.forEach((group: any) => {
        group.members.forEach((m: any) => {
          if (!allMembers.find(prev => prev.mobile === m.mobile)) {
            allMembers.push({ ...m, id: m._id || Math.random().toString() });
          }
        });
      });

      setParticipants([{ id: 'me', name: 'You', mobile: '', total: 0 }, ...allMembers]);
    } catch (err) {
      console.error('Fetch participants failed', err);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = items.reduce((acc, item) => acc + item.price, 0);

  const calculateShares = () => {
    if (splitMode === 'equal') {
      const share = totalAmount / participants.length;
      return participants.map(p => ({ ...p, share }));
    } else {
      // Itemized
      return participants.map(p => {
        const share = items.reduce((acc, i) => {
          const ap = i.assignedParticipants?.find(ap => ap.participantId === p.id);
          return acc + (ap ? i.price * ap.share : 0);
        }, 0);
        return { ...p, share };
      });
    }
  };

  const finalShares = calculateShares();

  const handleWhatsApp = async (mobile: string, name: string, amount: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Find assigned items for this member
    const targetMember = participants.find(p => p.mobile === mobile);
    const pItems = items.filter(i => 
      i.assignedParticipants?.some(ap => ap.participantId === targetMember?.id)
    );

    const itemLines = pItems.map(i => `• ${i.cleanName}: ₹${i.price}`).join('\n');
    const upiLink = `upi://pay?pa=aravind@upi&pn=VisionBill&am=${amount.toFixed(2)}&cu=INR&tn=VisionBill%20Split`;
    
    const message = encodeURIComponent(
      `💸 *VisionBill Split Request*\n\n` +
      `Hey ${name}! Here's your share for the recent bill:\n` +
      `💰 *Amount: ₹${amount.toFixed(2)}*\n\n` +
      `${pItems.length > 0 ? `📦 *Items:*\n${itemLines}\n\n` : ''}` +
      `⚡ *Pay instantly:* ${upiLink}\n\n` +
      `Sent via VisionBill 🚀`
    );
    
    Linking.openURL(`whatsapp://send?phone=${mobile}&text=${message}`);
  };

  const { toggleParticipantAssignment } = useScanStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Split Bill</Text>
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
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item, index }) => {
              const isAssignedToMe = item.assignedParticipants?.some(ap => ap.participantId === selectedParticipantId);
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
                  <Text style={[styles.itemLabelText, totalAssigned > 0 && styles.itemLabelTextAssigned]}>{item.cleanName}</Text>
                  {totalAssigned > 0 && (
                    <View style={styles.indicatorContainer}>
                      <Text style={styles.assignedInitial}>
                        {totalAssigned === 1 
                          ? participants.find(p => p.id === item.assignedParticipants?.[0].participantId)?.name[0]
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
  title: { fontFamily: 'Outfit_700Bold', fontSize: 24, color: Colors.text },
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
});

