import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PlaneTakeoff, Loader2 } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');

  const handleResetPassword = async () => {
    if (!email) {
      setError('Wpisz swój adres e-mail powyżej, aby zresetować hasło.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setSuccessMsg('Na twój adres e-mail wysłano link do resetu hasła.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name
            }
          }
        });
        if (error) throw error;
        
        if (data?.user?.identities?.length === 0) {
          setError('Konto o podanym adresie e-mail już istnieje.');
          return;
        }

        if (!data?.session) {
          setSuccessMsg('Konto zostało utworzone! Jeśli wymagane jest potwierdzenie e-mail, sprawdź swoją skrzynkę. Następnie możesz się zalogować.');
          setIsLogin(true);
          setPassword('');
        }
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-transparent dark:border-zinc-800 transition-colors">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 dark:bg-teal-600 p-3 rounded-full text-white">
              <PlaneTakeoff size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-2">Traveler</h2>
          <p className="text-center text-slate-500 dark:text-zinc-400 mb-8">
            {isLogin ? 'Witaj ponownie, zaloguj się' : 'Utwórz nowe konto'}
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Imię i nazwisko</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-teal-500 focus:border-blue-500 dark:focus:border-teal-500 outline-none transition-all"
                  placeholder="Jan Kowalski"
                  required={!isLogin}
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Adres e-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-teal-500 focus:border-blue-500 dark:focus:border-teal-500 outline-none transition-all"
                placeholder="twoj@email.com"
                required
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300">Hasło</label>
                {isLogin && (
                  <button 
                    type="button"
                    onClick={handleResetPassword}
                    className="text-xs font-medium text-blue-600 dark:text-teal-400 hover:underline focus:outline-none"
                  >
                    Zapomniałeś hasła?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-teal-500 focus:border-blue-500 dark:focus:border-teal-500 outline-none transition-all"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm border border-red-100 dark:border-red-900/50">
                {error}
              </div>
            )}
            
            {successMsg && (
              <div className="p-3 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg text-sm border border-teal-100 dark:border-teal-900/50">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 dark:bg-teal-600 hover:bg-blue-700 dark:hover:bg-teal-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center disabled:opacity-70 mt-4 shadow-sm"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : isLogin ? 'Zaloguj się' : 'Utwórz konto'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-slate-500 dark:text-zinc-400">
              {isLogin ? 'Nie masz konta? ' : 'Masz już konto? '}
            </span>
            <button 
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(null); setSuccessMsg(null); }} 
              className="text-blue-600 dark:text-teal-400 font-medium hover:underline focus:outline-none ml-1"
            >
              {isLogin ? 'Zarejestruj się' : 'Zaloguj się'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
