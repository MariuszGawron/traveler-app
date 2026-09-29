import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

export function useTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useStore();

  const fetchTrips = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trips')
        .select(`
          id, title, destination, start_date, end_date, creator_id,
          creator:profiles!creator_id(name),
          trip_access ( access_level, user_id )
        `)
        .order('start_date', { ascending: true });

      if (error) throw error;

      const mappedTrips = (data || []).map(trip => {
        const myAccess = trip.trip_access?.find(a => a.user_id === user.id);
        const founderName = trip.creator ? trip.creator.name : 'Nieznany';

        return {
          ...trip,
          role: myAccess ? myAccess.access_level : 'basic',
          founderName
        };
      });

      setTrips(mappedTrips);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchTripDetails = async (id) => {
    try {
      const { data, error } = await supabase
        .from('trip_details')
        .select('*')
        .eq('trip_id', id)
        .maybeSingle();

      if (error) throw error;
      const d = data || {};
      return {
        participants: d.participants || [],
        transports: d.transports || [],
        accommodations: d.accommodations || [],
        schedule: d.schedule || [],
        parkings: d.parkings || [],
        insurances: d.insurances || [],
        carRentals: d.car_rentals || []
      };
    } catch (err) {
      console.error('Błąd podczas pobierania szczegółów wyjazdu:', err.message);
      return { participants: [], transports: [], accommodations: [], schedule: [], parkings: [], insurances: [], carRentals: [] };
    }
  };

  const createTrip = async (tripData, detailsData) => {
    try {
      // 1 i 2. Atomowe utworzenie wyjazdu i nadanie roli w bezpieczny sposób
      const { data: tripId, error: rpcError } = await supabase.rpc('create_new_trip', {
        trip_title: tripData.title,
        trip_destination: tripData.destination,
        trip_start: tripData.start_date,
        trip_end: tripData.end_date
      });

      if (rpcError) throw rpcError;

      // 3. Insert do trip_details (opcjonalnie)
      if (detailsData && detailsData.length > 0) {
        const detailsToInsert = detailsData.map(d => ({ ...d, trip_id: tripId }));
        const { error: detailsError } = await supabase
          .from('trip_details')
          .insert(detailsToInsert);

        if (detailsError) throw detailsError;
      }

      await fetchTrips();
      return { success: true, tripId };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };


  const updateTrip = async (id, tripData, tripDetailsObj) => {
    try {
      if (tripData && Object.keys(tripData).length > 0) {
        const { error: tripError } = await supabase.from('trips').update(tripData).eq('id', id);
        if (tripError) throw tripError;
      }

      if (tripDetailsObj) {
        const payload = {
          trip_id: id,
          participants: tripDetailsObj.participants || [],
          transports: tripDetailsObj.transports || [],
          accommodations: tripDetailsObj.accommodations || [],
          schedule: tripDetailsObj.schedule || [],
          parkings: tripDetailsObj.parkings || [],
          insurances: tripDetailsObj.insurances || [],
          car_rentals: tripDetailsObj.carRentals || []
        };
        const { error } = await supabase.from('trip_details').upsert(payload);
        if (error) throw error;
      }

      await fetchTrips();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteTrip = async (id) => {
    try {
      const { error } = await supabase.from('trips').delete().eq('id', id);
      if (error) throw error;
      setTrips(prev => prev.filter(t => t.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  return {
    trips,
    loading,
    error,
    refetchTrips: fetchTrips,
    fetchTripDetails,
    createTrip,
    updateTrip,
    deleteTrip
  };
}
