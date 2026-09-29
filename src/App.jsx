import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { useStore } from './store/useStore';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import { Loader2 } from 'lucide-react';

function App() {
  const { session, setSession } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sprawdzamy obecną sesję
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Nasłuchujemy zmian autoryzacji
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return session ? <Dashboard /> : <Auth />;
}

export default App;
