import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { useStore } from './store/useStore';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import ForcePasswordSetup from './components/ForcePasswordSetup';
import { Loader2 } from 'lucide-react';

function App() {
  const { session, setSession } = useStore();
  const [loading, setLoading] = useState(true);
  const [mustSetPassword, setMustSetPassword] = useState(() => localStorage.getItem('mustSetPassword') === 'true');

  useEffect(() => {
    // Przechwytujemy link z zaproszeniem lub resetem zanim Supabase go przetworzy
    if (window.location.hash.includes('type=invite') || window.location.hash.includes('type=recovery')) {
      localStorage.setItem('mustSetPassword', 'true');
      setMustSetPassword(true);
    }

    // Sprawdzamy obecną sesję
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Nasłuchujemy zmian autoryzacji
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        localStorage.setItem('mustSetPassword', 'true');
        setMustSetPassword(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  const [showPasswordSetup, setShowPasswordSetup] = useState(() => localStorage.getItem('mustSetPassword') === 'true');

  useEffect(() => {
    // Sync state if it changes
    if (mustSetPassword && !localStorage.getItem('mustSetPassword')) {
      setMustSetPassword(false);
      setShowPasswordSetup(false);
    }
  }, [mustSetPassword]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center transition-colors">
        <Loader2 className="animate-spin text-blue-600 dark:text-teal-500" size={40} />
      </div>
    );
  }

  return (
    <>
      {session ? (
        <Dashboard 
          mustSetPassword={mustSetPassword} 
          onOpenPasswordSetup={() => setShowPasswordSetup(true)} 
        />
      ) : (
        <Auth />
      )}
      
      {session && showPasswordSetup && (
        <ForcePasswordSetup 
          onComplete={() => {
            localStorage.removeItem('mustSetPassword');
            setMustSetPassword(false);
            setShowPasswordSetup(false);
          }} 
          onCancel={() => setShowPasswordSetup(false)}
        />
      )}
    </>
  );
}

export default App;
