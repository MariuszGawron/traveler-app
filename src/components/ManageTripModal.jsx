import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { X, Loader2, Save, Trash, UserPlus, Shield, User, Users, ShieldAlert, Plus, Plane, Hotel, Clock, Map, Car, FileText, MapPin, Smile, Mail, Check } from 'lucide-react';
import { useTrips } from '../hooks/useTrips';
import { useAccess } from '../hooks/useAccess';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabaseClient';

export default function ManageTripModal({ trip, onClose, refetchTrips }) {
  const [activeTab, setActiveTab] = useState('general'); // general, logistics, sharing
  const [isSaving, setIsSaving] = useState(false);
  const generalRef = useRef(null);
  const logisticsRef = useRef(null);
  const { mapSettings } = useStore();

  const handleGlobalSave = async () => {
    setIsSaving(true);
    let success = true;
    
    if (generalRef.current) {
      const gSuccess = await generalRef.current.save();
      if (!gSuccess) success = false;
    }
    
    if (logisticsRef.current) {
      const lSuccess = await logisticsRef.current.save();
      if (!lSuccess) success = false;
    }
    
    setIsSaving(false);
    if (success) {
      if (refetchTrips) refetchTrips();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-900/50 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-transparent dark:border-zinc-800">
        <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div>
            <h2 className="text-xl font-bold text-zinc-800 dark:text-white">Zarządzanie: {trip.title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-5 bg-white dark:bg-zinc-900">
          <div className="flex">
            <button
              className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'general' ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
              onClick={() => setActiveTab('general')}
            >
              Ogólne
            </button>
            <button
              className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'logistics' ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
              onClick={() => setActiveTab('logistics')}
            >
              Plan Wyjazdu
            </button>
            <button
              className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'sharing' ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
              onClick={() => setActiveTab('sharing')}
            >
              Udostępnianie
            </button>
          </div>
          <button onClick={handleGlobalSave} disabled={isSaving} className="flex items-center bg-teal-600 hover:bg-teal-700 text-white px-4 py-1.5 rounded-lg transition-colors text-sm font-medium shadow-sm mb-1 mt-1">
            {isSaving ? <Loader2 size={16} className="animate-spin mr-1.5" /> : <Save size={16} className="mr-1.5" />}
            Zapisz zmiany
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 bg-white dark:bg-zinc-900">
          <div className={activeTab === 'general' ? 'block' : 'hidden'}>
            <GeneralTab ref={generalRef} trip={trip} onClose={onClose} refetchTrips={refetchTrips} />
          </div>
          <div className={activeTab === 'logistics' ? 'block' : 'hidden'}>
            <LogisticsTab ref={logisticsRef} trip={trip} onClose={onClose} refetchTrips={refetchTrips} />
          </div>
          <div className={activeTab === 'sharing' ? 'block' : 'hidden'}>
            <SharingTab trip={trip} />
          </div>
        </div>
      </div>
    </div>
  );
}

const GeneralTab = forwardRef(({ trip, onClose, refetchTrips }, ref) => {
  const { updateTrip, deleteTrip } = useTrips();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: trip.title || '',
    destination: trip.destination || '',
    start_date: trip.start_date || '',
    end_date: trip.end_date || ''
  });

  useImperativeHandle(ref, () => ({
    save: async () => {
      if (new Date(formData.end_date) < new Date(formData.start_date)) {
        setError('Data zakonczenia musi być późniejsza lub równa dacie początkowej.');
        return false;
      }
      setError('');
      const res = await updateTrip(trip.id, formData);
      if (!res.success) {
        setError(res.error || 'Wystąpił błąd podczas zapisu.');
        return false;
      }
      return true;
    }
  }));

  const handleDelete = async () => {
    if (window.confirm('Czy na pewno chcesz usunąć ten wyjazd? Tej operacji nie można cofnąć.')) {
      setLoading(true);
      await deleteTrip(trip.id);
      setLoading(false);
      if (refetchTrips) refetchTrips();
      onClose();
    }
  };

  return (
    <div className="space-y-5">
      {error && <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-sm rounded-lg">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Nazwa wyjazdu</label>
        <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Cel podróży</label>
        <input type="text" value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />

        {formData.destination && (
          <div className="mt-3 w-full h-40 bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 relative">
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight="0"
              marginWidth="0"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(formData.destination)}&t=&z=11&ie=UTF8&iwloc=&output=embed`}
              title="Minimapa celu podróży"
              className="dark:opacity-80"
            ></iframe>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Od</label>
          <input type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Do</label>
          <input type="date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
      </div>

      <div className="pt-6 flex items-center justify-start border-t border-zinc-100 dark:border-zinc-800 mt-6">
        <button onClick={handleDelete} disabled={loading} className="flex items-center text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/30 px-3 py-2 rounded-lg transition-colors text-sm font-medium">
          <Trash size={16} className="mr-1.5" /> Usuń wyjazd
        </button>
      </div>
    </div>
  );
});

const LogisticsTab = forwardRef(({ trip, onClose, refetchTrips }, ref) => {
  const { fetchTripDetails, updateTrip } = useTrips();
  const [data, setData] = useState({ participants: [], transports: [], accommodations: [], schedule: [], parkings: [], insurances: [], carRentals: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTripDetails(trip.id).then(res => {
      setData(res);
      setLoading(false);
    });
  }, [trip.id]);

  const updateItem = (category, id, field, value) => {
    setData(prev => ({
      ...prev,
      [category]: prev[category].map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addItem = (category, template) => {
    setData(prev => ({
      ...prev,
      [category]: [...prev[category], { id: Date.now().toString(), ...template }]
    }));
  };

  const removeItem = (category, id) => {
    setData(prev => ({
      ...prev,
      [category]: prev[category].filter(item => item.id !== id)
    }));
  };

  useImperativeHandle(ref, () => ({
    save: async () => {
      const res = await updateTrip(trip.id, {}, data);
      if (!res.success) {
        alert('Błąd zapisu logistyki: ' + res.error);
        return false;
      }
      return true;
    }
  }));

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-8">
      {/* Uczestnicy */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center"><Users size={18} className="text-indigo-500 mr-2" /> Ekipa wyjazdowa</h3>
          <button onClick={() => addItem('participants', { firstName: '', lastName: '', email: '', type: 'dorosły', discounts: '' })} className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 text-sm font-medium flex items-center"><Plus size={16} className="mr-1" /> Dodaj</button>
        </div>
        <div className="space-y-3">
          {data.participants.length === 0 && <div className="text-sm text-zinc-400 dark:text-zinc-500 italic">Brak dodanych uczestników</div>}
          {data.participants.map(item => (
            <div key={item.id} className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-700 flex gap-2">
              <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input type="text" placeholder="Imię" value={item.firstName} onChange={e => updateItem('participants', item.id, 'firstName', e.target.value)} className="px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-teal-500" />
                <input type="text" placeholder="Nazwisko" value={item.lastName} onChange={e => updateItem('participants', item.id, 'lastName', e.target.value)} className="px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-teal-500" />
                <input type="email" placeholder="E-mail (opcjonalnie)" value={item.email} onChange={e => updateItem('participants', item.id, 'email', e.target.value)} className="px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-teal-500" />
                <div className="flex gap-2">
                  <select value={item.type} onChange={e => updateItem('participants', item.id, 'type', e.target.value)} className="px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded w-full sm:w-auto focus:outline-none focus:ring-1 focus:ring-teal-500">
                    <option value="dorosły">Dorosły</option>
                    <option value="młodzież">Młodzież</option>
                    <option value="dziecko">Dziecko</option>
                  </select>
                  <input type="text" placeholder="Zniżki" value={item.discounts} onChange={e => updateItem('participants', item.id, 'discounts', e.target.value)} className="px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded w-full focus:outline-none focus:ring-1 focus:ring-teal-500" title="Np. Karta Dużej Rodziny" />
                </div>
              </div>
              <button onClick={() => removeItem('participants', item.id)} className="text-zinc-400 hover:text-rose-500 mt-1"><Trash size={16} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Transport */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center"><Plane size={18} className="text-sky-500 mr-2" /> Transport</h3>
          <button onClick={() => addItem('transports', { type: 'samolot', from: '', to: '', depDate: '', depTime: '', arrDate: '', arrTime: '', bookingInfo: '' })} className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 text-sm font-medium flex items-center"><Plus size={16} className="mr-1" /> Dodaj</button>
        </div>
        <div className="space-y-3">
          {data.transports.length === 0 && <div className="text-sm text-zinc-400 dark:text-zinc-500 italic">Brak dodanego transportu</div>}
          {data.transports.map(item => (
            <div key={item.id} className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-700 flex gap-2">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <select value={item.type} onChange={e => updateItem('transports', item.id, 'type', e.target.value)} className="px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded w-full sm:w-1/3 focus:outline-none focus:ring-1 focus:ring-teal-500">
                    <option value="samolot">Samolot</option>
                    <option value="autobus">Autobus</option>
                    <option value="pociąg">Pociąg</option>
                    <option value="auto">Auto</option>
                    <option value="statek">Statek</option>
                  </select>
                  <input type="text" placeholder="Z (np. Warszawa WAW)" value={item.from} onChange={e => updateItem('transports', item.id, 'from', e.target.value)} className="px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded w-full focus:outline-none focus:ring-1 focus:ring-teal-500" />
                  <input type="text" placeholder="Do (np. Barcelona BCN)" value={item.to} onChange={e => updateItem('transports', item.id, 'to', e.target.value)} className="px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded w-full focus:outline-none focus:ring-1 focus:ring-teal-500" />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex flex-col gap-1 w-full">
                    <span className="text-xs text-zinc-500 font-medium ml-1">Wyjazd</span>
                    <div className="flex gap-2">
                      <input type="date" value={item.depDate} onChange={e => updateItem('transports', item.id, 'depDate', e.target.value)} className="px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded w-full focus:outline-none focus:ring-1 focus:ring-teal-500" />
                      <input type="time" value={item.depTime} onChange={e => updateItem('transports', item.id, 'depTime', e.target.value)} className="px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded w-24 shrink-0 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 w-full">
                    <span className="text-xs text-zinc-500 font-medium ml-1">Przyjazd</span>
                    <div className="flex gap-2">
                      <input type="date" value={item.arrDate} onChange={e => updateItem('transports', item.id, 'arrDate', e.target.value)} className="px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded w-full focus:outline-none focus:ring-1 focus:ring-teal-500" />
                      <input type="time" value={item.arrTime} onChange={e => updateItem('transports', item.id, 'arrTime', e.target.value)} className="px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded w-24 shrink-0 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                    </div>
                  </div>
                </div>
                <input type="text" placeholder="Dane bookingu (np. WizzAir W6 1234, PNR: XYZ123)" value={item.bookingInfo} onChange={e => updateItem('transports', item.id, 'bookingInfo', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-teal-500" />
              </div>
              <button onClick={() => removeItem('transports', item.id)} className="text-zinc-400 hover:text-rose-500 mt-1"><Trash size={16} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Zakwaterowanie */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center"><Hotel size={18} className="text-amber-500 mr-2" /> Noclegi</h3>
          <button onClick={() => addItem('accommodations', { name: '', address: '', dateFrom: '', dateTo: '', bookingInfo: '' })} className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 text-sm font-medium flex items-center"><Plus size={16} className="mr-1" /> Dodaj</button>
        </div>
        <div className="space-y-3">
          {data.accommodations.length === 0 && <div className="text-sm text-zinc-400 dark:text-zinc-500 italic">Brak dodanych noclegów</div>}
          {data.accommodations.map(item => (
            <div key={item.id} className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-700 flex gap-2">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input type="text" placeholder="Nazwa hotelu / Airbnb" value={item.name} onChange={e => updateItem('accommodations', item.id, 'name', e.target.value)} className="px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded w-full focus:outline-none focus:ring-1 focus:ring-teal-500" />
                  <input type="text" placeholder="Adres" value={item.address} onChange={e => updateItem('accommodations', item.id, 'address', e.target.value)} className="px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded w-full focus:outline-none focus:ring-1 focus:ring-teal-500" />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center bg-white dark:bg-zinc-900 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center w-full">
                    <span className="text-xs text-zinc-400 font-medium w-8">Od:</span>
                    <input type="date" value={item.dateFrom} onChange={e => updateItem('accommodations', item.id, 'dateFrom', e.target.value)} className="px-2 text-sm w-full bg-transparent dark:text-white focus:outline-none" />
                  </div>
                  <div className="flex items-center w-full sm:border-l sm:border-zinc-200 dark:border-zinc-700 sm:pl-2 mt-1 sm:mt-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs text-zinc-400 font-medium w-8">Do:</span>
                    <input type="date" value={item.dateTo} onChange={e => updateItem('accommodations', item.id, 'dateTo', e.target.value)} className="px-2 text-sm w-full bg-transparent dark:text-white focus:outline-none" />
                  </div>
                </div>
                <input type="text" placeholder="Dodatkowe informacje (nr rezerwacji, PIN, check-in 15:00)" value={item.bookingInfo} onChange={e => updateItem('accommodations', item.id, 'bookingInfo', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-teal-500" />
              </div>
              <button onClick={() => removeItem('accommodations', item.id)} className="text-zinc-400 hover:text-rose-500 mt-1"><Trash size={16} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Wynajem aut */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center"><Car size={18} className="text-purple-500 mr-2" /> Wynajem auta</h3>
          <button onClick={() => addItem('carRentals', { company: '', location: '', dateFrom: '', dateTo: '', bookingInfo: '' })} className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 text-sm font-medium flex items-center"><Plus size={16} className="mr-1" /> Dodaj</button>
        </div>
        <div className="space-y-3">
          {(!data.carRentals || data.carRentals.length === 0) && <div className="text-sm text-zinc-400 dark:text-zinc-500 italic">Brak wynajętych aut</div>}
          {data.carRentals?.map(item => (
            <div key={item.id} className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-700 flex gap-2">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input type="text" placeholder="Wypożyczalnia (np. Hertz, Sixt)" value={item.company} onChange={e => updateItem('carRentals', item.id, 'company', e.target.value)} className="px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded w-full sm:w-1/3 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                  <input type="text" placeholder="Miejsce odbioru/zwrotu" value={item.location} onChange={e => updateItem('carRentals', item.id, 'location', e.target.value)} className="px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded w-full focus:outline-none focus:ring-1 focus:ring-teal-500" />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center bg-white dark:bg-zinc-900 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center w-full">
                    <span className="text-xs text-zinc-400 font-medium w-8">Od:</span>
                    <input type="date" value={item.dateFrom} onChange={e => updateItem('carRentals', item.id, 'dateFrom', e.target.value)} className="px-2 text-sm w-full bg-transparent dark:text-white focus:outline-none" />
                  </div>
                  <div className="flex items-center w-full sm:border-l sm:border-zinc-200 dark:border-zinc-700 sm:pl-2 mt-1 sm:mt-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs text-zinc-400 font-medium w-8">Do:</span>
                    <input type="date" value={item.dateTo} onChange={e => updateItem('carRentals', item.id, 'dateTo', e.target.value)} className="px-2 text-sm w-full bg-transparent dark:text-white focus:outline-none" />
                  </div>
                </div>
                <input type="text" placeholder="Dodatkowe informacje (nr rezerwacji, ubezpieczenie, auto)" value={item.bookingInfo} onChange={e => updateItem('carRentals', item.id, 'bookingInfo', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-teal-500" />
              </div>
              <button onClick={() => removeItem('carRentals', item.id)} className="text-zinc-400 hover:text-rose-500 mt-1"><Trash size={16} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Parkingi */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center"><MapPin size={18} className="text-slate-500 mr-2" /> Parkingi</h3>
          <button onClick={() => addItem('parkings', { location: '', dateFrom: '', dateTo: '', bookingInfo: '' })} className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 text-sm font-medium flex items-center"><Plus size={16} className="mr-1" /> Dodaj</button>
        </div>
        <div className="space-y-3">
          {(!data.parkings || data.parkings.length === 0) && <div className="text-sm text-zinc-400 dark:text-zinc-500 italic">Brak dodanych parkingów</div>}
          {data.parkings?.map(item => (
            <div key={item.id} className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-700 flex gap-2">
              <div className="flex-1 min-w-0 space-y-2">
                <input type="text" placeholder="Adres / Nazwa parkingu (np. P1 Lotnisko Chopina)" value={item.location} onChange={e => updateItem('parkings', item.id, 'location', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-teal-500" />
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center bg-white dark:bg-zinc-900 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center w-full">
                    <span className="text-xs text-zinc-400 font-medium w-8">Od:</span>
                    <input type="date" value={item.dateFrom} onChange={e => updateItem('parkings', item.id, 'dateFrom', e.target.value)} className="px-2 text-sm w-full bg-transparent dark:text-white focus:outline-none" />
                  </div>
                  <div className="flex items-center w-full sm:border-l sm:border-zinc-200 dark:border-zinc-700 sm:pl-2 mt-1 sm:mt-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs text-zinc-400 font-medium w-8">Do:</span>
                    <input type="date" value={item.dateTo} onChange={e => updateItem('parkings', item.id, 'dateTo', e.target.value)} className="px-2 text-sm w-full bg-transparent dark:text-white focus:outline-none" />
                  </div>
                </div>
                <input type="text" placeholder="Informacje (nr rezerwacji, kod wjazdu)" value={item.bookingInfo} onChange={e => updateItem('parkings', item.id, 'bookingInfo', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-teal-500" />
              </div>
              <button onClick={() => removeItem('parkings', item.id)} className="text-zinc-400 hover:text-rose-500 mt-1"><Trash size={16} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Ubezpieczenia */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center"><FileText size={18} className="text-rose-500 mr-2" /> Ubezpieczenia</h3>
          <button onClick={() => addItem('insurances', { company: '', policyNumber: '', contactInfo: '' })} className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 text-sm font-medium flex items-center"><Plus size={16} className="mr-1" /> Dodaj</button>
        </div>
        <div className="space-y-3">
          {(!data.insurances || data.insurances.length === 0) && <div className="text-sm text-zinc-400 dark:text-zinc-500 italic">Brak dodanych ubezpieczeń</div>}
          {data.insurances?.map(item => (
            <div key={item.id} className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-700 flex gap-2">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input type="text" placeholder="Firma ubezpieczeniowa (np. PZU, Warta)" value={item.company} onChange={e => updateItem('insurances', item.id, 'company', e.target.value)} className="px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded w-full focus:outline-none focus:ring-1 focus:ring-teal-500" />
                  <input type="text" placeholder="Numer polisy" value={item.policyNumber} onChange={e => updateItem('insurances', item.id, 'policyNumber', e.target.value)} className="px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded w-full focus:outline-none focus:ring-1 focus:ring-teal-500" />
                </div>
                <input type="text" placeholder="Kontakt w razie nagłych wypadków / Infolinia / Zakres" value={item.contactInfo} onChange={e => updateItem('insurances', item.id, 'contactInfo', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-teal-500" />
              </div>
              <button onClick={() => removeItem('insurances', item.id)} className="text-zinc-400 hover:text-rose-500 mt-1"><Trash size={16} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Harmonogram */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center"><Clock size={18} className="text-emerald-500 mr-2" /> Harmonogram dzienny</h3>
          <button onClick={() => addItem('schedule', { day: '', time: '', place: '', info: '' })} className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 text-sm font-medium flex items-center"><Plus size={16} className="mr-1" /> Dodaj</button>
        </div>
        <div className="space-y-3">
          {data.schedule.length === 0 && <div className="text-sm text-zinc-400 dark:text-zinc-500 italic">Brak elementów harmonogramu</div>}
          {data.schedule.map(item => (
            <div key={item.id} className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-700 flex gap-2">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex gap-2 w-full sm:w-auto">
                    <input type="text" placeholder="Dzień (np. Dzień 1 / 25 Lis)" value={item.day} onChange={e => updateItem('schedule', item.id, 'day', e.target.value)} className="px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded w-full focus:outline-none focus:ring-1 focus:ring-teal-500" />
                    <input type="time" value={item.time} onChange={e => updateItem('schedule', item.id, 'time', e.target.value)} className="px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded w-24 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                  </div>
                  <input type="text" placeholder="Miejsce" value={item.place} onChange={e => updateItem('schedule', item.id, 'place', e.target.value)} className="px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded w-full focus:outline-none focus:ring-1 focus:ring-teal-500" />
                </div>
                <input type="text" placeholder="Dodatkowe informacje (np. bilety kupione na 10:00)" value={item.info} onChange={e => updateItem('schedule', item.id, 'info', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-teal-500" />
              </div>
              <button onClick={() => removeItem('schedule', item.id)} className="text-zinc-400 hover:text-rose-500 mt-1"><Trash size={16} /></button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
});

function SharingTab({ trip }) {
  const { user } = useStore();
  const { users, loading, fetchAccessUsers, searchProfiles, fetchSuggestedUsers, grantAccess, updateAccess, revokeAccess } = useAccess();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [savingGroup, setSavingGroup] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(null);

  useEffect(() => {
    supabase.from('user_groups').select('*').eq('owner_id', user.id).then(({data}) => {
      if (data) setGroups(data);
    });
  }, [user.id]);

  const saveCurrentUsersAsGroup = async () => {
    if (!newGroupName.trim()) return alert('Podaj nazwę grupy');
    
    let existingGroupId = null;
    const existing = groups.find(g => g.name.toLowerCase() === newGroupName.trim().toLowerCase());
    if (existing) {
      if (!window.confirm('Grupa o takiej nazwie już istnieje. Czy chcesz ją nadpisać?')) return;
      existingGroupId = existing.id;
    }
    
    const memberIds = users.map(u => u.user_id).filter(id => id !== user.id);
    if (memberIds.length === 0) return alert('Brak użytkowników do zapisania w grupie (Ty się nie liczysz).');
    
    setSavingGroup(true);
    
    if (existingGroupId) {
      const { data: updatedGrp, error } = await supabase.from('user_groups').update({ member_ids: memberIds }).eq('id', existingGroupId).select().single();
      setSavingGroup(false);
      if (error) {
        alert('Błąd nadpisywania grupy: ' + error.message);
      } else {
        setGroups(groups.map(g => g.id === existingGroupId ? updatedGrp : g));
        setNewGroupName('');
        alert('Grupa nadpisana pomyślnie!');
      }
    } else {
      const { data: newGrp, error } = await supabase.from('user_groups').insert({
        owner_id: user.id,
        name: newGroupName.trim(),
        member_ids: memberIds
      }).select().single();
      
      setSavingGroup(false);
      if (error) {
        alert('Błąd zapisu grupy: ' + error.message);
      } else {
        setGroups([...groups, newGrp]);
        setNewGroupName('');
        alert('Grupa zapisana pomyślnie!');
      }
    }
  };

  const loadGroup = async (groupId) => {
    const group = groups.find(g => g.id === groupId);
    if (!group || !group.member_ids) return;
    
    let addedCount = 0;
    for (const memberId of group.member_ids) {
      if (!users.some(u => u.user_id === memberId)) {
        await grantAccess(trip.id, memberId, 'medium'); // Default to medium
        addedCount++;
      }
    }
    
    if (addedCount > 0) {
      fetchAccessUsers(trip.id);
      alert(`Dodano ${addedCount} nowych osób z grupy.`);
    } else {
      alert('Wszyscy członkowie z tej grupy mają już dostęp.');
    }
  };

  useEffect(() => {
    fetchAccessUsers(trip.id);
    fetchSuggestedUsers(user.id).then(res => setSuggestedUsers(res));
  }, [trip.id]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 3) {
        setIsSearching(true);
        const results = await searchProfiles(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, users]);

  const handleGrant = async (userId, level = 'basic') => {
    const res = await grantAccess(trip.id, userId, level);
    if (!res.success) {
      alert('Błąd podczas nadawania dostępu: ' + res.error);
      return;
    }
    setSearchQuery('');
    setSearchResults([]);
    setSuggestedUsers(prev => prev.filter(u => u.id !== userId)); // Remove from suggestions
  };

  const handleInvite = async () => {
    if (!searchQuery.includes('@')) {
      return alert('Wpisz poprawny adres e-mail, aby wysłać zaproszenie.');
    }
    setInviting(true);
    setInviteSuccess(null);
    try {
      // Wywołanie Edge Function, bo klient JS domyślnie nie ma uprawnień do wysyłania zaproszeń (potrzebuje service_role)
      const { data, error } = await supabase.functions.invoke('invite_user', {
        body: { email: searchQuery, trip_id: trip.id, role: 'medium' }
      });
      if (error) throw error;
      
      setInviteSuccess(`Wysłano zaproszenie na ${searchQuery}! Użytkownik otrzymał dostęp.`);
      setSearchQuery('');
      
      // Odświeżamy listę po pomyślnym dodaniu
      await fetchAccessUsers(trip.id);
      
      // Usuń komunikat sukcesu po 5 sekundach
      setTimeout(() => setInviteSuccess(null), 5000);
    } catch (err) {
      alert('Błąd podczas wysyłania zaproszenia. Upewnij się, że funkcja Edge Function "invite_user" jest wdrożona na Supabase. Szczegóły: ' + err.message);
    } finally {
      setInviting(false);
    }
  };

  // Profile resolution helper (handles arrays or missing objects)
  const getProfileInfo = (u) => {
    if (!u.profiles) return { name: 'Użytkownik bez profilu', email: u.user_id };
    const p = Array.isArray(u.profiles) ? u.profiles[0] : u.profiles;
    return { name: p?.name || 'Nieznany', email: p?.email || u.user_id };
  };

  // Filter out suggestions that are already in the trip
  const availableSuggestions = suggestedUsers.filter(su => !users.some(u => u.user_id === su.id));

  return (
    <div className="space-y-6">
      {/* Grupy */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700">
        <div>
          <h4 className="font-medium text-sm text-zinc-800 dark:text-zinc-200 mb-1">Grupy udostępniania</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Zapisz obecnych użytkowników jako grupę lub przypisz z istniejącej.</p>
        </div>
        <div className="flex flex-col sm:items-end gap-2">
          {groups.length > 0 && (
            <select onChange={(e) => { if(e.target.value) { loadGroup(e.target.value); e.target.value = ''; } }} className="px-2 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-teal-500 w-full sm:w-auto">
              <option value="">-- Przypisz z grupy --</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          )}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input type="text" placeholder="Nazwa nowej grupy" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="flex-1 sm:flex-none px-2 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-teal-500" />
            <button onClick={saveCurrentUsersAsGroup} disabled={savingGroup} className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 rounded text-xs font-medium transition-colors flex items-center">
              {savingGroup ? <Loader2 size={12} className="animate-spin" /> : 'Zapisz obecnych'}
            </button>
          </div>
        </div>
      </div>

      {/* Sugestie */}
      {availableSuggestions.length > 0 && (
        <div className="bg-teal-50/50 dark:bg-teal-900/20 p-3 rounded-xl border border-teal-100 dark:border-teal-900/50">
          <h3 className="text-xs font-medium text-teal-800 dark:text-teal-400 uppercase tracking-wider mb-2">Sugerowane osoby</h3>
          <div className="flex flex-wrap gap-2">
            {availableSuggestions.map(su => (
              <button
                key={su.id}
                onClick={() => handleGrant(su.id)}
                className="flex items-center bg-white dark:bg-zinc-800 px-3 py-1.5 border border-teal-200 dark:border-teal-800 rounded-full text-sm hover:border-teal-400 dark:hover:border-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors shadow-sm"
              >
                <Plus size={14} className="mr-1 text-teal-500" />
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{su.name || su.email.split('@')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Wyszukiwarka */}
      <div className="relative">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Zaproś osobę po e-mailu lub Imieniu i Nazwisku</label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Wpisz e-mail (min. 3 znaki) lub Imię i Nazwisko..."
            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
          />
          {isSearching && <Loader2 size={18} className="absolute right-3 top-3 animate-spin text-zinc-400" />}
        </div>

        {searchResults.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg overflow-hidden">
            {searchResults.map(profile => {
              const isAlreadyAdded = users.some(u => u.user_id === profile.id);
              return (
                <div key={profile.id} className="flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 border-b border-zinc-100 dark:border-zinc-700 last:border-0">
                  <div>
                    <div className="font-medium text-zinc-800 dark:text-zinc-200 text-sm">{profile.name || 'Nieznany'}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{profile.email}</div>
                  </div>
                  {isAlreadyAdded ? (
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium px-2 py-1">Już dodany</span>
                  ) : (
                    <button
                      onClick={() => handleGrant(profile.id)}
                      className="p-1.5 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg transition-colors flex items-center text-xs font-medium"
                    >
                      <UserPlus size={16} className="mr-1" /> Dodaj
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {inviteSuccess && (
          <div className="mt-2 p-3 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg text-sm border border-teal-100 dark:border-teal-900/50 flex items-center">
            <Check size={16} className="mr-2 flex-shrink-0" />
            <span>{inviteSuccess}</span>
          </div>
        )}

        {searchQuery.includes('@') && !isSearching && searchResults.length === 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg p-4 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
              Nie znaleziono użytkownika z e-mailem <strong>{searchQuery}</strong>.
            </p>
            <button
              onClick={handleInvite}
              disabled={inviting}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center disabled:opacity-70"
            >
              {inviting ? <Loader2 size={16} className="animate-spin mr-1.5" /> : <Mail size={16} className="mr-1.5" />}
              Wyślij zaproszenie
            </button>
          </div>
        )}
      </div>

      {/* Lista dostępu */}
      <div>
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Osoby z dostępem</h3>
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="animate-spin text-zinc-400" /></div>
        ) : users.length === 0 ? (
          <div className="text-sm text-zinc-400 dark:text-zinc-500 italic py-2 text-center">Brak dodanych osób.</div>
        ) : (
          <div className="space-y-2">
            {users.map(u => {
              const profileInfo = getProfileInfo(u);
              return (
                <div key={u.user_id} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${u.access_level === 'admin' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' : u.access_level === 'full' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : u.access_level === 'basic' ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>
                      {u.access_level === 'admin' ? <ShieldAlert size={16} /> : u.access_level === 'full' ? <Shield size={16} /> : <User size={16} />}
                    </div>
                    <div>
                      <div className="font-medium text-zinc-800 dark:text-zinc-200 text-sm">{profileInfo.name}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">{profileInfo.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <select
                      value={u.access_level}
                      onChange={async (e) => {
                        const res = await updateAccess(trip.id, u.user_id, e.target.value);
                        if (!res.success) alert('Błąd aktualizacji: ' + res.error + '\nByć może masz ustawiony constraint (ograniczenie) na kolumnie w bazie.');
                      }}
                      className="text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      disabled={u.user_id === user.id} // You shouldn't demote yourself if you are the only admin
                    >
                      <option value="admin">Twórca (Edycja)</option>
                      <option value="full">Pełny (Pełny podgląd)</option>
                      <option value="medium">Średni (Częściowy podgląd)</option>
                      <option value="basic">Niski (Podgląd nagłówka)</option>
                      <option value="minimal">Minimalny (Tylko data)</option>
                    </select>
                    {u.user_id !== user.id && (
                      <button
                        onClick={async () => {
                          const res = await revokeAccess(trip.id, u.user_id);
                          if (!res.success) alert('Błąd usuwania dostępu: ' + res.error);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                        title="Usuń dostęp"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const ExpensesTab = forwardRef(({ trip }, ref) => {
  const { fetchTripDetails, updateTrip } = useTrips();
  const [data, setData] = useState({ expenses: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTripDetails(trip.id).then(res => {
      setData({ expenses: res.expenses || [] });
      setLoading(false);
    });
  }, [trip.id]);

  useImperativeHandle(ref, () => ({
    save: async () => {
      const res = await updateTrip(trip.id, {}, data);
      if (!res.success) {
        alert('Błąd zapisu kosztów: ' + res.error);
        return false;
      }
      return true;
    }
  }));

  const updateItem = (id, field, value) => {
    setData(prev => ({
      expenses: prev.expenses.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addItem = () => {
    setData(prev => ({
      expenses: [...prev.expenses, { id: Date.now().toString(), description: '', amount: '', currency: 'PLN', payer: '' }]
    }));
  };

  const removeItem = (id) => {
    setData(prev => ({
      expenses: prev.expenses.filter(item => item.id !== id)
    }));
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center"><FileText size={18} className="text-emerald-500 mr-2" /> Rozliczenia</h3>
        <button onClick={addItem} className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 text-sm font-medium flex items-center"><Plus size={16} className="mr-1" /> Dodaj koszt</button>
      </div>
      <div className="space-y-3">
        {data.expenses.length === 0 && <div className="text-sm text-zinc-400 dark:text-zinc-500 italic">Brak wydatków.</div>}
        {data.expenses.map(item => (
          <div key={item.id} className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-700 flex gap-2">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input type="text" placeholder="Opis (np. Paliwo)" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} className="px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-teal-500" />
              <input type="text" placeholder="Kto płacił?" value={item.payer} onChange={e => updateItem(item.id, 'payer', e.target.value)} className="px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-teal-500" />
              <div className="flex gap-2">
                <input type="number" placeholder="Kwota" value={item.amount} onChange={e => updateItem(item.id, 'amount', e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-teal-500" />
                <input type="text" placeholder="Waluta" value={item.currency} onChange={e => updateItem(item.id, 'currency', e.target.value)} className="w-24 px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-teal-500" />
              </div>
            </div>
            <button onClick={() => removeItem(item.id)} className="text-zinc-400 hover:text-rose-500 mt-1"><Trash size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
});

const ChecklistTab = forwardRef(({ trip }, ref) => {
  const { fetchTripDetails, updateTrip } = useTrips();
  const { user } = useStore();
  const [data, setData] = useState({ checklist: [] });
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await fetchTripDetails(trip.id);
      setData({ checklist: res.checklist || [] });

      if (user) {
        const { data: tpls } = await supabase.from('checklist_templates').select('*').eq('user_id', user.id);
        if (tpls) setTemplates(tpls);
      }
      setLoading(false);
    };
    load();
  }, [trip.id, user]);

  useImperativeHandle(ref, () => ({
    save: async () => {
      const res = await updateTrip(trip.id, {}, data);
      if (!res.success) {
        alert('Błąd zapisu ekwipunku: ' + res.error);
        return false;
      }
      return true;
    }
  }));

  const updateItem = (id, field, value) => {
    setData(prev => ({
      checklist: prev.checklist.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addItem = () => {
    setData(prev => ({
      checklist: [...prev.checklist, { id: Date.now().toString(), text: '', isCompleted: false, assignee: '' }]
    }));
  };

  const removeItem = (id) => {
    setData(prev => ({
      checklist: prev.checklist.filter(item => item.id !== id)
    }));
  };

  const toggleStatus = (id) => {
    setData(prev => ({
      checklist: prev.checklist.map(item => item.id === id ? { ...item, isCompleted: !item.isCompleted } : item)
    }));
  };

  const loadTemplate = (tpl) => {
    if (!tpl.items) return;
    const newItems = tpl.items.map(item => ({ ...item, id: Date.now().toString() + Math.random().toString() }));
    setData(prev => ({ checklist: [...prev.checklist, ...newItems] }));
  };

  const saveAsTemplate = async () => {
    if (!newTemplateName.trim()) return alert('Podaj nazwę szablonu');
    if (data.checklist.length === 0) return alert('Lista jest pusta');
    
    setSavingTemplate(true);
    const itemsToSave = data.checklist.map(({ text, assignee }) => ({ text, assignee, isCompleted: false }));
    const { data: newTpl, error } = await supabase.from('checklist_templates').insert({
      user_id: user.id,
      name: newTemplateName,
      items: itemsToSave
    }).select().single();
    
    setSavingTemplate(false);
    if (error) {
      alert('Błąd zapisu szablonu: ' + error.message);
    } else {
      setTemplates([...templates, newTpl]);
      setNewTemplateName('');
      alert('Szablon został zapisany pomyślnie!');
    }
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700">
        <div>
          <h4 className="font-medium text-sm text-zinc-800 dark:text-zinc-200 mb-1">Szablony ekwipunku</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Załaduj z zapisanego szablonu lub stwórz nowy na podstawie obecnej listy.</p>
        </div>
        <div className="flex flex-col sm:items-end gap-2">
          {templates.length > 0 && (
            <div className="flex items-center gap-2">
              <select onChange={(e) => {
                if(e.target.value) {
                  const tpl = templates.find(t => t.id === e.target.value);
                  if(tpl) loadTemplate(tpl);
                  e.target.value = '';
                }
              }} className="px-2 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-teal-500">
                <option value="">-- Wczytaj szablon --</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input type="text" placeholder="Nazwa nowego szablonu" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} className="px-2 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-teal-500" />
            <button onClick={saveAsTemplate} disabled={savingTemplate} className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 rounded text-xs font-medium transition-colors flex items-center">
              {savingTemplate ? <Loader2 size={12} className="animate-spin" /> : 'Zapisz'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 mt-6">
        <h3 className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center"><FileText size={18} className="text-blue-500 mr-2" /> Ekwipunek i Zadania</h3>
        <button onClick={addItem} className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 text-sm font-medium flex items-center"><Plus size={16} className="mr-1" /> Dodaj element</button>
      </div>
      
      <div className="space-y-2">
        {data.checklist.length === 0 && <div className="text-sm text-zinc-400 dark:text-zinc-500 italic">Lista jest pusta.</div>}
        {data.checklist.map(item => (
          <div key={item.id} className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${item.isCompleted ? 'bg-zinc-50/50 dark:bg-zinc-800/30 border-transparent' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'}`}>
            <button onClick={() => toggleStatus(item.id)} className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${item.isCompleted ? 'bg-teal-500 border-teal-500 text-white' : 'border-zinc-300 dark:border-zinc-600 hover:border-teal-500'}`}>
              {item.isCompleted && <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </button>
            <input type="text" placeholder="Nazwa przedmiotu / zadanie" value={item.text} onChange={e => updateItem(item.id, 'text', e.target.value)} className={`flex-1 px-2 py-1 text-sm bg-transparent border-none focus:outline-none focus:ring-0 ${item.isCompleted ? 'text-zinc-400 dark:text-zinc-500 line-through' : 'text-zinc-800 dark:text-zinc-200'}`} />
            <input type="text" placeholder="Kto?" value={item.assignee || ''} onChange={e => updateItem(item.id, 'assignee', e.target.value)} className="w-24 sm:w-32 px-2 py-1 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-teal-500" />
            <button onClick={() => removeItem(item.id)} className="text-zinc-400 hover:text-rose-500 p-1"><Trash size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
});
