import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
const Users = () => <MaterialIcons name="group" size={22} />;

const TABS = [
  { key: 'Home', label: 'Home', icon: (props) => <MaterialIcons name="home" size={24} color={props.color} /> },
  { key: 'Announcements', label: 'News', icon: (props) => <MaterialIcons name="announcement" size={24} color={props.color} /> },
  { key: 'Events', label: 'Events', icon: (props) => <MaterialIcons name="event" size={24} color={props.color} /> },
  { key: 'Serve', label: 'Serve', icon: (props) => <MaterialIcons name="group" size={24} color={props.color} /> },
];

export function TabBar({ state, descriptors, navigation, showServe }: any) {
  const tabs = showServe ? [...TABS] : TABS;
  return (
    <View style={styles.tabBar}>
      {tabs.map((tab, idx) => {
        const isFocused = state.index === idx;
        const Icon = tab.icon;
        return (
          <TouchableOpacity
            key={tab.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={() => navigation.navigate(tab.key)}
            style={[styles.tab, isFocused && styles.activeTab]}
          >
            {typeof Icon === 'function' ? Icon({ color: isFocused ? theme.colors.primary : theme.colors.muted }) : <Icon />}
            <Text style={[styles.label, isFocused && styles.activeLabel]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default TabBar;

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
      backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    paddingBottom: 4,
    paddingTop: 2,
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  activeTab: {},
  label: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
  activeLabel: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
