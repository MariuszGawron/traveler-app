import { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, Calendar, Plane, Hotel, Clock, Users, User, Baby, Settings, Crown } from 'lucide-react';
import { useTrips } from '../hooks/useTrips';
import ManageTripModal from './ManageTripModal';

export default function TripCard({ trip, refetchTrips }) {
  const [expanded, setExpanded] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const { fetchTripDetails } = useTrips();

  const handleToggle = async () => {
    if (!expanded) {
      setLoading(true);
      const data = await fetchTripDetails(trip.id);
      setDetails(data);
      setLoading(false);
    }
    setExpanded(!expanded);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short' }).format(new Date(dateStr));
  };

  const hasLogistics = details && (
    (details.participants?.length > 0) ||
    (details.transports?.length > 0) ||
    (details.accommodations?.length > 0) ||
    (details.schedule?.length > 0)
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all hover:shadow-md">
      {/* Widok Horyzontu (Zawsze widoczny w zależności od roli) */}
      <div 
        className={`p-5 flex items-center justify-between ${trip.role !== 'basic' && trip.role !== 'minimal' ? 'cursor-pointer' : ''}`}
        onClick={trip.role === 'admin' || trip.role === 'full' ? handleToggle : undefined}
      >
        <div className="flex-1">
          <div className="flex items-center text-slate-500 text-sm font-medium mb-1 space-x-4">
            <span className="flex items-center">
              <Calendar size={16} className="mr-1.5 text-blue-500" />
              {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
            </span>
            {trip.role !== 'minimal' && (
              <span className="flex items-center">
                <MapPin size={16} className="mr-1.5 text-rose-500" />
                {trip.destination}
              </span>
            )}
            <span className="flex items-center text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full text-xs">
              <Crown size={12} className="mr-1 text-amber-500" />
              {trip.founderName}
            </span>
          </div>
          {trip.role !== 'minimal' ? (
            <h3 className="text-xl font-bold text-slate-800">{trip.title}</h3>
          ) : (
            <h3 className="text-xl font-bold text-slate-400 italic">Wyjazd ukryty</h3>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {trip.role === 'admin' && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsManageModalOpen(true); }}
              className="p-2 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-full transition-colors"
              title="Zarządzaj wyjazdem"
            >
              <Settings size={20} />
            </button>
          )}
          {(trip.role === 'admin' || trip.role === 'full') && (
            <div className="bg-slate-50 p-2 rounded-full text-slate-400">
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-300 border-t-blue-600"></div>
              ) : expanded ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Widok Logistyki (Dla uprawnionych, rozwija się jeśli są dane) */}
      {expanded && !loading && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-6 animate-in slide-in-from-top-2 duration-200">
          
          {/* Ekipa wyjazdowa */}
          {details.participants?.length > 0 && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <div className="flex items-center font-semibold text-slate-700 mb-3">
                <Users size={18} className="mr-2 text-indigo-500" />
                Ekipa wyjazdowa
              </div>
              <div className="flex flex-wrap gap-3">
                {details.participants.map((member, idx) => {
                  const isKid = member.type === 'dziecko';
                  return (
                    <div key={idx} className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium ${isKid ? 'bg-teal-50 text-teal-700' : 'bg-indigo-50 text-indigo-700'}`}>
                      {isKid ? <Baby size={16} /> : <User size={16} />} 
                      <span>{member.firstName} {member.lastName}</span>
                      {member.discounts && <span className="ml-1 opacity-75 text-xs">({member.discounts})</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Loty / Transport */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <div className="flex items-center font-semibold text-slate-700 mb-3">
                <Plane size={18} className="mr-2 text-sky-500" />
                Transport
              </div>
              {details.transports?.map((trans, idx) => (
                <div key={idx} className="text-sm text-slate-600 mb-4 last:mb-0 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <div className="font-semibold text-slate-800 capitalize mb-1">{trans.type} z {trans.from} do {trans.to}</div>
                  
                  {(trans.depDate || trans.arrDate) && (
                    <div className="grid grid-cols-2 gap-2 mt-2 bg-slate-50 p-2 rounded text-xs">
                      <div>
                        <div className="font-medium text-slate-500">Wylot/Wyjazd</div>
                        <div>{trans.depDate} {trans.depTime}</div>
                      </div>
                      <div>
                        <div className="font-medium text-slate-500">Przylot/Przyjazd</div>
                        <div>{trans.arrDate} {trans.arrTime}</div>
                      </div>
                    </div>
                  )}
                  {trans.bookingInfo && (
                    <div className="mt-2 text-xs">
                      <span className="bg-slate-100 font-mono px-1.5 py-0.5 rounded border border-slate-200">{trans.bookingInfo}</span>
                    </div>
                  )}
                </div>
              ))}
              {(!details.transports || details.transports.length === 0) && (
                <div className="text-sm text-slate-400 italic">Brak dodanego transportu</div>
              )}
            </div>

            {/* Hotel */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <div className="flex items-center font-semibold text-slate-700 mb-3">
                <Hotel size={18} className="mr-2 text-amber-500" />
                Zakwaterowanie
              </div>
              {details.accommodations?.map((hotel, idx) => (
                <div key={idx} className="text-sm text-slate-600 mb-4 last:mb-0 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <div className="font-semibold text-slate-800">{hotel.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-start">
                    <MapPin size={12} className="mr-1 mt-0.5 flex-shrink-0" />
                    <span>{hotel.address}</span>
                  </div>
                  {(hotel.dateFrom || hotel.dateTo) && (
                    <div className="mt-2 text-xs bg-slate-50 inline-block px-2 py-1 rounded text-slate-600">
                      {hotel.dateFrom} &mdash; {hotel.dateTo}
                    </div>
                  )}
                  {hotel.bookingInfo && <div className="text-xs mt-2">{hotel.bookingInfo}</div>}
                </div>
              ))}
              {(!details.accommodations || details.accommodations.length === 0) && (
                <div className="text-sm text-slate-400 italic">Brak dodanego zakwaterowania</div>
              )}
            </div>
          </div>

          {/* Harmonogram */}
          {details.schedule?.length > 0 && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <div className="flex items-center font-semibold text-slate-700 mb-3">
                <Clock size={18} className="mr-2 text-emerald-500" />
                Harmonogram dzienny
              </div>
              <div className="space-y-4">
                {details.schedule.map((sched, idx) => (
                  <div key={idx} className="flex text-sm">
                    <div className="w-24 flex flex-col">
                      <span className="font-semibold text-slate-700">{sched.day}</span>
                      <span className="text-xs text-slate-500">{sched.time}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">{sched.place}</div>
                      {sched.info && <div className="text-slate-500 text-xs mt-0.5">{sched.info}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Komunikat o braku uprawnień (puste dane) */}
      {expanded && !loading && !hasLogistics && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-5 text-center text-sm text-slate-500">
          Nie masz uprawnień do przeglądania logistyki tego wyjazdu.
        </div>
      )}

      {isManageModalOpen && (
        <ManageTripModal 
          trip={trip} 
          onClose={() => setIsManageModalOpen(false)} 
          refetchTrips={refetchTrips}
        />
      )}
    </div>
  );
}
