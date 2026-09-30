import { useState } from 'react';
import { Loader2, LogOut, Compass, Plus, Map, UserCircle, Sun, Moon, Settings, Calendar } from 'lucide-react';
import { useTrips } from '../hooks/useTrips';
import TripCard from './TripCard';
import CalendarView from './CalendarView';
import { useStore } from '../store/useStore';
import CreateTripModal from './CreateTripModal';
import ProfileModal from './ProfileModal';
import SettingsModal from './SettingsModal';
import packageJson from '../../package.json';

export default function Dashboard() {
  const { trips, loading, error, createTrip, refetchTrips } = useTrips();
  const { user, signOut } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState('trips');
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  const displayedTrips = showOnlyMine ? trips.filter(t => t.role === 'admin') : trips;

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  return (
    <div className="min-h-screen font-sans transition-colors duration-200">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-teal-600 dark:text-teal-500">
            <Compass size={28} />
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-zinc-800 dark:text-white tracking-tight leading-none">Traveler</h1>
              <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-wider">v{packageJson.version}</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            <button 
              onClick={() => setCurrentView('trips')}
              className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center transition-colors ${currentView === 'trips' ? 'text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
              <Map size={16} className="mr-1.5" /> Moje Wyjazdy
            </button>
            <button 
              onClick={() => setCurrentView('calendar')}
              className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center transition-colors ${currentView === 'calendar' ? 'text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
              <Calendar size={16} className="mr-1.5" /> Kalendarz
            </button>
          </nav>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 mr-1 sm:mr-3 px-2 sm:px-3 py-1 sm:border-r border-zinc-200 dark:border-zinc-700">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hidden sm:inline-block">Tylko moje</span>
              <button 
                onClick={() => setShowOnlyMine(!showOnlyMine)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors ${showOnlyMine ? 'bg-teal-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                title="Pokaż tylko wyjazdy, których jestem autorem"
              >
                <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${showOnlyMine ? 'translate-x-2' : '-translate-x-2'}`} />
              </button>
            </div>
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hidden sm:inline-block px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full mr-2">
              {user?.email}
            </span>
            <button
              onClick={toggleTheme}
              className="p-2 text-zinc-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-full transition-colors"
              title="Przełącz motyw"
            >
              {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
            </button>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-full transition-colors"
              title="Ustawienia Map i Aplikacji"
            >
              <Settings size={22} />
            </button>
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="p-2 text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-full transition-colors"
              title="Mój Profil"
            >
              <UserCircle size={22} />
            </button>
            <button
              onClick={signOut}
              className="p-2 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-full transition-colors"
              title="Wyloguj"
            >
              <LogOut size={22} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Twoje Wyjazdy</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">Przeglądaj zaplanowane podróże.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            <Plus size={20} className="mr-1.5" />
            Nowy Wyjazd
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl mb-6 border border-rose-100 dark:border-rose-900/50">
            Błąd pobierania danych: {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400 dark:text-zinc-500">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p>Ładowanie wyjazdów...</p>
          </div>
        ) : displayedTrips.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700 border-dashed">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 mb-4">
              <Compass size={32} />
            </div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white">Brak zaplanowanych wyjazdów</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 mb-6">Gdy dodasz nowe wyjazdy, pojawią się tutaj.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white px-5 py-2.5 rounded-lg shadow-sm transition-colors font-medium"
            >
              Utwórz pierwszy wyjazd
            </button>
          </div>
        ) : currentView === 'calendar' ? (
          <CalendarView trips={displayedTrips} />
        ) : (
          <div className="space-y-4">
            {displayedTrips.map((trip) => (
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

      {isProfileModalOpen && (
        <ProfileModal onClose={() => setIsProfileModalOpen(false)} />
      )}

      {isSettingsModalOpen && (
        <SettingsModal onClose={() => setIsSettingsModalOpen(false)} />
      )}
    </div>
  );
}
