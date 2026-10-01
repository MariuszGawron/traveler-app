import { useState, useEffect } from 'react';
import { X, Loader2, Save, Trash, Plus, FileText } from 'lucide-react';
import { useTrips } from '../hooks/useTrips';

export default function ExpensesModal({ trip, onClose }) {
  const { fetchTripDetails, updateTrip } = useTrips();
  const [data, setData] = useState({ expenses: [] });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTripDetails(trip.id).then(res => {
      setData({ expenses: res.expenses || [] });
      setLoading(false);
    });
  }, [trip.id]);

  const handleSave = async () => {
    setIsSaving(true);
    const res = await updateTrip(trip.id, {}, data);
    setIsSaving(false);
    if (!res.success) {
      alert('Błąd zapisu kosztów: ' + res.error);
    } else {
      onClose();
    }
  };

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

  return (
    <div className="fixed inset-0 bg-zinc-900/50 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-transparent dark:border-zinc-800" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <h2 className="text-xl font-bold text-zinc-800 dark:text-white flex items-center"><FileText size={20} className="text-emerald-500 mr-2" /> Rozliczenia: {trip.title}</h2>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"><X size={20} /></button>
        </div>
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-5 py-3 bg-white dark:bg-zinc-900">
          <button onClick={addItem} className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 text-sm font-medium flex items-center"><Plus size={16} className="mr-1" /> Dodaj koszt</button>
          <button onClick={handleSave} disabled={isSaving} className="flex items-center bg-teal-600 hover:bg-teal-700 text-white px-4 py-1.5 rounded-lg transition-colors text-sm font-medium shadow-sm">
            {isSaving ? <Loader2 size={16} className="animate-spin mr-1.5" /> : <Save size={16} className="mr-1.5" />} Zapisz zmiany
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 bg-white dark:bg-zinc-900 space-y-3">
          {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400" /></div> : (
            <>
              {data.expenses.length === 0 && <div className="text-sm text-zinc-400 dark:text-zinc-500 italic text-center py-4">Brak wydatków.</div>}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
