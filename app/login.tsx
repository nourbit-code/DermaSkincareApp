// app/login.tsx
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';

const users = [
  { email: "reception@example.com", password: "1234", role: "receptionist" },
  { email: "doctor@example.com", password: "1234", role: "doctor" }
] as const;

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    const foundUser = users.find(
      (u) => u.email === email && u.password === password
    );

    if (!foundUser) {
      alert("Incorrect Email or Password");
      return;
    }

    if (foundUser.role === "receptionist") {
      router.push("/receptionist/dashboard");
    } else if (foundUser.role === "doctor") {
      router.push("/doctor/dashboard");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DermaSkincare Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#444"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#444"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9F9F9',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#9B084D',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#777',
    padding: 14,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#9B084D',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});
