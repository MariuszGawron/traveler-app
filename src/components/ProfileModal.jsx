import { useState, useEffect } from 'react';
import { X, Save, Loader2, User } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

export default function ProfileModal({ onClose }) {
  const { user } = useStore();
  const [name, setName] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();
      if (data) setName(data.name || '');
      setLoading(false);
    };
    fetchProfile();
  }, [user.id]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    
    let hasError = false;

    // 1. Aktualizacja profilu (Imię i nazwisko)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ name })
      .eq('id', user.id);
      
    if (profileError) {
      hasError = true;
      setMessage({ type: 'error', text: 'Błąd zapisu profilu: ' + profileError.message });
    }

    // 2. Aktualizacja hasła (jeśli wpisano)
    if (password && !hasError) {
      if (!oldPassword) {
        hasError = true;
        setMessage({ type: 'error', text: 'Podaj stare hasło, aby zmienić na nowe.' });
      } else {
        // Weryfikacja starego hasła przez próbę logowania
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: oldPassword,
        });

        if (signInError) {
          hasError = true;
          setMessage({ type: 'error', text: 'Nieprawidłowe stare hasło.' });
        } else {
          // Stare hasło poprawne, zmieniamy na nowe
          const { error: passwordError } = await supabase.auth.updateUser({ password });
          if (passwordError) {
            hasError = true;
            setMessage({ type: 'error', text: 'Błąd zmiany hasła: ' + passwordError.message });
          }
        }
      }
    }
    
    setSaving(false);
    
    if (!hasError) {
      setMessage({ type: 'success', text: 'Dane zaktualizowane pomyślnie!' });
      setTimeout(onClose, 1500);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-900/50 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-800 dark:text-white flex items-center">
            <User size={20} className="mr-2 text-teal-600 dark:text-teal-400" /> Twój Profil
          </h2>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {message && (
            <div className={`p-3 text-sm rounded-lg ${message.type === 'error' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Adres e-mail</label>
            <input 
              type="text" 
              value={user.email} 
              disabled 
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-500 dark:text-zinc-400 cursor-not-allowed" 
            />
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">E-mail służy do logowania i jest niezmienny.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Imię i nazwisko</label>
            {loading ? (
              <div className="h-10 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-lg"></div>
            ) : (
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Np. Jan Kowalski"
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" 
              />
            )}
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">Tak widzą Cię inni uczestnicy wyjazdów.</p>
          </div>

          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 mt-2">Zmień hasło</label>
            <div className="space-y-3">
              <input 
                type="password" 
                value={oldPassword} 
                onChange={e => setOldPassword(e.target.value)} 
                placeholder="Obecne hasło"
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" 
              />
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Nowe hasło (min. 6 znaków)"
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" 
              />
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">Pozostaw puste, jeśli nie chcesz zmieniać hasła.</p>
          </div>
        </div>

        <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">
          <button 
            onClick={handleSave} 
            disabled={saving || loading} 
            className="flex items-center bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm"
          >
            {saving ? <Loader2 size={16} className="animate-spin mr-1.5" /> : <Save size={16} className="mr-1.5" />}
            Zapisz zmiany
          </button>
        </div>
      </div>
    </div>
  );
}
