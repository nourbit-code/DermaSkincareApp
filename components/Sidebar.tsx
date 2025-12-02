import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Platform, Animated } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Home, Calendar, User, DollarSign, Users, LogOut } from "lucide-react-native";

type MenuPath =
  | "/receptionist/dashboard"
  | "/receptionist/book-appointment"
  | "/receptionist/add-patient"
  | "/receptionist/payments"
  | "/receptionist/patients-directory";

type MenuItem = {
  label: string;
  path: MenuPath;
  icon: React.ReactNode;
};

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [hovered, setHovered] = useState<MenuPath | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const menu: MenuItem[] = [
    { label: "Dashboard", path: "/receptionist/dashboard", icon: <Home size={24} color="#E0E0E0" /> },
    { label: "Book Appointment", path: "/receptionist/book-appointment", icon: <Calendar size={24} color="#E0E0E0" /> },
    { label: "Add Patient", path: "/receptionist/add-patient", icon: <User size={24} color="#E0E0E0" /> },
    { label: "Payments", path: "/receptionist/payments", icon: <DollarSign size={24} color="#E0E0E0" /> },
    { label: "Patients Directory", path: "/receptionist/patients-directory", icon: <Users size={24} color="#E0E0E0" /> },
  ];

  // Animate fade in/out
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
      <Pressable onPress={handleLogout} style={styles.logoutButton}>
        <LogOut size={24} color="#E0E0E0" />
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
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
  menuContainer: {
    flex: 1,
    alignItems: "center",
  },
  iconWrapper: {
    position: "relative",
    marginVertical: 15,
  },
  iconButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  active: {
    backgroundColor: "#80043C",
    borderRadius: 8,
  },
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
  tooltipText: {
    color: "#fff",
    fontSize: 12,
  },
  logoutButton: {
    marginBottom: 10,
    alignItems: "center",
  },
  logoutText: {
    color: "#E0E0E0",
    fontSize: 10,
    marginTop: 2,
  },
});
