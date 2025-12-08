import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ServiceKey, THEME } from './PatientInfoBar';

interface ServiceTabsProps {
  activeService: ServiceKey;
  setActiveService: React.Dispatch<React.SetStateAction<ServiceKey>>;
}

const ServiceTabs: React.FC<ServiceTabsProps> = ({ activeService, setActiveService }) => (
  <View style={styles.tabContainer}>
    {['DIAGNOSIS', 'LASER'].map((service) => (
      <Pressable
        key={service}
        style={[styles.tab, activeService === service && styles.tabActive]}
        onPress={() => setActiveService(service as ServiceKey)}
      >
        <MaterialCommunityIcons
          name={service === 'DIAGNOSIS' ? 'stethoscope' : 'laser-pointer'}
          size={16}
          color={activeService === service ? THEME.primary : THEME.textLight}
          style={{ marginRight: 6 }}
        />
        <Text style={[styles.tabText, activeService === service && styles.tabTextActive]}>
          {service === 'DIAGNOSIS' ? 'Clinical Diagnosis' : 'Laser Session'}
        </Text>
      </Pressable>
    ))}
  </View>
);

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: THEME.border,
    borderRadius: 24,
    padding: 4,
    marginHorizontal: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 140,
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: THEME.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  tabText: { color: THEME.text, fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: THEME.primary, fontWeight: '700' },
});

export default ServiceTabs;
