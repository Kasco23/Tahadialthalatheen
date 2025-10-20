import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { storeActiveProfile } from "../lib/activeProfile";
import type { Tables } from "../lib/types/supabase";

type Profile = Tables<"Profiles">;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, username: string) => Promise<void>;
  signIn: (
    email: string,
    password: string,
    keepSignedIn: boolean,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSession: () => Promise<{ session: Session | null; user: User | null } | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile data for the current user
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("Profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
      
      // Store profile in Netlify Blobs for quick access
      if (data) {
        try {
          await storeActiveProfile(userId, data);
        } catch (blobError) {
          // Log error but don't block profile loading
          console.error("Failed to store profile in Netlify Blobs:", blobError);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    }
  };

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string, username: string) => {
    // First check if username is already taken
    const { data: existingUser, error: checkError } = await supabase
      .from("Profiles")
      .select("username")
      .eq("username", username)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      throw new Error(`Failed to check username availability: ${checkError.message}`);
    }

    if (existingUser) {
      throw new Error("Username is already taken. Please choose another one.");
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          username,
        },
      },
    });

    if (error) throw error;
    if (data.user) {
      // Update profile with username
      await supabase
        .from("Profiles")
        .update({ username, name })
        .eq("id", data.user.id);
      
      await fetchProfile(data.user.id);
    }
  };

  const signIn = async (
    email: string,
    password: string,
    _keepSignedIn: boolean,
  ) => {
    // Sign in with Supabase Auth
    // Supabase Auth automatically handles session persistence with localStorage/sessionStorage
    // based on the persistSession config in supabaseClient.ts
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Note: Session persistence is already handled by Supabase's persistSession configuration
    // Netlify Blobs is used for game session data, not auth sessions
  };

  const signOut = async () => {
    // Sign out from all sessions (global scope)
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    if (error) throw error;
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error("No user logged in");

    const { error } = await supabase
      .from("Profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) throw error;
    await fetchProfile(user.id);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const refreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error("Error refreshing session:", error);
      return null;
    }
    return data;
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useProfile() {
  const { profile, updateProfile, refreshProfile, loading } = useAuth();
  return { profile, updateProfile, refreshProfile, loading };
}
