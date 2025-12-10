import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Platform, Animated } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Home, Calendar, BookOpen, LogOut, HomeIcon, Box } from "lucide-react-native";

type MenuPath =
  | "/doctor/dashboard"
  | "/doctor/todays-patients"
  | "/doctor/patient-history"
  | "/doctor/DoctorInventory";


type MenuItem = {
  label: string;
  path: MenuPath;
  icon: React.ReactNode;
};

export default function DoctorSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [hovered, setHovered] = useState<string | null>(null); // string to allow "logout"
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const menu: MenuItem[] = [
    { label: "Inventory", path: "/doctor/DoctorInventory", icon: <Box size={24} color="#E0E0E0" /> },
    { label: "Dashboard", path: "/doctor/dashboard", icon: <Home size={24} color="#E0E0E0" /> },
    { label: "Today's Patients", path: "/doctor/todays-patients", icon: <Calendar size={24} color="#E0E0E0" /> },
    { label: "Patient History", path: "/doctor/patient-history", icon: <BookOpen size={24} color="#E0E0E0" /> },
  ];

  // Fade animation for tooltip
  useEffect(() => {
    if (hovered && Platform.OS === "web") {
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    } else {
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [hovered]);

  const handlePress = (item: MenuItem) => router.push(item.path);
  const handleLogout = () => router.replace("/login");

  return (
    <View style={styles.sidebar}>
      {/* Menu Icons */}
      <View style={styles.menuContainer}>
        {menu.map((item) => {
          const isActive = pathname === item.path;
          const showTooltip = hovered === item.path;

          return (
            <View key={item.path} style={styles.iconWrapper}>
              <Pressable
                onPress={() => handlePress(item)}
                onHoverIn={() => Platform.OS === "web" && setHovered(item.path)}
                onHoverOut={() => Platform.OS === "web" && setHovered(null)}
                style={[styles.iconButton, isActive && styles.active]}
              >
                {item.icon}
              </Pressable>

              {Platform.OS === "web" && showTooltip && (
                <Animated.View style={[styles.tooltip, { opacity: fadeAnim }]}>
                  <Text style={styles.tooltipText}>{item.label}</Text>
                </Animated.View>
              )}
            </View>
          );
        })}
      </View>

      {/* Logout Button */}
      <View style={styles.iconWrapper}>
        <Pressable
          onPress={handleLogout}
          onHoverIn={() => Platform.OS === "web" && setHovered("logout")}
          onHoverOut={() => Platform.OS === "web" && setHovered(null)}
          style={styles.iconButton}
        >
          <LogOut size={24} color="#E0E0E0" />
        </Pressable>

        {Platform.OS === "web" && hovered === "logout" && (
          <Animated.View style={[styles.tooltip, { opacity: fadeAnim }]}>
            <Text style={styles.tooltipText}>Logout</Text>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 80,
    backgroundColor: "#9B084D",
    paddingVertical: 30,
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuContainer: { flex: 1, alignItems: "center" },
  iconWrapper: { position: "relative", marginVertical: 15 },
  iconButton: { justifyContent: "center", alignItems: "center" },
  active: { backgroundColor: "#80043C", borderRadius: 8 },
  tooltip: {
    position: "absolute",
    left: 90,
    top: "50%",
    transform: [{ translateY: -12 }],
    backgroundColor: "#333",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1000,
  },
  tooltipText: { color: "#fff", fontSize: 12 },
});
