import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

export function AvatarMenu({ name, email, role, church, onSignOut }: {
  name: string;
  email: string;
  role: string;
  church: string;
  onSignOut: () => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <View>
      <TouchableOpacity onPress={() => setVisible(true)}>
        <View style={styles.avatar} />
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.menu}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.email}>{email}</Text>
            <Text style={styles.role}>{role}</Text>
            <Text style={styles.church}>{church}</Text>
            <TouchableOpacity onPress={onSignOut} style={styles.signOutBtn}>
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-end',
  },
  menu: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  name: {
    fontWeight: theme.typography.fontWeight.bold,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.primaryText,
    marginBottom: theme.spacing.xs,
  },
  email: {
    color: theme.colors.muted,
    marginBottom: theme.spacing.xs,
  },
  role: {
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  church: {
    color: theme.colors.muted,
    marginBottom: theme.spacing.lg,
  },
  signOutBtn: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.error,
  },
  signOutText: {
    color: theme.colors.onPrimary,
    fontWeight: theme.typography.fontWeight.bold,
  },
});
