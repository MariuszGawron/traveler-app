import { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, Calendar, Plane, Hotel, Clock, Users, User, Baby, Settings, Crown, Car, FileText } from 'lucide-react';
import { useTrips } from '../hooks/useTrips';
import { useStore } from '../store/useStore';
import ManageTripModal from './ManageTripModal';

export default function TripCard({ trip, refetchTrips }) {
  const [expanded, setExpanded] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const { fetchTripDetails } = useTrips();
  const { mapSettings } = useStore();

  const handleToggle = async () => {
    if (!expanded) {
      setLoading(true);
      const data = await fetchTripDetails(trip.id);
      setDetails(data);
      setLoading(false);
    }
    setExpanded(!expanded);
  };

  // Kiedy zapisujemy zmiany w modalu, odświeżamy nagłówki (przez Dashboard) 
  // ORAZ szczegóły logistyki (jeśli karta jest aktualnie rozwinięta)
  const handleTripUpdated = async () => {
    if (refetchTrips) refetchTrips();

    if (expanded) {
      setLoading(true);
      const data = await fetchTripDetails(trip.id);
      setDetails(data);
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short' }).format(new Date(dateStr));
  };

  const hasLogistics = details && (
    (details.participants?.length > 0) ||
    (details.transports?.length > 0) ||
    (details.accommodations?.length > 0) ||
    (details.schedule?.length > 0) ||
    (details.parkings?.length > 0) ||
    (details.insurances?.length > 0) ||
    (details.carRentals?.length > 0)
  );

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700 overflow-hidden transition-all hover:shadow-md">
      {/* Mapka jako cover nagłówka */}
      {mapSettings?.main && trip.destination && trip.role !== 'minimal' && (
        <div className="w-full h-32 bg-zinc-100 dark:bg-zinc-800 relative pointer-events-none border-b border-zinc-100 dark:border-zinc-700">
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            marginHeight="0"
            marginWidth="0"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(trip.destination)}&output=embed`}
            title={`Mapa główna: ${trip.destination}`}
            className="dark:opacity-80 filter dark:brightness-75 dark:contrast-125"
          ></iframe>
        </div>
      )}

      {/* Widok Horyzontu (Zawsze widoczny w zależności od roli) */}
      <div
        className={`p-5 flex items-center justify-between ${trip.role !== 'basic' && trip.role !== 'minimal' ? 'cursor-pointer' : ''}`}
        onClick={trip.role === 'admin' || trip.role === 'full' ? handleToggle : undefined}
      >
        <div className="flex-1">
          <div className="flex items-center text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1 space-x-4">
            <span className="flex items-center">
              <Calendar size={16} className="mr-1.5 text-teal-500 dark:text-teal-400" />
              {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
            </span>
            {trip.role !== 'minimal' && (
              <span className="flex items-center">
                <MapPin size={16} className="mr-1.5 text-rose-500 dark:text-rose-400" />
                {trip.destination}
              </span>
            )}
            <span className="flex items-center text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-700 px-2 py-0.5 rounded-full text-xs">
              <Crown size={12} className="mr-1 text-amber-500 dark:text-amber-400" />
              {trip.founderName}
            </span>
          </div>
          {trip.role !== 'minimal' ? (
            <h3 className="text-xl font-bold text-zinc-800 dark:text-white">{trip.title}</h3>
          ) : (
            <h3 className="text-xl font-bold text-zinc-400 dark:text-zinc-500 italic">Wyjazd ukryty</h3>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {trip.role === 'admin' && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsManageModalOpen(true); }}
              className="p-2 bg-zinc-50 dark:bg-zinc-700/50 hover:bg-teal-50 dark:hover:bg-teal-900/30 text-zinc-400 dark:text-zinc-500 hover:text-teal-600 dark:hover:text-teal-400 rounded-full transition-colors"
              title="Zarządzaj wyjazdem"
            >
              <Settings size={20} />
            </button>
          )}
          {(trip.role === 'admin' || trip.role === 'full') && (
            <div className="bg-zinc-50 dark:bg-zinc-700/50 p-2 rounded-full text-zinc-400 dark:text-zinc-500">
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-zinc-300 dark:border-zinc-600 border-t-teal-600 dark:border-t-teal-400"></div>
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
        <div className="border-t border-zinc-100 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 p-5 space-y-6 animate-in slide-in-from-top-2 duration-200">

          {/* Ekipa wyjazdowa */}
          {details.participants?.length > 0 && (
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700">
              <div className="flex items-center font-semibold text-zinc-700 dark:text-zinc-200 mb-3">
                <Users size={18} className="mr-2 text-indigo-500 dark:text-indigo-400" />
                Ekipa wyjazdowa
              </div>
              <div className="flex flex-wrap gap-3">
                {details.participants.map((member, idx) => {
                  const isKid = member.type === 'dziecko';
                  return (
                    <div key={idx} className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium ${isKid ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'}`}>
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
            {details.transports?.length > 0 && (
              <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700">
                <div className="flex items-center font-semibold text-zinc-700 dark:text-zinc-200 mb-3">
                  <Plane size={18} className="mr-2 text-sky-500 dark:text-sky-400" />
                  Transport
                </div>
                {details.transports.map((trans, idx) => (
                  <div key={idx} className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 last:mb-0 border-b border-zinc-50 dark:border-zinc-700/50 pb-3 last:border-0 last:pb-0">
                    <div className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize mb-1">{trans.type} z {trans.from} do {trans.to}</div>

                    {(trans.depDate || trans.arrDate) && (
                      <div className="grid grid-cols-2 gap-2 mt-2 bg-zinc-50 dark:bg-zinc-700/30 p-2 rounded text-xs">
                        <div>
                          <div className="font-medium text-zinc-500 dark:text-zinc-500">Wylot/Wyjazd</div>
                          <div>{trans.depDate} {trans.depTime}</div>
                        </div>
                        <div>
                          <div className="font-medium text-zinc-500 dark:text-zinc-500">Przylot/Przyjazd</div>
                          <div>{trans.arrDate} {trans.arrTime}</div>
                        </div>
                      </div>
                    )}
                    {trans.bookingInfo && (
                      <div className="mt-2 text-xs">
                        <span className="bg-zinc-100 dark:bg-zinc-700 font-mono px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-600">{trans.bookingInfo}</span>
                      </div>
                    )}
                    {trans.from && trans.to && mapSettings?.transport && (
                      <div className="mt-3 w-full h-32 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 relative">
                        <iframe
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          scrolling="no"
                          marginHeight="0"
                          marginWidth="0"
                          src={`https://maps.google.com/maps?saddr=${encodeURIComponent(trans.from)}&daddr=${encodeURIComponent(trans.to)}&dirflg=${trans.type === 'auto' ? 'd' : (trans.type === 'autobus' || trans.type === 'pociąg') ? 'r' : ''}&output=embed`}
                          title={`Trasa z ${trans.from} do ${trans.to}`}
                          className="dark:opacity-80 filter dark:brightness-75 dark:contrast-125"
                        ></iframe>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Hotel */}
            {details.accommodations?.length > 0 && (
              <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700">
                <div className="flex items-center font-semibold text-zinc-700 dark:text-zinc-200 mb-3">
                  <Hotel size={18} className="mr-2 text-amber-500 dark:text-amber-400" />
                  Zakwaterowanie
                </div>
                {details.accommodations.map((hotel, idx) => (
                  <div key={idx} className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 last:mb-0 border-b border-zinc-50 dark:border-zinc-700/50 pb-3 last:border-0 last:pb-0">
                    <div className="font-semibold text-zinc-800 dark:text-zinc-200">{hotel.name}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5 flex items-start">
                      <MapPin size={12} className="mr-1 mt-0.5 flex-shrink-0" />
                      <span>{hotel.address}</span>
                    </div>
                    {(hotel.dateFrom || hotel.dateTo) && (
                      <div className="mt-2 text-xs bg-zinc-50 dark:bg-zinc-700/30 inline-block px-2 py-1 rounded text-zinc-600 dark:text-zinc-400">
                        {hotel.dateFrom} &mdash; {hotel.dateTo}
                      </div>
                    )}
                    {hotel.bookingInfo && <div className="text-xs mt-2">{hotel.bookingInfo}</div>}
                    {hotel.address && mapSettings?.accommodations && (
                      <div className="mt-3 w-full h-32 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 relative">
                        <iframe
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          scrolling="no"
                          marginHeight="0"
                          marginWidth="0"
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(hotel.address)}&output=embed`}
                          title={`Mapa ${hotel.name}`}
                          className="dark:opacity-80 filter dark:brightness-75 dark:contrast-125"
                        ></iframe>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Wynajem auta */}
            {details.carRentals?.length > 0 && (
              <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700">
                <div className="flex items-center font-semibold text-zinc-700 dark:text-zinc-200 mb-3">
                  <Car size={18} className="mr-2 text-purple-500 dark:text-purple-400" />
                  Wynajem auta
                </div>
                {details.carRentals.map((rental, idx) => (
                  <div key={idx} className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 last:mb-0 border-b border-zinc-50 dark:border-zinc-700/50 pb-3 last:border-0 last:pb-0">
                    <div className="font-semibold text-zinc-800 dark:text-zinc-200">{rental.company}</div>
                    <div className="text-xs text-zinc-500 mt-0.5 flex items-start">
                      <MapPin size={12} className="mr-1 mt-0.5 flex-shrink-0" />
                      <span>{rental.location}</span>
                    </div>
                    {(rental.dateFrom || rental.dateTo) && (
                      <div className="mt-2 text-xs bg-zinc-50 dark:bg-zinc-700/30 inline-block px-2 py-1 rounded text-zinc-600 dark:text-zinc-400">
                        {rental.dateFrom} &mdash; {rental.dateTo}
                      </div>
                    )}
                    {rental.bookingInfo && <div className="text-xs mt-2">{rental.bookingInfo}</div>}
                    {rental.location && mapSettings?.carRentals && (
                      <div className="mt-3 w-full h-32 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 relative">
                        <iframe
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          scrolling="no"
                          marginHeight="0"
                          marginWidth="0"
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(rental.location)}&output=embed`}
                          title={`Miejsce wynajmu auta: ${rental.location}`}
                          className="dark:opacity-80 filter dark:brightness-75 dark:contrast-125"
                        ></iframe>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Parkingi */}
            {details.parkings?.length > 0 && (
              <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700">
                <div className="flex items-center font-semibold text-zinc-700 dark:text-zinc-200 mb-3">
                  <MapPin size={18} className="mr-2 text-slate-500 dark:text-slate-400" />
                  Parkingi
                </div>
                {details.parkings.map((parking, idx) => (
                  <div key={idx} className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 last:mb-0 border-b border-zinc-50 dark:border-zinc-700/50 pb-3 last:border-0 last:pb-0">
                    <div className="font-semibold text-zinc-800 dark:text-zinc-200">{parking.location}</div>
                    {(parking.dateFrom || parking.dateTo) && (
                      <div className="mt-2 text-xs bg-zinc-50 dark:bg-zinc-700/30 inline-block px-2 py-1 rounded text-zinc-600 dark:text-zinc-400">
                        {parking.dateFrom} &mdash; {parking.dateTo}
                      </div>
                    )}
                    {parking.bookingInfo && <div className="text-xs mt-2">{parking.bookingInfo}</div>}
                    {parking.location && mapSettings?.parkings && (
                      <div className="mt-3 w-full h-32 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 relative">
                        <iframe
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          scrolling="no"
                          marginHeight="0"
                          marginWidth="0"
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(parking.location)}&output=embed`}
                          title={`Parking: ${parking.location}`}
                          className="dark:opacity-80 filter dark:brightness-75 dark:contrast-125"
                        ></iframe>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Ubezpieczenia */}
            {details.insurances?.length > 0 && (
              <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700">
                <div className="flex items-center font-semibold text-zinc-700 dark:text-zinc-200 mb-3">
                  <FileText size={18} className="mr-2 text-rose-500 dark:text-rose-400" />
                  Ubezpieczenia
                </div>
                {details.insurances.map((ins, idx) => (
                  <div key={idx} className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 last:mb-0 border-b border-zinc-50 dark:border-zinc-700/50 pb-3 last:border-0 last:pb-0">
                    <div className="font-semibold text-zinc-800 dark:text-zinc-200">{ins.company} {ins.policyNumber && <span className="font-normal text-zinc-500">({ins.policyNumber})</span>}</div>
                    {ins.contactInfo && <div className="text-xs mt-2 text-zinc-500">{ins.contactInfo}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Harmonogram */}
          {details.schedule?.length > 0 && (
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700">
              <div className="flex items-center font-semibold text-zinc-700 dark:text-zinc-200 mb-3">
                <Clock size={18} className="mr-2 text-emerald-500 dark:text-emerald-400" />
                Harmonogram dzienny
              </div>
              <div className="space-y-4">
                {details.schedule.map((sched, idx) => (
                  <div key={idx} className="flex text-sm">
                    <div className="w-24 flex flex-col">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">{sched.day}</span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-500">{sched.time}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-zinc-800 dark:text-zinc-200">{sched.place}</div>
                      {sched.info && <div className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">{sched.info}</div>}
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
        <div className="border-t border-zinc-100 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 p-5 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Brak informacji.
        </div>
      )}

      {isManageModalOpen && (
        <ManageTripModal
          trip={trip}
          onClose={() => setIsManageModalOpen(false)}
          refetchTrips={handleTripUpdated}
        />
      )}
    </div>
  );
}
