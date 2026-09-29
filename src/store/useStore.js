import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useStore = create((set) => ({
  session: null,
  user: null,
  setSession: (session) => set({ session, user: session?.user || null }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },
}));
