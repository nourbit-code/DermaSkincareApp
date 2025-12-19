import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// User types
interface DoctorUser {
    id: number;
    name: string;
    email: string;
    specialty?: string;
}

interface ReceptionistUser {
    id: number;
    name: string;
    email: string;
}

type User = DoctorUser | ReceptionistUser;

interface AuthContextType {
    user: User | null;
    role: 'doctor' | 'receptionist' | null;
    isLoading: boolean;
    setAuth: (user: User, role: 'doctor' | 'receptionist') => Promise<void>;
    clearAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = '@derma_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<'doctor' | 'receptionist' | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load auth data from storage on mount
    useEffect(() => {
        loadAuthData();
    }, []);

    const loadAuthData = async () => {
        try {
            console.log('[AuthContext] Loading auth data from storage...');
            const authData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
            console.log('[AuthContext] Raw auth data:', authData);
            if (authData) {
                const parsed = JSON.parse(authData);
                console.log('[AuthContext] Parsed auth data:', parsed);
                console.log('[AuthContext] User ID:', parsed.user?.id);
                setUser(parsed.user);
                setRole(parsed.role);
            } else {
                console.log('[AuthContext] No auth data found in storage');
            }
        } catch (error) {
            console.error('[AuthContext] Error loading auth data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const setAuth = async (newUser: User, newRole: 'doctor' | 'receptionist') => {
        try {
            console.log('[AuthContext] Saving auth data:', { user: newUser, role: newRole });
            console.log('[AuthContext] User ID being saved:', newUser.id);
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: newUser, role: newRole }));
            setUser(newUser);
            setRole(newRole);
            console.log('[AuthContext] Auth data saved successfully');
        } catch (error) {
            console.error('[AuthContext] Error saving auth data:', error);
        }
    };

    const clearAuth = async () => {
        try {
            await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
            setUser(null);
            setRole(null);
        } catch (error) {
            console.error('Error clearing auth data:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, role, isLoading, setAuth, clearAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Helper hook to get doctor ID (for doctor dashboard)
export function useDoctorId(): number | null {
    const { user, role } = useAuth();
    if (role === 'doctor' && user) {
        return user.id;
    }
    return null;
}

// Helper hook to get receptionist ID (for receptionist dashboard)
export function useReceptionistId(): number | null {
    const { user, role } = useAuth();
    if (role === 'receptionist' && user) {
        return user.id;
    }
    return null;
}
