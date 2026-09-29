import { X, Map, Car, Hotel, MapPin } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function SettingsModal({ onClose }) {
  const { mapSettings, setMapSettings } = useStore();

  const toggleSetting = (key) => {
    setMapSettings({
      ...mapSettings,
      [key]: !mapSettings[key]
    });
  };

  const toggleAll = (state) => {
    setMapSettings({
      main: state,
      transport: state,
      accommodations: state,
      carRentals: state,
      parkings: state
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <h2 className="text-xl font-bold text-zinc-800 dark:text-white flex items-center">
            <span className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 flex items-center justify-center mr-3">
              <Map size={18} />
            </span>
            Osobne Ustawienia
          </h2>
          <button onClick={onClose} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="mb-6">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Wybierz, w jakich sekcjach mają ładować się mapy. Pozwoli to zoptymalizować działanie aplikacji przy większej liczbie zapisanych podróży.</p>
            
            <div className="flex gap-2 mb-6">
              <button onClick={() => toggleAll(true)} className="flex-1 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium transition-colors">
                Włącz wszystkie
              </button>
              <button onClick={() => toggleAll(false)} className="flex-1 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium transition-colors">
                Wyłącz wszystkie
              </button>
            </div>

            <div className="space-y-1">
              <ToggleRow 
                icon={<Map size={18} className="text-teal-500" />} 
                label="Mapa główna (nagłówek)" 
                checked={mapSettings.main} 
                onChange={() => toggleSetting('main')} 
              />
              <ToggleRow 
                icon={<Map size={18} className="text-sky-500" />} 
                label="Transport" 
                checked={mapSettings.transport} 
                onChange={() => toggleSetting('transport')} 
              />
              <ToggleRow 
                icon={<Hotel size={18} className="text-amber-500" />} 
                label="Zakwaterowanie" 
                checked={mapSettings.accommodations} 
                onChange={() => toggleSetting('accommodations')} 
              />
              <ToggleRow 
                icon={<Car size={18} className="text-purple-500" />} 
                label="Wynajem aut" 
                checked={mapSettings.carRentals} 
                onChange={() => toggleSetting('carRentals')} 
              />
              <ToggleRow 
                icon={<MapPin size={18} className="text-slate-500" />} 
                label="Parkingi" 
                checked={mapSettings.parkings} 
                onChange={() => toggleSetting('parkings')} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ icon, label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors group">
      <div className="flex items-center space-x-3">
        {icon}
        <span className="font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{label}</span>
      </div>
      <div className="relative flex items-center">
        <input 
          type="checkbox" 
          className="sr-only" 
          checked={checked}
          onChange={onChange}
        />
        <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? 'bg-teal-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'transform translate-x-4' : ''}`}></div>
      </div>
    </label>
  );
}
