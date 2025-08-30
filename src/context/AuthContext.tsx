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
    let profileUnsubscribe: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setUser(user);
          // When a user logs in, create a reference to their document in the 'users' collection
          const userRef = doc(db, "users", user.uid);

          // Clean up previous profile listener if exists
          if (profileUnsubscribe) {
            profileUnsubscribe();
            profileUnsubscribe = null;
          }

          // Set up a real-time listener for the user's profile data with error handling
          profileUnsubscribe = onSnapshot(
            userRef, 
            (docSnap) => {
              try {
                if (docSnap.exists()) {
                  // If the profile exists, set it in our state
                  setUserProfile(docSnap.data() as UserProfile);
                } else {
                  // If it's a new user, create their initial profile document in Firestore
                  const newUserProfile: UserProfile = {
                    uid: user.uid,
                    email: user.email || "",
                    displayName: user.displayName || "User",
                    university: null, // University is null until they set it up
                    photoURL: user.photoURL || "",
                  };
                  setDoc(userRef, newUserProfile).catch((error) => {
                    console.error("Error creating user profile:", error);
                  });
                  setUserProfile(newUserProfile);
                }
                setLoading(false);
              } catch (error) {
                console.error("Error processing user profile snapshot:", error);
                setLoading(false);
              }
            },
            (error) => {
              console.error("Error listening to user profile:", error);
              // Create a basic profile from auth data in case of error
              if (user) {
                const fallbackProfile: UserProfile = {
                  uid: user.uid,
                  email: user.email || "",
                  displayName: user.displayName || "User",
                  university: null,
                  photoURL: user.photoURL || "",
                };
                setUserProfile(fallbackProfile);
              }
              setLoading(false);
            }
          );
        } else {
          // If no user is logged in, clear all state
          if (profileUnsubscribe) {
            profileUnsubscribe();
            profileUnsubscribe = null;
          }
          setUser(null);
          setUserProfile(null);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
    };
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  // Function to update the user's name and university
  const updateUserProfile = async (name: string, university: string) => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(
        userRef,
        { displayName: name, university: university },
        { merge: true }
      );
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
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
