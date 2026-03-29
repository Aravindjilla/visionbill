import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Shimmer } from '../components/Shimmer';
import axios from 'axios';
import { ErrorView } from '../components/ErrorView';

export const GroupsScreen = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberMobile, setNewMemberMobile] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    setError(false);
    try {
      const resp = await axios.get('http://localhost:3000/groups');
      setGroups(resp.data);
      if (selectedGroup) {
        const updated = resp.data.find((g: any) => g._id === selectedGroup._id);
        if (updated) setSelectedGroup(updated);
      }
    } catch (err) {
      console.error('Fetch groups failed', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return <ErrorView onRetry={fetchGroups} />;
  }

  const createGroup = async () => {
    if (!newGroupName) return;
    setLoading(true);
    try {
      await axios.post('http://localhost:3000/groups', { name: newGroupName });
      fetchGroups();
      setModalVisible(false);
      setNewGroupName('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Create group failed', err);
    } finally {
      setLoading(false);
    }
  };

  const addMember = async () => {
    if (!newMemberName || !newMemberMobile) return;
    try {
      await axios.post(`http://localhost:3000/groups/${selectedGroup._id}/members`, {
        name: newMemberName,
        mobile: newMemberMobile
      });
      setNewMemberName('');
      setNewMemberMobile('');
      fetchGroups();
    } catch (err) {
      console.error('Add member failed', err);
    }
  };

  const deleteMember = async (index: number) => {
    try {
      await axios.delete(`http://localhost:3000/groups/${selectedGroup._id}/members/${index}`);
      fetchGroups();
    } catch (err) {
      console.error('Delete member failed', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Frequent Groups</Text>
        <Pressable 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ New Group</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: Spacing.lg, marginTop: 20 }}>
          {[1, 2, 3].map(i => (
            <Shimmer key={i} width={'100%'} height={72} style={{ marginBottom: 12, borderRadius: 16 }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <Pressable 
              style={styles.groupCard}
              onPress={() => {
                setSelectedGroup(item);
                setMemberModalVisible(true);
              }}
            >
              <View>
                <Text style={styles.groupName}>{item.name}</Text>
                <Text style={styles.groupMembers}>{item.members?.length || 0} members</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Group Create Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Group</Text>
            <TextInput 
              style={styles.modalInput}
              placeholder="Roommates, Family, etc."
              placeholderTextColor={Colors.textMuted}
              value={newGroupName}
              onChangeText={setNewGroupName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={createGroup} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Member Management Modal */}
      <Modal visible={memberModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedGroup?.name} Members</Text>
              <Pressable onPress={() => setMemberModalVisible(false)}>
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.memberList}>
              {selectedGroup?.members.map((m: any, i: number) => (
                <View key={i} style={styles.memberRow}>
                  <Text style={styles.memberName}>{m.name} ({m.mobile})</Text>
                  <Pressable onPress={() => deleteMember(i)}>
                    <Text style={{ color: Colors.error, fontSize: 12 }}>Remove</Text>
                  </Pressable>
                </View>
              ))}
            </View>

            <View style={styles.divider} />
            <Text style={styles.modalSubtitle}>Add New Member</Text>
            <TextInput 
              style={[styles.modalInput, { marginBottom: 12 }]}
              placeholder="Member Name"
              placeholderTextColor={Colors.textMuted}
              value={newMemberName}
              onChangeText={setNewMemberName}
            />
            <TextInput 
              style={styles.modalInput}
              placeholder="Mobile (91...)"
              placeholderTextColor={Colors.textMuted}
              value={newMemberMobile}
              onChangeText={setNewMemberMobile}
            />
            <Pressable onPress={addMember} style={[styles.saveBtn, { marginTop: 16 }]}>
              <Text style={styles.saveBtnText}>Add to Group</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { padding: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 24, color: Colors.text },
  addButton: { backgroundColor: Colors.card, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  addButtonText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: Colors.primary },
  listContent: { padding: Spacing.lg },
  groupCard: { backgroundColor: Colors.card, padding: Spacing.md, borderRadius: 16, marginBottom: Spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  groupName: { fontFamily: 'Inter_700Bold', fontSize: 18, color: Colors.text },
  groupMembers: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  chevron: { color: Colors.textMuted, fontSize: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: Spacing.xl },
  modalContent: { backgroundColor: Colors.card, padding: Spacing.xl, borderRadius: 24, borderWidth: 1, borderColor: Colors.border },
  modalTitle: { fontFamily: 'Outfit_700Bold', fontSize: 20, color: Colors.text, marginBottom: 20 },
  modalInput: { backgroundColor: Colors.surface, padding: 16, borderRadius: 12, color: Colors.text, fontFamily: 'Inter_400Regular', fontSize: 16, borderWidth: 1, borderColor: Colors.border },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24 },
  cancelBtn: { marginRight: 24 },
  cancelBtnText: { fontFamily: 'Inter_600SemiBold', color: Colors.textMuted, fontSize: 16 },
  saveBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  saveBtnText: { fontFamily: 'Inter_700Bold', color: '#FFF', fontSize: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  closeText: { color: Colors.textMuted, fontSize: 20, fontWeight: 'bold' },
  memberList: { marginBottom: 20 },
  memberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, padding: 12, borderRadius: 8, marginBottom: 8 },
  memberName: { fontFamily: 'Inter_600SemiBold', color: Colors.text, fontSize: 14 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 16 },
  modalSubtitle: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: Colors.text, marginBottom: 12 },
});

