import { useState, useEffect } from 'react';
import { X, Map, Car, Hotel, MapPin, Loader2, Trash, FileText } from 'lucide-react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabaseClient';

export default function SettingsModal({ onClose }) {
  const { mapSettings, setMapSettings, user } = useStore();
  const [activeTab, setActiveTab] = useState('maps'); // 'maps' | 'templates'
  const [templates, setTemplates] = useState([]);
  const [loadingTpl, setLoadingTpl] = useState(false);

  useEffect(() => {
    if (activeTab === 'templates' && user) {
      setLoadingTpl(true);
      supabase.from('checklist_templates').select('*').eq('user_id', user.id).then(({ data, error }) => {
        if (!error && data) setTemplates(data);
        setLoadingTpl(false);
      });
    }
  }, [activeTab, user]);

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

  const deleteTemplate = async (id, name) => {
    if (!window.confirm(`Czy na pewno chcesz usunąć szablon "${name}"?`)) return;
    const { error } = await supabase.from('checklist_templates').delete().eq('id', id);
    if (error) {
      alert('Błąd usuwania: ' + error.message);
    } else {
      setTemplates(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-5 flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex-shrink-0">
          <h2 className="text-xl font-bold text-zinc-800 dark:text-white flex items-center">
            Ustawienia
          </h2>
          <button onClick={onClose} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-zinc-100 dark:border-zinc-800 px-5 bg-white dark:bg-zinc-900 flex-shrink-0">
          <button
            className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors flex items-center ${activeTab === 'maps' ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
            onClick={() => setActiveTab('maps')}
          >
            <Map size={16} className="mr-2" /> Mapy
          </button>
          <button
            className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors flex items-center ${activeTab === 'templates' ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
            onClick={() => setActiveTab('templates')}
          >
            <FileText size={16} className="mr-2" /> Szablony
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {activeTab === 'maps' && (
            <div className="space-y-4">
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
          )}

          {activeTab === 'templates' && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Zarządzaj swoimi predefiniowanymi szablonami ekwipunku.</p>
              
              {loadingTpl ? (
                <div className="flex justify-center py-6"><Loader2 className="animate-spin text-zinc-400" /></div>
              ) : templates.length === 0 ? (
                <div className="text-sm text-zinc-400 dark:text-zinc-500 italic text-center py-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">Nie masz jeszcze żadnych zapisanych szablonów.</div>
              ) : (
                <div className="space-y-2">
                  {templates.map(tpl => (
                    <div key={tpl.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-700">
                      <div>
                        <div className="font-medium text-zinc-800 dark:text-zinc-200 text-sm">{tpl.name}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">{tpl.items?.length || 0} elementów</div>
                      </div>
                      <button onClick={() => deleteTemplate(tpl.id, tpl.name)} className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors" title="Usuń szablon">
                        <Trash size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
