import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const colors = [
  'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-200 dark:border-teal-800',
  'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-800',
  'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-800',
  'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800',
  'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-200 dark:border-sky-800',
  'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-800',
  'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800'
];

const getColorClass = (name) => {
  if (!name) return colors[0];
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  const index = sum % colors.length;
  return colors[index];
};

export default function CalendarView({ trips }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday

  // Adjust to make Monday the first day of the week
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthName = currentDate.toLocaleString('pl-PL', { month: 'long', year: 'numeric' });

  // Filter trips that overlap with current month
  // Create a helper to check if trip spans a given day
  const isTripInDay = (trip, day) => {
    const currentDay = new Date(year, month, day);
    currentDay.setHours(0, 0, 0, 0);

    const start = new Date(trip.start_date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(trip.end_date);
    end.setHours(23, 59, 59, 999);

    return currentDay >= start && currentDay <= end;
  };

  const days = [];
  for (let i = 0; i < startOffset; i++) {
    days.push(<div key={`empty-${i}`} className="h-24 sm:h-32 border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30"></div>);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dayTrips = trips.filter(trip => isTripInDay(trip, d));

    days.push(
      <div key={d} className="h-24 sm:h-32 border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-800 p-1 sm:p-2 overflow-hidden flex flex-col transition-colors">
        <span className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">{d}</span>
        <div className="flex-1 overflow-y-auto space-y-1">
          {dayTrips.map(trip => {
            const isMinimal = trip.role === 'minimal';
            const displayTitle = isMinimal ? 'Wyjazd ukryty' : trip.title;
            const tooltipTitle = `${displayTitle} (Utworzył/a: ${trip.founderName || 'Nieznany'})`;
            const colorClass = getColorClass(trip.founderName);

            return (
              <div
                key={trip.id}
                className={`${colorClass} text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded truncate font-medium border`}
                title={tooltipTitle}
              >
                {displayTitle}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50">
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white capitalize">{monthName}</h3>
        <div className="flex items-center space-x-2">
          <button onClick={prevMonth} className="p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-lg transition-colors text-zinc-600 dark:text-zinc-400 shadow-sm"><ChevronLeft size={16} /></button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-lg transition-colors text-zinc-600 dark:text-zinc-400 shadow-sm">Dziś</button>
          <button onClick={nextMonth} className="p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-lg transition-colors text-zinc-600 dark:text-zinc-400 shadow-sm"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
        {['Pon', 'Wto', 'Śro', 'Czw', 'Pią', 'Sob', 'Nie'].map(day => (
          <div key={day} className="py-2 text-center text-[10px] sm:text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days}
      </div>
    </div>
  );
}
