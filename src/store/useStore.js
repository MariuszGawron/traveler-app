import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useStore = create((set) => ({
  session: null,
  user: null,
  mapSettings: (() => {
    try {
      const stored = localStorage.getItem('traveler_mapSettings');
      return stored ? JSON.parse(stored) : { main: false, transport: false, accommodations: false, carRentals: false, parkings: false };
    } catch {
      return { main: false, transport: false, accommodations: false, carRentals: false, parkings: false };
    }
  })(),
  setMapSettings: (settings) => {
    localStorage.setItem('traveler_mapSettings', JSON.stringify(settings));
    set({ mapSettings: settings });
  },
  setSession: (session) => set({ session, user: session?.user || null }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },
}));
