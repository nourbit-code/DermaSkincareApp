// WE DONT NEED THIS FILE BUT LEAVE IT NOW "NOUR"
import { View, Text, StyleSheet } from 'react-native';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Receptionist Dashboard</Text>
      <Text style={styles.subtitle}>
        Welcome to DermaSkincare — manage appointments, patients, and payments here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9B084D',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
