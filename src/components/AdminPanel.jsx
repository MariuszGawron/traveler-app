import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.rpc('get_admin_users_stats');

    if (error) {
      setError(error.message);
    } else if (data) {
      setUsers(data);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-zinc-400" /></div>;
  }

  if (error) {
    return (
      <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl border border-rose-100 dark:border-rose-900/50 text-sm">
        <p className="font-semibold mb-2">Błąd pobierania danych z bazy:</p>
        <p className="mb-4">{error}</p>
        <p className="font-medium mb-1">Aby ten panel działał, musisz wgrać poniższą funkcję (RPC) do bazy danych Supabase (SQL Editor):</p>
        <pre className="text-[10px] sm:text-xs bg-white dark:bg-black/20 p-4 rounded-lg border border-rose-200 dark:border-rose-900/50 overflow-x-auto select-all shadow-sm">
          {`CREATE OR REPLACE FUNCTION get_admin_users_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  is_global_admin boolean;
BEGIN
  -- 1. Weryfikujemy, czy dzwoniący to główny administrator systemu
  SELECT (email = 'mariusz.gawron1@gmail.com') INTO is_global_admin 
  FROM auth.users 
  WHERE id = auth.uid();
  
  IF NOT is_global_admin THEN
    RAISE EXCEPTION 'Odmowa dostępu: Wymagane uprawnienia globalnego administratora.';
  END IF;

  -- 2. Pobranie danych
  RETURN (
    SELECT COALESCE(json_agg(
      json_build_object(
        'id', u.id,
        'email', u.email,
        'name', p.name,
        'last_sign_in_at', u.last_sign_in_at,
        
        -- Zliczanie wyjazdów autorskich
        'owned_trips', (
            SELECT count(*) FROM trips t 
            WHERE t.creator_id = u.id
        ),
        
        -- Zliczanie wyjazdów udostępnionych (wyklucza wyjazdy autorskie)
        'shared_trips', (
            SELECT count(*) FROM trip_access ta 
            JOIN trips t ON ta.trip_id = t.id
            WHERE ta.user_id = u.id AND t.creator_id != u.id
        )
      )
    ), '[]'::json)
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
  );
END;
$$;`}
        </pre>
        <button onClick={fetchStats} className="mt-4 px-4 py-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-lg transition-colors font-medium text-sm">
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  // Zmienne do kafelków ze statystykami
  const totalUsers = users.length;
  const totalTrips = users.reduce((sum, u) => sum + (u.owned_trips || 0), 0);

  // Znalezienie najaktywniejszego twórcy
  const mostActiveUser = [...users].sort((a, b) => (b.owned_trips || 0) - (a.owned_trips || 0))[0];

  const handleAdminAction = (action, userEmail) => {
    if (action === 'reset') {
      if (window.confirm(`Czy na pewno chcesz wysłać link do resetowania hasła na adres: ${userEmail}?`)) {
        supabase.auth.resetPasswordForEmail(userEmail, {
          redirectTo: `${window.location.origin}/#type=recovery`,
        }).then(({ error }) => {
          if (error) alert('Błąd: ' + error.message);
          else alert('Wysłano link do resetu hasła!');
        });
      }
    } else if (action === 'delete') {
      alert(`Funkcja usuwania konta (${userEmail}) będzie wymagała osobnego Edge Function z uprawnieniami admina.`);
    } else if (action === 'suspend') {
      alert(`Funkcja zawieszania konta (${userEmail}) w przygotowaniu.`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Panel Administracyjny</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Globalne zarządzanie użytkownikami i platformą.</p>
      </div>

      {/* Kafelki ze statystykami */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 p-4 rounded-xl shadow-sm">
          <div className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Całkowita liczba użytkowników</div>
          <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">{totalUsers}</div>
        </div>
        <div className="bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 p-4 rounded-xl shadow-sm">
          <div className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Wszystkie wyjazdy w systemie</div>
          <div className="text-3xl font-bold text-sky-600 dark:text-sky-400">{totalTrips}</div>
        </div>
        <div className="bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 p-4 rounded-xl shadow-sm">
          <div className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Najaktywniejszy twórca</div>
          <div className="text-xl font-bold text-zinc-800 dark:text-zinc-200 truncate">
            {mostActiveUser ? (mostActiveUser.name || mostActiveUser.email) : '-'}
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            {mostActiveUser ? `${mostActiveUser.owned_trips} wyjazdów` : ''}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800/50 shadow-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs uppercase font-semibold">
            <tr>
              <th className="px-4 py-3">Użytkownik</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3 text-center">Własne<br />podróże</th>
              <th className="px-4 py-3 text-center">Dostęp<br />(udostępnione)</th>
              <th className="px-4 py-3">Ostatnie logowanie</th>
              <th className="px-4 py-3 text-center">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700/50 text-zinc-700 dark:text-zinc-300">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <td className="px-4 py-4 font-medium">{u.name || <span className="text-zinc-400 italic">Brak profilu</span>}</td>
                <td className="px-4 py-4 text-zinc-500">{u.email}</td>
                <td className="px-4 py-4 text-center"><span className="inline-block px-2 py-0.5 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 rounded font-semibold">{u.owned_trips}</span></td>
                <td className="px-4 py-4 text-center"><span className="inline-block px-2 py-0.5 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 rounded font-semibold">{u.shared_trips}</span></td>
                <td className="px-4 py-4 text-xs text-zinc-500">
                  {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString('pl-PL') : <span className="italic">Nigdy</span>}
                </td>
                <td className="px-4 py-4 text-center relative">
                  <AdminActionsMenu onAction={(action) => handleAdminAction(action, u.email)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminActionsMenu({ onAction }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
      >
        <span className="font-bold text-lg leading-none select-none">⋮</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 py-1 z-50 overflow-hidden">
          <button
            onMouseDown={() => onAction('reset')}
            className="flex items-center px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 w-full text-left"
          >
            Wymuś reset hasła
          </button>
          <button
            onMouseDown={() => onAction('suspend')}
            className="flex items-center px-4 py-2.5 text-sm text-amber-600 dark:text-amber-400 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 w-full text-left"
          >
            Zawieś konto (Block)
          </button>
          <div className="border-t border-zinc-100 dark:border-zinc-700 my-1"></div>
          <button
            onMouseDown={() => onAction('delete')}
            className="flex items-center px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 w-full text-left font-medium"
          >
            Usuń użytkownika
          </button>
        </div>
      )}
    </div>
  );
}
