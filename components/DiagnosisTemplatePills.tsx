import React from "react";
import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";

const DiagnosisTemplatePills = ({
  templates,
  onInsert,
  activeTemplateId,
}: {
  templates: { id: string; title: string; text: string }[];
  onInsert: (text: string, id: string) => void;
  activeTemplateId?: string | null;
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 4 }}
    >
      {templates.map((t) => (
        <TouchableOpacity
          key={t.id}
          style={[styles.pill, activeTemplateId === t.id && styles.pillActive]}
          onPress={() => onInsert(t.text, t.id)}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.pillText, activeTemplateId === t.id && styles.pillTextActive]}
          >
            {t.title}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default DiagnosisTemplatePills;

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  pillActive: {
    backgroundColor: "#be185d",
    borderColor: "#9d174d",
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  pillTextActive: {
    color: "#fff",
  },
});
