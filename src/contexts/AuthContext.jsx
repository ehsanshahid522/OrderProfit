import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            loadUser();
        } else {
            setLoading(false);
        }
    }, []);

    async function loadUser() {
        try {
            const userData = await api.auth.getMe();
            setUser({
                id: userData._id,
                email: userData.email,
                businessName: userData.businessName,
                currency: userData.currency || 'USD'
            });
        } catch (error) {
            console.error('Error loading user:', error);
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    async function signUp(email, password, businessName) {
        try {
            const data = await api.auth.signup({ email, password, businessName });
            localStorage.setItem('token', data.token);
            setUser({
                id: data._id,
                email: data.email,
                businessName: data.businessName,
                currency: 'USD'
            });
            return { error: null };
        } catch (error) {
            return { error: error };
        }
    }

    async function signIn(email, password) {
        try {
            const data = await api.auth.signin({ email, password });
            localStorage.setItem('token', data.token);
            setUser({
                id: data._id,
                email: data.email,
                businessName: data.businessName,
                currency: 'USD'
            });
            return { error: null };
        } catch (error) {
            return { error: error };
        }
    }

    async function signOut() {
        localStorage.removeItem('token');
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
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
