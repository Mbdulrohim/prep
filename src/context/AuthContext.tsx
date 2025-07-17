"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  User,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, onSnapshot, DocumentData } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// Define the shape of our custom user profile data stored in Firestore
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  university: string | null;
  photoURL: string;
}

// The new shape of our context, including the user profile
interface AuthContextType {
  user: User | null; // The raw Firebase auth user
  userProfile: UserProfile | null; // The user's data from our 'users' collection
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (name: string, university: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // When a user logs in, create a reference to their document in the 'users' collection
        const userRef = doc(db, "users", user.uid);

        // Set up a real-time listener for the user's profile data
        const unsubProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            // If the profile exists, set it in our state
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            // If it's a new user, create their initial profile document in Firestore
            const newUserProfile: UserProfile = {
              uid: user.uid,
              email: user.email!,
              displayName: user.displayName!,
              university: null, // University is null until they set it up
              photoURL: user.photoURL!,
            };
            setDoc(userRef, newUserProfile);
            setUserProfile(newUserProfile);
          }
          setLoading(false);
        });
        return () => unsubProfile(); // Cleanup profile listener on logout
      } else {
        // If no user is logged in, clear all state
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe(); // Cleanup auth listener on unmount
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  // Function to update the user's name and university
  const updateUserProfile = async (name: string, university: string) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    await setDoc(
      userRef,
      { displayName: name, university: university },
      { merge: true }
    );
  };

  const value = {
    user,
    userProfile,
    loading,
    signInWithGoogle,
    logout,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
