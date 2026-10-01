import { useState, useEffect } from 'react';
import { X, Loader2, Save, Trash, Plus, FileText, CheckSquare } from 'lucide-react';
import { useTrips } from '../hooks/useTrips';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabaseClient';

export default function ChecklistModal({ trip, onClose }) {
  const { fetchTripDetails, updateTrip } = useTrips();
  const { user } = useStore();
  const [data, setData] = useState({ checklist: [] });
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

  const handleSave = async () => {
    setIsSaving(true);
    const res = await updateTrip(trip.id, {}, data);
    setIsSaving(false);
    if (!res.success) {
      alert('Błąd zapisu ekwipunku: ' + res.error);
    } else {
      onClose();
    }
  };

  const updateItem = (id, field, value) => setData(prev => ({ checklist: prev.checklist.map(item => item.id === id ? { ...item, [field]: value } : item) }));
  const addItem = () => setData(prev => ({ checklist: [...prev.checklist, { id: Date.now().toString(), text: '', isCompleted: false, assignee: '' }] }));
  const removeItem = (id) => setData(prev => ({ checklist: prev.checklist.filter(item => item.id !== id) }));
  const toggleStatus = (id) => setData(prev => ({ checklist: prev.checklist.map(item => item.id === id ? { ...item, isCompleted: !item.isCompleted } : item) }));

  const loadTemplate = (tpl) => {
    if (!tpl.items) return;
    const newItems = tpl.items.map(item => ({ ...item, id: Date.now().toString() + Math.random().toString() }));
    setData(prev => ({ checklist: [...prev.checklist, ...newItems] }));
  };

  const saveAsTemplate = async () => {
    const trimmedName = newTemplateName.trim();
    if (!trimmedName) return alert('Podaj nazwę szablonu');
    if (data.checklist.length === 0) return alert('Lista jest pusta');
    
    const existing = templates.find(t => t.name.toLowerCase() === trimmedName.toLowerCase());
    if (existing && !window.confirm(`Szablon "${existing.name}" już istnieje. Czy chcesz go nadpisać?`)) {
      return;
    }

    setSavingTemplate(true);
    const itemsToSave = data.checklist.map(({ text, assignee }) => ({ text, assignee, isCompleted: false }));
    
    let res;
    if (existing) {
      res = await supabase.from('checklist_templates').update({ items: itemsToSave }).eq('id', existing.id).select().single();
    } else {
      res = await supabase.from('checklist_templates').insert({ user_id: user.id, name: trimmedName, items: itemsToSave }).select().single();
    }
    
    setSavingTemplate(false);
    if (res.error) {
      alert('Błąd zapisu szablonu: ' + res.error.message);
    } else {
      if (existing) {
        setTemplates(templates.map(t => t.id === existing.id ? res.data : t));
      } else {
        setTemplates([...templates, res.data]);
      }
      setNewTemplateName('');
      alert('Szablon został zapisany pomyślnie!');
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-900/50 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-transparent dark:border-zinc-800" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <h2 className="text-xl font-bold text-zinc-800 dark:text-white flex items-center"><CheckSquare size={20} className="text-blue-500 mr-2" /> Ekwipunek: {trip.title}</h2>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"><X size={20} /></button>
        </div>
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-5 py-3 bg-white dark:bg-zinc-900">
          <button onClick={addItem} className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 text-sm font-medium flex items-center"><Plus size={16} className="mr-1" /> Dodaj element</button>
          <button onClick={handleSave} disabled={isSaving} className="flex items-center bg-teal-600 hover:bg-teal-700 text-white px-4 py-1.5 rounded-lg transition-colors text-sm font-medium shadow-sm">
            {isSaving ? <Loader2 size={16} className="animate-spin mr-1.5" /> : <Save size={16} className="mr-1.5" />} Zapisz zmiany
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 bg-white dark:bg-zinc-900 space-y-6">
          {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400" /></div> : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700">
                <div>
                  <h4 className="font-medium text-sm text-zinc-800 dark:text-zinc-200 mb-1">Szablony ekwipunku</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Załaduj szablon lub stwórz nowy z obecnej listy.</p>
                </div>
                <div className="flex flex-col sm:items-end gap-2">
                  {templates.length > 0 && (
                    <select onChange={(e) => { if(e.target.value) { const tpl = templates.find(t => t.id === e.target.value); if(tpl) loadTemplate(tpl); e.target.value = ''; } }} className="px-2 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-teal-500 w-full sm:w-auto">
                      <option value="">-- Wczytaj szablon --</option>
                      {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  )}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input type="text" placeholder="Nazwa nowego szablonu" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} className="flex-1 sm:flex-none px-2 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-teal-500" />
                    <button onClick={saveAsTemplate} disabled={savingTemplate} className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 rounded text-xs font-medium transition-colors flex items-center">
                      {savingTemplate ? <Loader2 size={12} className="animate-spin" /> : 'Zapisz'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                {data.checklist.length === 0 && <div className="text-sm text-zinc-400 dark:text-zinc-500 italic text-center py-2">Lista jest pusta.</div>}
                {data.checklist.map(item => (
                  <div key={item.id} className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${item.isCompleted ? 'bg-zinc-50/50 dark:bg-zinc-800/30 border-transparent' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'}`}>
                    <button onClick={() => toggleStatus(item.id)} className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${item.isCompleted ? 'bg-teal-500 border-teal-500 text-white' : 'border-zinc-300 dark:border-zinc-600 hover:border-teal-500'}`}>
                      {item.isCompleted && <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </button>
                    <input type="text" placeholder="Przedmiot / zadanie" value={item.text} onChange={e => updateItem(item.id, 'text', e.target.value)} className={`flex-1 px-2 py-1 text-sm bg-transparent border-none focus:outline-none focus:ring-0 ${item.isCompleted ? 'text-zinc-400 dark:text-zinc-500 line-through' : 'text-zinc-800 dark:text-zinc-200'}`} />
                    <input type="text" placeholder="Kto?" value={item.assignee || ''} onChange={e => updateItem(item.id, 'assignee', e.target.value)} className="w-24 sm:w-32 px-2 py-1 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-teal-500" />
                    <button onClick={() => removeItem(item.id)} className="text-zinc-400 hover:text-rose-500 p-1"><Trash size={14} /></button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
