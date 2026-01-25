import { Screen } from "@/components/screen";
import { StyleSheet, Text, View } from "react-native";

export default function ServiceScreen() {
  return (
    <Screen>
      <Text style={styles.title}>Service</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Service tracking</Text>
        <Text style={styles.cardText}>
          Log and track maintenance like oil changes, brake services, fluid
          changes, and inspections.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Coming soon</Text>
        <Text style={styles.cardText}>
          • Service intervals (time / mileage)
          {"\n"}• Reminders & notifications
          {"\n"}• History timeline
          {"\n"}• Export service records
        </Text>
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          🚧 Service tracking is under construction
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 14,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  cardText: {
    color: "#bbb",
    lineHeight: 20,
  },
  placeholder: {
    marginTop: 30,
    paddingVertical: 30,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#0f0f0f",
    alignItems: "center",
  },
  placeholderText: {
    color: "#888",
    fontWeight: "600",
  },
});
