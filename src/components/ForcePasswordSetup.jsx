import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Loader2, ShieldCheck } from 'lucide-react';

import { X } from 'lucide-react';

export default function ForcePasswordSetup({ onComplete, onCancel }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      return setError('Hasło musi mieć co najmniej 6 znaków.');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      
      onComplete(); // Usuwa flagę i puszcza do aplikacji
    } catch (err) {
      setError('Błąd podczas ustawiania hasła: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative">
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X size={20} />
        </button>
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-teal-600 p-3 rounded-full text-white">
              <ShieldCheck size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-2">Witamy w Traveler!</h2>
          <p className="text-center text-slate-500 dark:text-zinc-400 mb-8">
            Wygląda na to, że logujesz się z linku zaproszenia lub odzyskiwania hasła. Aby zabezpieczyć swoje konto i móc zalogować się w przyszłości, <strong>musisz ustawić własne hasło</strong>.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Nowe hasło</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                placeholder="Wpisz bezpieczne hasło"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm border border-red-100 dark:border-red-900/50">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center disabled:opacity-70 mt-4 shadow-sm"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Zapisz hasło i przejdź do aplikacji'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
