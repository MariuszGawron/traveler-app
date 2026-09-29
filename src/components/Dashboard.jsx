import { useState } from 'react';
import { Loader2, LogOut, Compass, Plus } from 'lucide-react';
import { useTrips } from '../hooks/useTrips';
import TripCard from './TripCard';
import { useStore } from '../store/useStore';
import CreateTripModal from './CreateTripModal';

export default function Dashboard() {
  const { trips, loading, error, createTrip, refetchTrips } = useTrips();
  const { user, signOut } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-blue-600">
            <Compass size={28} />
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Traveler</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-500 hidden sm:inline-block">
              {user?.email}
            </span>
            <button
              onClick={signOut}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              title="Wyloguj"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Twoje Wyjazdy</h2>
            <p className="text-slate-500 mt-2">Przeglądaj zaplanowane podróże i logistykę.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-sm transition-colors"
          >
            <Plus size={20} className="mr-1.5" />
            Nowy Wyjazd
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl mb-6 border border-red-100">
            Błąd pobierania danych: {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p>Ładowanie wyjazdów...</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
              <Compass size={32} />
            </div>
            <h3 className="text-lg font-medium text-slate-900">Brak zaplanowanych wyjazdów</h3>
            <p className="text-slate-500 mt-1 mb-6">Gdy dodasz nowe wyjazdy, pojawią się tutaj.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-sm transition-colors font-medium"
            >
              Utwórz pierwszy wyjazd
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} refetchTrips={refetchTrips} />
            ))}
          </div>
        )}
      </main>

      {isModalOpen && (
        <CreateTripModal 
          onClose={() => setIsModalOpen(false)} 
          createTrip={createTrip} 
        />
      )}
    </div>
  );
}
