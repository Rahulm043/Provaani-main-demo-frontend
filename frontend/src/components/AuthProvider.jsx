import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { authFetch } from '../utils/api.js';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadProfile = useCallback(async (activeSession) => {
        if (!activeSession) {
            setProfile(null);
            return;
        }
        try {
            const res = await authFetch('/api/crm/me');
            if (!res.ok) throw new Error('Profile fetch failed');
            setProfile(await res.json());
        } catch (err) {
            console.warn('[AuthProvider] CRM profile unavailable', err);
            setProfile(null);
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        async function initSession() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!mounted) return;
                setSession(session);
                await loadProfile(session);
            } catch (err) {
                console.warn('[AuthProvider] Session init failed', err);
                if (mounted) {
                    setSession(null);
                    setProfile(null);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        }

        initSession();

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoading(false);
            setTimeout(() => {
                loadProfile(session);
            }, 0);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [loadProfile]);

    const signOut = () => supabase.auth.signOut();

    return (
        <AuthContext.Provider value={{ session, loading, user: session?.user, profile, role: profile?.role, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
