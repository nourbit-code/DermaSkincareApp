// app/login.tsx
// import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
// import { useState } from 'react';
// import { useRouter } from 'expo-router';

// const users = [
//   { email: "reception@example.com", password: "1234", role: "receptionist" },
//   { email: "doctor@example.com", password: "1234", role: "doctor" }
// ] as const;

// export default function Login() {
//   const router = useRouter();
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');

//   const handleLogin = () => {
//     const foundUser = users.find(
//       (u) => u.email === email && u.password === password
//     );

//     if (!foundUser) {
//       alert("Incorrect Email or Password");
//       return;
//     }

//     if (foundUser.role === "receptionist") {
//       router.push("/receptionist/dashboard");
//     } else if (foundUser.role === "doctor") {
//       router.push("/doctor/dashboard");
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>DermaSkincare Login</Text>

//       <TextInput
//         style={styles.input}
//         placeholder="Email"
//         placeholderTextColor="#444"
//         value={email}
//         onChangeText={setEmail}
//         autoCapitalize="none"
//         keyboardType="email-address"
//       />

//       <TextInput
//         style={styles.input}
//         placeholder="Password"
//         placeholderTextColor="#444"
//         secureTextEntry
//         value={password}
//         onChangeText={setPassword}
//       />

//       <TouchableOpacity style={styles.button} onPress={handleLogin}>
//         <Text style={styles.buttonText}>Login</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//     backgroundColor: '#F9F9F9',
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     marginBottom: 30,
//     color: '#9B084D',
//   },
//   input: {
//     width: '100%',
//     borderWidth: 1,
//     borderColor: '#777',
//     padding: 14,
//     borderRadius: 10,
//     marginBottom: 15,
//     backgroundColor: '#fff',
//   },
//   button: {
//     backgroundColor: '#9B084D',
//     paddingVertical: 15,
//     paddingHorizontal: 40,
//     borderRadius: 10,
//     marginTop: 10,
//   },
//   buttonText: {
//     color: '#fff',
//     fontWeight: 'bold',
//     textAlign: 'center',
//     fontSize: 16,
//   },
// });

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { login } from '../src/api/authApi';
import { useAuth } from './context/AuthContext';

export default function Login() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    
    try {
      const result = await login(email, password);
      
      if (result.success) {
        const { role, user } = result.data;
        
        // Store user data in AuthContext
        await setAuth(user, role);
        
        if (role === "receptionist") {
          router.push("/receptionist/dashboard");
        } else if (role === "doctor") {
          router.push("/doctor/dashboard");
        }
      } else {
        Alert.alert('Login Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>✨ DermaSkincare</Text>
        <Text style={styles.subtitle}>Welcome back! Please login.</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#F4F1F5",
    padding: 20,
  },
  card: {
    width: "50%",
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#9B084D",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 14,
    borderRadius: 12,
    marginBottom: 15,
    backgroundColor: "#FAFAFA",
  },
  button: {
    backgroundColor: "#9B084D",
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 5,
  },
  buttonDisabled: {
    backgroundColor: "#C084A5",
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
    fontSize: 16,
  },
});
