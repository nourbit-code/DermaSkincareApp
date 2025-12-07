import React from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  ScrollView 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

// --- Design System (Copied for component independence) ---
const THEME = {
  primary: "#be185d", // Pink-700
  secondary: "#0f172a",
  text: "#334155",
  textLight: "#94a3b8",
  danger: "#ef4444",
  border: "#e2e8f0",
  white: "#ffffff",
  radius: 12,
};

// --- Section Header (Helper) ---
const SectionHeader = ({ icon, title }: { icon: any, title: string }) => (
  <View style={uploaderStyles.sectionHeader}>
    <Ionicons name={icon} size={18} color={THEME.primary} />
    <Text style={uploaderStyles.sectionTitle}>{title}</Text>
  </View>
);

// --- Component Props Interface ---
interface PhotoItem {
  id: string;
  uri: string;
  tag: string;
  timestamp: string;
  caption: string;
}

interface ReusablePhotoUploaderProps {
  photos: PhotoItem[];
  setPhotos: React.Dispatch<React.SetStateAction<PhotoItem[]>>;
  patientId: string;
}

// =========================================================
// ⭐️ MAIN REUSABLE COMPONENT
// =========================================================
const ReusablePhotoUploader: React.FC<ReusablePhotoUploaderProps> = ({
  photos,
  setPhotos,
  patientId,
}) => {
  // NOTE: PhotoSort state is kept here to be local to the component
  const [photoSortNewest, setPhotoSortNewest] = React.useState(true);

  // --- Photo Picking Logic (Extracted from NormalView) ---
  const pickPhoto = async () => {
    // NOTE: This version simplifies the pick process for reuse. 
    // You would add the tagging modal back if needed.
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    
    if (!r.canceled && r.assets[0].uri) {
      const uri = r.assets[0].uri;
      const timestamp = new Date().toLocaleString('en-EG');
      
      // Default tag to 'Current' for simplicity in this reusable component
      const newPhoto: PhotoItem = { 
        id: Date.now().toString(), 
        uri, 
        tag: "Current", 
        timestamp, 
        caption: "" 
      };
      
      setPhotos(prev => [newPhoto, ...prev]);
    }
  };

  const deletePhoto = (id: string) => setPhotos(p => p.filter(x => x.id !== id));
  
  const displayedPhotos = React.useMemo(() => {
    return [...photos].sort((a, b) => {
      const tA = parseInt(a.id, 10);
      const tB = parseInt(b.id, 10);
      return photoSortNewest ? tB - tA : tA - tB;
    });
  }, [photos, photoSortNewest]);


  return (
    <View style={uploaderStyles.card}>
      <View style={uploaderStyles.headerRow}>
        <SectionHeader icon="images" title={`Patient Photos (${photos.length})`} />
        
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* Sort Button */}
          <TouchableOpacity
            style={uploaderStyles.outlineBtn}
            onPress={() => setPhotoSortNewest(!photoSortNewest)}
          >
            <Ionicons name="swap-vertical" size={14} color={THEME.text} />
            <Text style={uploaderStyles.outlineBtnText}>Sort: {photoSortNewest ? "Newest" : "Oldest"}</Text>
          </TouchableOpacity>
          
          {/* Add Photo Button */}
          <TouchableOpacity onPress={pickPhoto} style={uploaderStyles.iconBtn}>
            <Ionicons name="add" size={20} color={THEME.white} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={uploaderStyles.photoGrid}>
        {displayedPhotos.length === 0 && (
          <View style={uploaderStyles.emptyState}>
            <Text style={uploaderStyles.emptyText}>No clinical photos uploaded.</Text>
          </View>
        )}
        {displayedPhotos.map((p) => (
          <View key={p.id} style={uploaderStyles.photoCard}>
            {/* The line that was previously failing due to bad path/URI */}
            <Image source={{ uri: p.uri }} style={uploaderStyles.photoImg} /> 

            <View style={uploaderStyles.tagBadge}>
              <Text style={uploaderStyles.tagText}>{p.tag}</Text>
            </View>
            
            <TouchableOpacity style={uploaderStyles.deleteMini} onPress={() => deletePhoto(p.id)}>
              <Ionicons name="close" size={10} color={THEME.white} />
            </TouchableOpacity>
            
            <View style={uploaderStyles.photoFooter}>
              <Text style={uploaderStyles.timestampText}>{p.timestamp}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

// --- Styles for the Reusable Component ---
const uploaderStyles = StyleSheet.create({
  card: {
    backgroundColor: THEME.white,
    borderRadius: THEME.radius,
    padding: 16,
    marginBottom: 16,
    borderColor: THEME.border,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.secondary,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radius / 2,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  outlineBtnText: {
    fontSize: 12,
    color: THEME.text,
    marginLeft: 4,
  },
  iconBtn: {
    backgroundColor: THEME.primary,
    borderRadius: THEME.radius / 2,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  photoCard: {
    width: '48%', // Allows two photos per row
    aspectRatio: 1,
    borderRadius: THEME.radius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  photoImg: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  tagBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.primary,
  },
  deleteMini: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: THEME.danger,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  photoFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 4,
  },
  timestampText: {
    fontSize: 10,
    color: THEME.white,
    textAlign: 'center',
  },
  emptyState: {
    width: '100%',
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: THEME.radius,
    backgroundColor: THEME.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: THEME.textLight,
    fontStyle: 'italic',
    fontSize: 14,
  }
});

export default ReusablePhotoUploader;