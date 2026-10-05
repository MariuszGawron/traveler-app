import { useState, useEffect } from 'react';
import { X, Map, Car, Hotel, MapPin, Loader2, Trash, FileText, Users, Plus, Save, UserPlus, User, Edit2, ArrowLeft } from 'lucide-react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabaseClient';
import { useAccess, obfuscateEmail } from '../hooks/useAccess';

export default function SettingsModal({ onClose }) {
  const { mapSettings, setMapSettings, user } = useStore();
  const { searchProfiles } = useAccess();
  const [activeTab, setActiveTab] = useState('maps'); // 'maps' | 'templates' | 'groups'
  const [templates, setTemplates] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loadingTpl, setLoadingTpl] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (activeTab === 'templates' && user) {
      setLoadingTpl(true);
      supabase.from('checklist_templates').select('*').eq('user_id', user.id).then(({ data, error }) => {
        if (!error && data) setTemplates(data);
        setLoadingTpl(false);
      });
    }
    if (activeTab === 'groups' && user) {
      setLoadingTpl(true);
      supabase.from('user_groups').select('*').eq('owner_id', user.id).then(({ data, error }) => {
        if (!error && data) setGroups(data);
        setLoadingTpl(false);
      });
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (editingGroup && editingGroup.member_ids?.length > 0) {
      supabase.from('profiles').select('id, name, email').in('id', editingGroup.member_ids).then(({data}) => {
        if (data) setGroupMembers(data.map(p => ({ ...p, email: obfuscateEmail(p.email) })));
      });
    } else {
      setGroupMembers([]);
    }
  }, [editingGroup]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 3 && editingGroup) {
        setIsSearching(true);
        const results = await searchProfiles(searchQuery);
        setSearchResults(results.filter(r => !groupMembers.some(m => m.id === r.id) && r.id !== user.id));
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, groupMembers, editingGroup, user.id]);

  const toggleSetting = (key) => {
    setMapSettings({
      ...mapSettings,
      [key]: !mapSettings[key]
    });
  };

  const toggleAll = (state) => {
    setMapSettings({
      main: state,
      transport: state,
      accommodations: state,
      carRentals: state,
      parkings: state
    });
  };

  const deleteTemplate = async (id, name) => {
    if (!window.confirm(`Czy na pewno chcesz usunąć szablon "${name}"?`)) return;
    const { error } = await supabase.from('checklist_templates').delete().eq('id', id);
    if (error) {
      alert('Błąd usuwania: ' + error.message);
    } else {
      setTemplates(prev => prev.filter(t => t.id !== id));
    }
  };

  const deleteGroup = async (id, name) => {
    if (!window.confirm(`Czy na pewno chcesz usunąć grupę "${name}"?`)) return;
    const { error } = await supabase.from('user_groups').delete().eq('id', id);
    if (error) {
      alert('Błąd usuwania: ' + error.message);
    } else {
      setGroups(prev => prev.filter(g => g.id !== id));
    }
  };

  const saveEditedTemplate = async () => {
    if (!editingTemplate.name.trim()) return alert('Podaj nazwę szablonu');
    setSavingEdit(true);
    const { data, error } = await supabase.from('checklist_templates').update({
      name: editingTemplate.name.trim(),
      items: editingTemplate.items.map(({ text, assignee }) => ({ text, assignee, isCompleted: false }))
    }).eq('id', editingTemplate.id).select().single();
    setSavingEdit(false);
    if (error) alert('Błąd zapisu: ' + error.message);
    else {
      setTemplates(templates.map(t => t.id === editingTemplate.id ? data : t));
      setEditingTemplate(null);
    }
  };

  const saveEditedGroup = async () => {
    if (!editingGroup.name.trim()) return alert('Podaj nazwę grupy');
    setSavingEdit(true);
    const memberIds = groupMembers.map(m => m.id);
    const { data, error } = await supabase.from('user_groups').update({
      name: editingGroup.name.trim(),
      member_ids: memberIds
    }).eq('id', editingGroup.id).select().single();
    setSavingEdit(false);
    if (error) alert('Błąd zapisu: ' + error.message);
    else {
      setGroups(groups.map(g => g.id === editingGroup.id ? data : g));
      setEditingGroup(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-5 flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex-shrink-0">
          <h2 className="text-xl font-bold text-zinc-800 dark:text-white flex items-center">
            Ustawienia
          </h2>
          <button onClick={onClose} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-zinc-100 dark:border-zinc-800 px-5 bg-white dark:bg-zinc-900 flex-shrink-0">
          <button
            className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors flex items-center ${activeTab === 'maps' ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
            onClick={() => setActiveTab('maps')}
          >
            <Map size={16} className="mr-2" /> Mapy
          </button>
          <button
            className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors flex items-center ${activeTab === 'templates' ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
            onClick={() => setActiveTab('templates')}
          >
            <FileText size={16} className="mr-2" /> Szablony
          </button>
          <button
            className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors flex items-center ${activeTab === 'groups' ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
            onClick={() => setActiveTab('groups')}
          >
            <Users size={16} className="mr-2" /> Grupy
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {activeTab === 'maps' && (
            <div className="space-y-4">
              <div className="mb-6">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Wybierz, w jakich sekcjach mają ładować się mapy. Pozwoli to zoptymalizować działanie aplikacji przy większej liczbie zapisanych podróży.</p>

                <div className="flex gap-2 mb-6">
                  <button onClick={() => toggleAll(true)} className="flex-1 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium transition-colors">
                    Włącz wszystkie
                  </button>
                  <button onClick={() => toggleAll(false)} className="flex-1 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium transition-colors">
                    Wyłącz wszystkie
                  </button>
                </div>

                <div className="space-y-1">
                  <ToggleRow
                    icon={<Map size={18} className="text-teal-500" />}
                    label="Mapa główna (nagłówek)"
                    checked={mapSettings.main}
                    onChange={() => toggleSetting('main')}
                  />
                  <ToggleRow
                    icon={<Map size={18} className="text-sky-500" />}
                    label="Transport"
                    checked={mapSettings.transport}
                    onChange={() => toggleSetting('transport')}
                  />
                  <ToggleRow
                    icon={<Hotel size={18} className="text-amber-500" />}
                    label="Zakwaterowanie"
                    checked={mapSettings.accommodations}
                    onChange={() => toggleSetting('accommodations')}
                  />
                  <ToggleRow
                    icon={<Car size={18} className="text-purple-500" />}
                    label="Wynajem aut"
                    checked={mapSettings.carRentals}
                    onChange={() => toggleSetting('carRentals')}
                  />
                  <ToggleRow
                    icon={<MapPin size={18} className="text-slate-500" />}
                    label="Parkingi"
                    checked={mapSettings.parkings}
                    onChange={() => toggleSetting('parkings')}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-4">
              {editingTemplate ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setEditingTemplate(null)} className="p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"><ArrowLeft size={18} /></button>
                    <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">Edycja szablonu</h3>
                  </div>
                  <input type="text" value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Nazwa szablonu" />
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                    {editingTemplate.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input type="text" value={item.text} onChange={e => { const newItems = [...editingTemplate.items]; newItems[idx].text = e.target.value; setEditingTemplate({...editingTemplate, items: newItems}); }} className="flex-1 px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-teal-500" placeholder="Zadanie" />
                        <input type="text" value={item.assignee || ''} onChange={e => { const newItems = [...editingTemplate.items]; newItems[idx].assignee = e.target.value; setEditingTemplate({...editingTemplate, items: newItems}); }} className="w-24 px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-teal-500" placeholder="Kto?" />
                        <button onClick={() => { const newItems = editingTemplate.items.filter((_, i) => i !== idx); setEditingTemplate({...editingTemplate, items: newItems}); }} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded"><Trash size={16} /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <button onClick={() => setEditingTemplate({...editingTemplate, items: [...editingTemplate.items, {text:'', assignee:'', isCompleted:false}]})} className="text-teal-600 text-sm font-medium flex items-center"><Plus size={16} className="mr-1" /> Dodaj element</button>
                    <button onClick={saveEditedTemplate} disabled={savingEdit} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center">
                      {savingEdit ? <Loader2 size={16} className="animate-spin mr-1" /> : <Save size={16} className="mr-1" />} Zapisz
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Zarządzaj swoimi predefiniowanymi szablonami ekwipunku.</p>
                  
                  {loadingTpl ? (
                    <div className="flex justify-center py-6"><Loader2 className="animate-spin text-zinc-400" /></div>
                  ) : templates.length === 0 ? (
                    <div className="text-sm text-zinc-400 dark:text-zinc-500 italic text-center py-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">Nie masz jeszcze żadnych zapisanych szablonów.</div>
                  ) : (
                    <div className="space-y-2">
                      {templates.map(tpl => (
                        <div key={tpl.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-700">
                          <div>
                            <div className="font-medium text-zinc-800 dark:text-zinc-200 text-sm">{tpl.name}</div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">{tpl.items?.length || 0} elementów</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setEditingTemplate(JSON.parse(JSON.stringify(tpl)))} className="p-2 text-zinc-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg transition-colors" title="Edytuj szablon">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => deleteTemplate(tpl.id, tpl.name)} className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors" title="Usuń szablon">
                              <Trash size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="space-y-4">
              {editingGroup ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setEditingGroup(null); setSearchQuery(''); }} className="p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"><ArrowLeft size={18} /></button>
                    <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">Edycja grupy</h3>
                  </div>
                  <input type="text" value={editingGroup.name} onChange={e => setEditingGroup({...editingGroup, name: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Nazwa grupy" />
                  
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Szukaj osoby do dodania..."
                      className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    {isSearching && <Loader2 size={16} className="absolute right-3 top-2.5 animate-spin text-zinc-400" />}
                    {searchResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                        {searchResults.map(profile => (
                          <div key={profile.id} className="flex items-center justify-between p-2 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 border-b border-zinc-100 dark:border-zinc-700 last:border-0">
                            <div>
                              <div className="font-medium text-zinc-800 dark:text-zinc-200 text-sm">{profile.name || 'Nieznany'}</div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400">{profile.email}</div>
                            </div>
                            <button
                              onClick={() => {
                                setGroupMembers([...groupMembers, profile]);
                                setSearchQuery('');
                                setSearchResults([]);
                              }}
                              className="p-1.5 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg transition-colors flex items-center text-xs font-medium"
                            >
                              <UserPlus size={14} className="mr-1" /> Dodaj
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                    {groupMembers.length === 0 && <div className="text-sm text-zinc-400 italic">Brak członków w grupie.</div>}
                    {groupMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-lg">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-zinc-400" />
                          <div>
                            <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{member.name}</div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">{member.email}</div>
                          </div>
                        </div>
                        <button onClick={() => setGroupMembers(groupMembers.filter(m => m.id !== member.id))} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded"><Trash size={16} /></button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <button onClick={saveEditedGroup} disabled={savingEdit} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center">
                      {savingEdit ? <Loader2 size={16} className="animate-spin mr-1" /> : <Save size={16} className="mr-1" />} Zapisz grupę
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Zarządzaj swoimi zapisanymi grupami osób do udostępniania.</p>
                  
                  {loadingTpl ? (
                    <div className="flex justify-center py-6"><Loader2 className="animate-spin text-zinc-400" /></div>
                  ) : groups.length === 0 ? (
                    <div className="text-sm text-zinc-400 dark:text-zinc-500 italic text-center py-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">Nie masz jeszcze żadnych zapisanych grup.</div>
                  ) : (
                    <div className="space-y-2">
                      {groups.map(grp => (
                        <div key={grp.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-700">
                          <div>
                            <div className="font-medium text-zinc-800 dark:text-zinc-200 text-sm">{grp.name}</div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">{grp.member_ids?.length || 0} osób</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setEditingGroup(grp)} className="p-2 text-zinc-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg transition-colors" title="Edytuj grupę">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => deleteGroup(grp.id, grp.name)} className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors" title="Usuń grupę">
                              <Trash size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ icon, label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors group">
      <div className="flex items-center space-x-3">
        {icon}
        <span className="font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{label}</span>
      </div>
      <div className="relative flex items-center">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={onChange}
        />
        <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? 'bg-teal-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'transform translate-x-4' : ''}`}></div>
      </div>
    </label>
  );
}
