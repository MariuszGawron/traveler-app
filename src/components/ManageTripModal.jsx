import { useState, useEffect } from 'react';
import { X, Loader2, Save, Trash, UserPlus, Shield, User, Users, ShieldAlert, Plus, Plane, Hotel, Clock, Map, Car, FileText, MapPin } from 'lucide-react';
import { useTrips } from '../hooks/useTrips';
import { useAccess } from '../hooks/useAccess';
import { useStore } from '../store/useStore';

export default function ManageTripModal({ trip, onClose, refetchTrips }) {
  const [activeTab, setActiveTab] = useState('general'); // general, logistics, sharing
  const { mapSettings } = useStore();

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

        <div className="flex border-b border-zinc-100 dark:border-zinc-800 px-5 bg-white dark:bg-zinc-900">
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
            Logistyka
          </button>
          <button
            className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'sharing' ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
            onClick={() => setActiveTab('sharing')}
          >
            Udostępnianie
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 bg-white dark:bg-zinc-900">
          {activeTab === 'general' && <GeneralTab trip={trip} onClose={onClose} refetchTrips={refetchTrips} />}
          {activeTab === 'logistics' && <LogisticsTab trip={trip} onClose={onClose} refetchTrips={refetchTrips} />}
          {activeTab === 'sharing' && <SharingTab trip={trip} />}
        </div>
      </div>
    </div>
  );
}

function GeneralTab({ trip, onClose, refetchTrips }) {
  const { updateTrip, deleteTrip } = useTrips();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: trip.title || '',
    destination: trip.destination || '',
    start_date: trip.start_date || '',
    end_date: trip.end_date || ''
  });

  const handleSave = async () => {
    // Walidacja dat
    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      setError('Data zakonczenia musi być późniejsza lub równa dacie początkowej.');
      return;
    }

    setLoading(true);
    setError('');
    // Przekazujemy tylko formData, bez tripDetailsObj
    const res = await updateTrip(trip.id, formData);
    setLoading(false);

    if (res.success) {
      if (refetchTrips) refetchTrips();
      onClose(); // Zamknij modal po poprawnym zapisie
    } else {
      setError(res.error || 'Wystąpił błąd podczas zapisu.');
    }
  };

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

      <div className="pt-6 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 mt-6">
        <button onClick={handleDelete} disabled={loading} className="flex items-center text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/30 px-3 py-2 rounded-lg transition-colors text-sm font-medium">
          <Trash size={16} className="mr-1.5" /> Usuń wyjazd
        </button>
        <button onClick={handleSave} disabled={loading} className="flex items-center bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm">
          {loading ? <Loader2 size={16} className="animate-spin mr-1.5" /> : <Save size={16} className="mr-1.5" />}
          Zapisz zmiany
        </button>
      </div>
    </div>
  );
}

function LogisticsTab({ trip, onClose, refetchTrips }) {
  const { fetchTripDetails, updateTrip } = useTrips();
  const [data, setData] = useState({ participants: [], transports: [], accommodations: [], schedule: [], parkings: [], insurances: [], carRentals: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    setSaving(true);
    const res = await updateTrip(trip.id, {}, data);
    if (!res.success) {
      alert('Błąd zapisu logistyki: ' + res.error);
    } else {
      if (refetchTrips) refetchTrips();
      if (onClose) onClose();
    }
    setSaving(false);
  };

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

      <div className="pt-4 flex justify-end border-t border-zinc-100 dark:border-zinc-800 mt-4">
        <button onClick={handleSave} disabled={saving} className="flex items-center bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm">
          {saving ? <Loader2 size={16} className="animate-spin mr-1.5" /> : <Save size={16} className="mr-1.5" />}
          Zapisz logistykę
        </button>
      </div>
    </div>
  );
}

function SharingTab({ trip }) {
  const { user } = useStore();
  const { users, loading, fetchAccessUsers, searchProfiles, fetchSuggestedUsers, grantAccess, updateAccess, revokeAccess } = useAccess();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchAccessUsers(trip.id);
    fetchSuggestedUsers(user.id).then(res => setSuggestedUsers(res));
  }, [trip.id]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 3) {
        setIsSearching(true);
        const results = await searchProfiles(searchQuery);
        setSearchResults(results.filter(r => !users.some(u => u.user_id === r.id)));
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
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Zaproś osobę po adresie e-mail</label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Szukaj e-maila (min. 3 znaki)..."
            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
          />
          {isSearching && <Loader2 size={18} className="absolute right-3 top-3 animate-spin text-zinc-400" />}
        </div>

        {searchResults.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg overflow-hidden">
            {searchResults.map(profile => (
              <div key={profile.id} className="flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 border-b border-zinc-100 dark:border-zinc-700 last:border-0">
                <div>
                  <div className="font-medium text-zinc-800 dark:text-zinc-200 text-sm">{profile.name || 'Nieznany'}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">{profile.email}</div>
                </div>
                <button
                  onClick={() => handleGrant(profile.id)}
                  className="p-1.5 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg transition-colors flex items-center text-xs font-medium"
                >
                  <UserPlus size={16} className="mr-1" /> Dodaj
                </button>
              </div>
            ))}
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
                      <option value="admin">Admin (Edycja)</option>
                      <option value="full">Pełny (Podgląd logistyki)</option>
                      <option value="basic">Niski (Podgląd nagłówka)</option>
                      <option value="minimal">Najniższy (Tylko data)</option>
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
