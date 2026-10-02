import { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, Calendar, Plane, Hotel, Clock, Users, UserRound, Baby, Settings, Crown, Car, FileText, Paperclip, Download, Trash2, Printer, Wallet, CheckSquare, Smile, LogOut, MoreVertical } from 'lucide-react';
import { useTrips } from '../hooks/useTrips';
import { useStore } from '../store/useStore';
import ManageTripModal from './ManageTripModal';
import ExpensesModal from './ExpensesModal';
import ChecklistModal from './ChecklistModal';
import { supabase } from '../lib/supabaseClient';
import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

export default function TripCard({ trip, refetchTrips }) {
  const [expanded, setExpanded] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { fetchTripDetails, updateTrip } = useTrips();
  const { mapSettings, user } = useStore();

  const handleLeaveTrip = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Czy na pewno chcesz opuścić wyjazd "${trip.title}" i przestać go obserwować? Stracisz do niego dostęp.`)) return;
    try {
      const { data, error } = await supabase.from('trip_access').delete().eq('trip_id', trip.id).eq('user_id', user.id).select();
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Brak uprawnień do usunięcia własnego dostępu.");
      }
      if (refetchTrips) refetchTrips();
    } catch (err) {
      alert('Błąd podczas opuszczania wyjazdu: ' + err.message);
    }
  };

  const handleFileUpload = async (e, category, itemIdx) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, '_');
      const fileName = `${crypto.randomUUID()}_${safeFileName}`;
      const filePath = `${trip.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('travel_docs').upload(filePath, file);
      if (uploadError) throw uploadError;

      const newDetails = { ...details };
      if (!newDetails[category][itemIdx].attachments) {
        newDetails[category][itemIdx].attachments = [];
      }
      newDetails[category][itemIdx].attachments.push({ path: filePath, name: file.name });
      setDetails(newDetails);
      await updateTrip(trip.id, {}, newDetails);
    } catch (err) {
      alert("Błąd podczas wgrywania pliku: " + err.message);
    }
    e.target.value = '';
  };

  const handleDownloadAttachment = async (path, originalName) => {
    try {
      const { data, error } = await supabase.storage.from('travel_docs').download(path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Błąd pobierania: ' + err.message);
    }
  };

  const handleDeleteAttachment = async (category, itemIdx, attIdx, path) => {
    if (!window.confirm("Na pewno usunąć ten załącznik?")) return;
    try {
      const { error } = await supabase.storage.from('travel_docs').remove([path]);
      if (error) throw error;
      const newDetails = { ...details };
      newDetails[category][itemIdx].attachments.splice(attIdx, 1);
      setDetails(newDetails);
      await updateTrip(trip.id, {}, newDetails);
    } catch (err) {
      alert('Błąd usuwania: ' + err.message);
    }
  };

  const generateMasterPdf = async (e) => {
    e.stopPropagation();
    try {
      setPdfGenerating(true);
      const doc = await PDFDocument.create();

      doc.registerFontkit(fontkit);
      const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf';
      const fontBytes = await fetch(fontUrl).then(res => res.arrayBuffer());
      const customFont = await doc.embedFont(fontBytes);

      const sanitizeText = (str) => str ? String(str).replace(/[^\x20-\x7E\xA0-\xFF\u0100-\u017F\u0180-\u024F]/g, "") : "";

      let page = doc.addPage();
      let cursorY = 800;

      const checkPage = (needed) => {
        if (cursorY - needed < 50) {
          page = doc.addPage();
          cursorY = 800;
        }
      };

      const splitTextIntoLines = (text, size, maxWidth, font) => {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const width = font.widthOfTextAtSize(testLine, size);
          if (width > maxWidth && currentLine !== '') {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) {
          lines.push(currentLine);
        }
        return lines;
      };

      const drawText = (text, size) => {
        if (!text) return;
        const sanitized = sanitizeText(text);
        const lines = splitTextIntoLines(sanitized, size, 500, customFont);

        for (const line of lines) {
          checkPage(size + 10);
          page.drawText(line, { x: 50, y: cursorY, size, font: customFont });
          cursorY -= (size + 5);
        }
        cursorY -= 10;
      };

      let currentDetails = details;
      if (!expanded) {
        currentDetails = await fetchTripDetails(trip.id);
      }

      drawText(`Wyjazd: ${trip.title}`, 24);
      drawText(`Miejsce: ${trip.destination || 'Brak'}`, 16);
      drawText(`Termin: ${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}`, 14);
      cursorY -= 20;

      const canSeeMedium = trip.role === 'admin' || trip.role === 'full' || trip.role === 'medium';
      const canSeeFull = trip.role === 'admin' || trip.role === 'full';

      if (canSeeMedium && currentDetails.participants?.length > 0) {
        drawText("--- EKIPA WYJAZDOWA ---", 18);
        currentDetails.participants.forEach(p => {
          drawText(`${p.firstName} ${p.lastName} (${p.type})`, 12);
        });
        cursorY -= 20;
      }

      const processSection = async (title, items, renderItemText) => {
        if (!items || items.length === 0) return;
        drawText(`--- ${title} ---`, 18);

        for (const item of items) {
          renderItemText(item);

          if (canSeeFull && item.attachments && item.attachments.length > 0) {
            drawText("Zalaczniki:", 10);
            for (const att of item.attachments) {
              drawText(`- ${att.name}`, 10);
              if (att.name.toLowerCase().endsWith('.pdf')) {
                try {
                  const { data } = await supabase.storage.from('travel_docs').download(att.path);
                  if (data) {
                    const arrayBuffer = await data.arrayBuffer();
                    const externalPdf = await PDFDocument.load(arrayBuffer);
                    const copiedPages = await doc.copyPages(externalPdf, externalPdf.getPageIndices());
                    copiedPages.forEach(p => doc.addPage(p));
                    // Powrót do nowej pustej strony po doklejeniu załącznika, by tekst miał gdzie się pisać
                    page = doc.addPage();
                    cursorY = 800;
                  }
                } catch (err) {
                  console.warn("Pominięto plik:", att.name, err);
                }
              }
            }
          }
          cursorY -= 15;
        }
      };

      if (canSeeMedium) {
        await processSection("TRANSPORT", currentDetails.transports, (t) => {
          drawText(`- ${t.type} z ${t.from} do ${t.to}`, 14);
          if (t.depDate || t.arrDate) drawText(`Wylot: ${t.depDate} ${t.depTime} | Przylot: ${t.arrDate} ${t.arrTime}`, 12);
          if (t.bookingInfo) drawText(`Info: ${t.bookingInfo}`, 10);
        });

        await processSection("ZAKWATEROWANIE", currentDetails.accommodations, (a) => {
          drawText(`- ${a.name}`, 14);
          drawText(`Adres: ${a.address}`, 12);
          if (a.dateFrom || a.dateTo) drawText(`Od: ${a.dateFrom} Do: ${a.dateTo}`, 12);
          if (a.bookingInfo) drawText(`Info: ${a.bookingInfo}`, 10);
        });

        await processSection("UBEZPIECZENIA", currentDetails.insurances, (i) => {
          drawText(`- ${i.company}`, 14);
          if (i.policyNumber) drawText(`Polisa: ${i.policyNumber}`, 12);
          if (i.contactInfo) drawText(`Kontakt: ${i.contactInfo}`, 10);
        });
      }

      if (canSeeFull) {
        await processSection("WYNAJEM AUTA", currentDetails.carRentals, (r) => {
          drawText(`- ${r.company}`, 14);
          drawText(`Miejsce: ${r.location}`, 12);
          if (r.dateFrom || r.dateTo) drawText(`Od: ${r.dateFrom} Do: ${r.dateTo}`, 12);
          if (r.bookingInfo) drawText(`Info: ${r.bookingInfo}`, 10);
        });

        await processSection("PARKINGI", currentDetails.parkings, (p) => {
          drawText(`- ${p.location}`, 14);
          if (p.dateFrom || p.dateTo) drawText(`Od: ${p.dateFrom} Do: ${p.dateTo}`, 12);
          if (p.bookingInfo) drawText(`Info: ${p.bookingInfo}`, 10);
        });

        await processSection("HARMONOGRAM", currentDetails.schedule, (s) => {
          drawText(`- ${s.day} ${s.time} - ${s.place}`, 14);
          if (s.info) drawText(`Info: ${s.info}`, 12);
        });
      }

      const pdfBytes = await doc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Master_PDF_${trip.title}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Błąd generowania PDF: ' + err.message);
    } finally {
      setPdfGenerating(false);
    }
  };

  const renderAttachments = (category, item, itemIdx) => {
    if (trip.role !== 'admin' && trip.role !== 'full') return null;
    return (
      <div className="mt-3 border-t border-zinc-100 dark:border-zinc-700/50 pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Załączniki</span>
          <label className="cursor-pointer flex items-center text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors bg-teal-50 dark:bg-teal-900/30 px-2 py-1 rounded">
            <Paperclip size={14} className="mr-1" /> Załącz plik
            <input type="file" className="hidden" accept="application/pdf,image/*" onChange={(e) => handleFileUpload(e, category, itemIdx)} />
          </label>
        </div>
        {item.attachments && item.attachments.length > 0 ? (
          <ul className="space-y-2">
            {item.attachments.map((att, attIdx) => (
              <li key={attIdx} className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded text-xs">
                <span className="truncate flex-1 mr-2 text-zinc-600 dark:text-zinc-300">{att.name}</span>
                <div className="flex items-center space-x-2">
                  <button onClick={(e) => { e.stopPropagation(); handleDownloadAttachment(att.path, att.name); }} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200" title="Pobierz">
                    <Download size={14} />
                  </button>
                  {trip.role === 'admin' && (
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteAttachment(category, itemIdx, attIdx, att.path); }} className="text-rose-400 hover:text-rose-600" title="Usuń">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-xs text-zinc-400 dark:text-zinc-500 italic">Brak załączników</div>
        )}
      </div>
    );
  };

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

  const getMapLocation = (loc, type) => {
    if (type === 'samolot' && loc && !/airport|lotnisko/i.test(loc)) {
      return `${loc} airport`;
    }
    return loc;
  };

  const canSeeFull = trip.role === 'admin' || trip.role === 'full';
  const isCreator = trip.creator_id === user?.id;

  const founderColors = [
    'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300',
    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
    'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300',
    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300'
  ];

  const getFounderColorClass = (name) => {
    if (!name) return founderColors[0];
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    return founderColors[sum % founderColors.length];
  };

  const hasLogistics = details && (
    (details.participants?.length > 0) ||
    (details.transports?.length > 0) ||
    (details.accommodations?.length > 0) ||
    (details.insurances?.length > 0) ||
    (canSeeFull && details.schedule?.length > 0) ||
    (canSeeFull && details.parkings?.length > 0) ||
    (canSeeFull && details.carRentals?.length > 0)
  );

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700 transition-all hover:shadow-md relative">
      {/* Mapka jako cover nagłówka */}
      {mapSettings?.main && trip.destination && trip.role !== 'minimal' && (
        <div className="w-full h-32 bg-zinc-100 dark:bg-zinc-800 relative pointer-events-none border-b border-zinc-100 dark:border-zinc-700 rounded-t-2xl overflow-hidden">
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
        onClick={trip.role === 'admin' || trip.role === 'full' || trip.role === 'medium' ? handleToggle : undefined}
      >
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex flex-wrap items-center text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1 gap-x-4 gap-y-2">
            <span className="flex items-center whitespace-nowrap">
              <Calendar size={16} className="mr-1.5 text-teal-500 dark:text-teal-400 flex-shrink-0" />
              {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
            </span>
            {trip.role !== 'minimal' && (
              <span className="flex items-center min-w-0">
                <MapPin size={16} className="mr-1.5 text-rose-500 dark:text-rose-400 flex-shrink-0" />
                <span className="truncate">{trip.destination}</span>
              </span>
            )}
            <span className={`flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getFounderColorClass(trip.founderName)}`}>
              <Crown size={12} className="mr-1 opacity-70 flex-shrink-0" />
              {trip.founderName}
            </span>
          </div>
          {trip.role !== 'minimal' ? (
            <h3 className="text-lg sm:text-xl font-bold text-zinc-800 dark:text-white break-words">{trip.title}</h3>
          ) : (
            <h3 className="text-lg sm:text-xl font-bold text-zinc-400 dark:text-zinc-500 italic">Wyjazd ukryty</h3>
          )}
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          {(trip.role !== 'minimal' && trip.role !== 'basic' || trip.role === 'admin' || !isCreator) && (
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                className="p-2 bg-zinc-50 dark:bg-zinc-700/50 hover:bg-teal-50 dark:hover:bg-teal-900/30 text-zinc-400 dark:text-zinc-500 hover:text-teal-600 dark:hover:text-teal-400 rounded-full transition-colors"
                title="Więcej opcji"
              >
                <MoreVertical size={20} />
              </button>

              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }}></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 py-1 z-50 overflow-hidden flex flex-col">

                    {(trip.role === 'admin' || trip.role === 'full') && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); setIsExpensesModalOpen(true); }}
                          className="flex items-center px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 w-full text-left transition-colors"
                        >
                          <Wallet size={18} className="mr-3 text-emerald-500" />
                          Rozliczenia
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); setIsChecklistModalOpen(true); }}
                          className="flex items-center px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 w-full text-left transition-colors"
                        >
                          <CheckSquare size={18} className="mr-3 text-sky-500" />
                          Ekwipunek
                        </button>
                        <div className="border-t border-zinc-100 dark:border-zinc-700 my-1"></div>
                      </>
                    )}

                    {(trip.role !== 'minimal' && trip.role !== 'basic') && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); generateMasterPdf(e); }}
                        disabled={pdfGenerating}
                        className="flex items-center px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 w-full text-left transition-colors"
                      >
                        {pdfGenerating ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-zinc-300 dark:border-zinc-600 border-t-teal-600 dark:border-t-teal-400 mr-3"></div> : <Printer size={18} className="mr-3 text-teal-500" />}
                        Generuj PDF
                      </button>
                    )}

                    {trip.role === 'admin' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); setIsManageModalOpen(true); }}
                        className="flex items-center px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 w-full text-left transition-colors"
                      >
                        <Settings size={18} className="mr-3 text-indigo-500" />
                        Ustawienia wyjazdu
                      </button>
                    )}

                    {!isCreator && (
                      <>
                        <div className="border-t border-zinc-100 dark:border-zinc-700 my-1"></div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); handleLeaveTrip(e); }}
                          className="flex items-center px-4 py-3 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 w-full text-left transition-colors"
                        >
                          <LogOut size={18} className="mr-3" />
                          Opuść wyjazd (Zrezygnuj)
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          {(trip.role === 'admin' || trip.role === 'full' || trip.role === 'medium') && (
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
        <div className="border-t border-zinc-100 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 p-5 space-y-6 animate-in slide-in-from-top-2 duration-200 rounded-b-2xl">

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
                  const isYouth = member.type === 'młodzież';
                  const colorClasses = isKid
                    ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
                    : isYouth
                      ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400';

                  return (
                    <div key={idx} className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium ${colorClasses}`}>
                      {isKid ? <Baby size={16} /> : isYouth ? <Smile size={16} /> : <UserRound size={16} />}
                      <span>{member.firstName} {member.lastName}</span>
                      {member.discounts && <span className="ml-1 opacity-75 text-xs">({member.discounts})</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="columns-1 md:columns-2 gap-4">
            {/* Loty / Transport */}
            {details.transports?.length > 0 && (
              <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700 break-inside-avoid mb-4">
                <div className="flex items-center font-semibold text-zinc-700 dark:text-zinc-200 mb-3">
                  <Plane size={18} className="mr-2 text-sky-500 dark:text-sky-400" />
                  Transport
                </div>
                {[...details.transports].sort((a, b) => {
                  const strA = `${a.depDate || '9999-12-31'} ${a.depTime || '00:00'}`;
                  const strB = `${b.depDate || '9999-12-31'} ${b.depTime || '00:00'}`;
                  return strA.localeCompare(strB);
                }).map((trans) => {
                  const originalIdx = details.transports.indexOf(trans);
                  return (
                    <div key={trans.id || originalIdx} className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 last:mb-0 border-b border-zinc-50 dark:border-zinc-700/50 pb-3 last:border-0 last:pb-0">
                      <div className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize mb-1">{trans.type} z {trans.from} do {trans.to}</div>

                      {(trans.depDate || trans.arrDate) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 bg-zinc-50 dark:bg-zinc-700/30 p-2 rounded text-xs">
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
                          <span className="bg-zinc-100 dark:bg-zinc-700 font-mono px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-600 break-all inline-block">{trans.bookingInfo}</span>
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
                            src={`https://maps.google.com/maps?saddr=${encodeURIComponent(getMapLocation(trans.from, trans.type))}&daddr=${encodeURIComponent(getMapLocation(trans.to, trans.type))}&dirflg=${trans.type === 'auto' ? 'd' : (trans.type === 'autobus' || trans.type === 'pociąg') ? 'r' : ''}&output=embed`}
                            title={`Trasa z ${trans.from} do ${trans.to}`}
                            className="dark:opacity-80 filter dark:brightness-75 dark:contrast-125"
                          ></iframe>
                        </div>
                      )}
                      {renderAttachments('transports', trans, originalIdx)}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Hotel */}
            {details.accommodations?.length > 0 && (
              <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700 break-inside-avoid mb-4">
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
                    {hotel.bookingInfo && <div className="text-xs mt-2 break-words">{hotel.bookingInfo}</div>}
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
                    {renderAttachments('accommodations', hotel, idx)}
                  </div>
                ))}
              </div>
            )}

            {/* Wynajem auta */}
            {canSeeFull && details.carRentals?.length > 0 && (
              <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700 break-inside-avoid mb-4">
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
                    {rental.bookingInfo && <div className="text-xs mt-2 break-words">{rental.bookingInfo}</div>}
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
                    {renderAttachments('carRentals', rental, idx)}
                  </div>
                ))}
              </div>
            )}

            {/* Parkingi */}
            {canSeeFull && details.parkings?.length > 0 && (
              <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700 break-inside-avoid mb-4">
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
                    {parking.bookingInfo && <div className="text-xs mt-2 break-words">{parking.bookingInfo}</div>}
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
                    {renderAttachments('parkings', parking, idx)}
                  </div>
                ))}
              </div>
            )}

            {/* Ubezpieczenia */}
            {details.insurances?.length > 0 && (
              <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700 break-inside-avoid mb-4">
                <div className="flex items-center font-semibold text-zinc-700 dark:text-zinc-200 mb-3">
                  <FileText size={18} className="mr-2 text-rose-500 dark:text-rose-400" />
                  Ubezpieczenia
                </div>
                {details.insurances.map((ins, idx) => (
                  <div key={idx} className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 last:mb-0 border-b border-zinc-50 dark:border-zinc-700/50 pb-3 last:border-0 last:pb-0">
                    <div className="font-semibold text-zinc-800 dark:text-zinc-200">{ins.company} {ins.policyNumber && <span className="font-normal text-zinc-500">({ins.policyNumber})</span>}</div>
                    {ins.contactInfo && <div className="text-xs mt-2 text-zinc-500">{ins.contactInfo}</div>}
                    {renderAttachments('insurances', ins, idx)}
                  </div>
                ))}
              </div>
            )}

            {/* Harmonogram */}
            {canSeeFull && details.schedule?.length > 0 && (
              <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700 break-inside-avoid mb-4">
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
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-zinc-800 dark:text-zinc-200 break-words">{sched.place}</div>
                        {sched.info && <div className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5 break-words">{sched.info}</div>}
                        {renderAttachments('schedule', sched, idx)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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

      {isExpensesModalOpen && (
        <ExpensesModal
          trip={trip}
          onClose={() => setIsExpensesModalOpen(false)}
        />
      )}

      {isChecklistModalOpen && (
        <ChecklistModal
          trip={trip}
          onClose={() => setIsChecklistModalOpen(false)}
        />
      )}
    </div>
  );
}
