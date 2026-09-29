import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useAccess() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAccessUsers = async (tripId) => {
    try {
      setLoading(true);
      // Pobieramy same uprawnienia (bez id, bo tabela go nie ma)
      const { data: accessData, error: accessError } = await supabase
        .from('trip_access')
        .select('access_level, user_id, trip_id')
        .eq('trip_id', tripId);
        
      if (accessError) throw accessError;
      if (!accessData || accessData.length === 0) {
        setUsers([]);
        return [];
      }
      
      const userIds = accessData.map(a => a.user_id);
      
      // Pobieramy profile oddzielnym zapytaniem
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email, name')
        .in('id', userIds);
        
      // Łączymy w pamięci
      const merged = accessData.map(access => ({
        ...access,
        profiles: profilesData?.find(p => p.id === access.user_id) || null
      }));
      
      setUsers(merged);
      return merged;
    } catch (err) {
      console.error('Błąd pobierania udostępnień:', err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const searchProfiles = async (query) => {
    if (!query || query.length < 3) return [];
    try {
      // Wykorzystujemy bezpieczną funkcję RPC do wyszukiwania po e-mailu
      // która wymaga DOKŁADNEGO dopasowania (niemożliwe do "zeskrapowania")
      const { data, error } = await supabase
        .rpc('search_user_by_email', { search_email: query });
        
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Błąd wyszukiwania:', err.message);
      return [];
    }
  };

  const fetchSuggestedUsers = async (currentUserId) => {
    try {
      // Pobierz wszystkie trip_id do których currentUser ma dostęp
      const { data: myTrips } = await supabase.from('trip_access').select('trip_id').eq('user_id', currentUserId);
      if (!myTrips || myTrips.length === 0) return [];
      
      const tripIds = myTrips.map(t => t.trip_id);
      
      // Pobierz wszystkich userów z tych tripów (poza samym sobą)
      const { data: sharedAccess } = await supabase
        .from('trip_access')
        .select('user_id')
        .in('trip_id', tripIds)
        .neq('user_id', currentUserId);
        
      if (!sharedAccess || sharedAccess.length === 0) return [];
      
      const uniqueUserIds = [...new Set(sharedAccess.map(a => a.user_id))];
      
      // Pobierz ich profile
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, name')
        .in('id', uniqueUserIds)
        .limit(10);
        
      return profiles || [];
    } catch (err) {
      console.error('Błąd pobierania sugerowanych:', err.message);
      return [];
    }
  };

  const grantAccess = async (tripId, userId, accessLevel) => {
    try {
      const { error } = await supabase
        .from('trip_access')
        .upsert([{ trip_id: tripId, user_id: userId, access_level: accessLevel }]);
      if (error) throw error;
      
      // Optymistycznie można odświeżyć z bazy, by dostać też dane profilu
      await fetchAccessUsers(tripId);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateAccess = async (tripId, userId, accessLevel) => {
    try {
      const { error } = await supabase
        .from('trip_access')
        .update({ access_level: accessLevel })
        .match({ trip_id: tripId, user_id: userId });
      if (error) throw error;
      
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, access_level: accessLevel } : u));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const revokeAccess = async (tripId, userId) => {
    try {
      const { error } = await supabase
        .from('trip_access')
        .delete()
        .match({ trip_id: tripId, user_id: userId });
      if (error) throw error;
      
      setUsers(prev => prev.filter(u => u.user_id !== userId));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return {
    users,
    loading,
    fetchAccessUsers,
    searchProfiles,
    fetchSuggestedUsers,
    grantAccess,
    updateAccess,
    revokeAccess
  };
}
