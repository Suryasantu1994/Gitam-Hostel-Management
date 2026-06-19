/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Building, Floor, RoomMeta, UserProfile } from '../types';
import { ChevronDown, Plus, Trash2, Save, RotateCcw, Building2, X, Users, Shield, ShieldOff } from 'lucide-react';
import { cn } from '../lib/utils';

interface SettingsProps {
  buildings: Record<string, Building>;
  onUpdateBuildings: (buildings: Record<string, Building>) => void;
  users: UserProfile[];
  onUpdateUser: (user: UserProfile) => void;
}

export default function SettingsView({ buildings, onUpdateBuildings, users, onUpdateUser }: SettingsProps) {
  const [editedBuildings, setEditedBuildings] = useState<Record<string, Building>>(JSON.parse(JSON.stringify(buildings)));
  const [openBldId, setOpenBldIdx] = useState<string | null>(null);
  const [individualEditFloor, setIndividualEditFloor] = useState<string | null>(null); // "bldId-floorIdx"
  const [newAmenInput, setNewAmenInput] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const handleBldFieldChange = (id: string, field: keyof Building, value: string) => {
    setEditedBuildings(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
    setSaveStatus('idle');
  };

  const handleRoomMetaChange = (bldId: string, floorIdx: number, roomNumber: string, metaKey: keyof RoomMeta, value: any) => {
    setEditedBuildings(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const floor = next[bldId].floors[floorIdx];
      if (!floor.roomMeta[roomNumber]) {
        floor.roomMeta[roomNumber] = { type: '', category: '', capacity: 1, amenities: [] };
      }
      
      if (metaKey === 'amenities' && typeof value === 'string') {
        const amens = value.split(',').map((s: string) => s.trim().toUpperCase()).filter(Boolean);
        floor.roomMeta[roomNumber].amenities = amens;
      } else {
        floor.roomMeta[roomNumber][metaKey] = metaKey === 'capacity' ? parseInt(value) || 1 : value;
      }
      return next;
    });
    setSaveStatus('idle');
  };

  const handleAddAmenityToFloor = (bldId: string, floorIdx: number, amen: string) => {
    if (!amen.trim()) return;
    setEditedBuildings(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const floor = next[bldId].floors[floorIdx];
      const name = amen.trim().toUpperCase();
      floor.rooms.forEach((r: string) => {
        if (!floor.roomMeta[r]) floor.roomMeta[r] = { type: '', category: '', capacity: 1, amenities: [] };
        if (!floor.roomMeta[r].amenities.includes(name)) {
          floor.roomMeta[r].amenities.push(name);
        }
      });
      return next;
    });
    setSaveStatus('idle');
  };

  const handleRemoveAmenityFromFloor = (bldId: string, floorIdx: number, amen: string) => {
    setEditedBuildings(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const floor = next[bldId].floors[floorIdx];
      floor.rooms.forEach((r: string) => {
        if (floor.roomMeta[r]) {
          floor.roomMeta[r].amenities = floor.roomMeta[r].amenities.filter((a: string) => a !== amen);
        }
      });
      return next;
    });
    setSaveStatus('idle');
  };

  const handleFloorMetaChange = (bldId: string, floorIdx: number, metaKey: keyof RoomMeta, value: any) => {
    setEditedBuildings(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const floor = next[bldId].floors[floorIdx];
      
      // Update all rooms on this floor to new default meta
      floor.rooms.forEach((r: string) => {
        if (!floor.roomMeta[r]) floor.roomMeta[r] = { type: '', category: '', capacity: 1, amenities: [] };
        floor.roomMeta[r][metaKey] = metaKey === 'capacity' ? parseInt(value) || 1 : value;
      });
      
      return next;
    });
    setSaveStatus('idle');
  };

  const handleRoomsChange = (bldId: string, floorIdx: number, roomsStr: string) => {
    const roomList = roomsStr.split(',').map(r => r.trim()).filter(Boolean);
    setEditedBuildings(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const floor = next[bldId].floors[floorIdx];
      
      const sampleMeta = Object.values(floor.roomMeta)[0] as RoomMeta || {
        type: 'STANDARD ROOM',
        category: '4 SHARING',
        capacity: 4,
        amenities: []
      };
      
      const newMeta: Record<string, RoomMeta> = {};
      roomList.forEach(r => {
        newMeta[r] = floor.roomMeta[r] || { ...sampleMeta };
      });

      floor.rooms = roomList;
      floor.roomMeta = newMeta;
      return next;
    });
    setSaveStatus('idle');
  };

  const addFloor = (bldId: string) => {
    setEditedBuildings(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const bld = next[bldId];
      const maxFloor = bld.floors.length ? Math.max(...bld.floors.map((f: any) => f.floor)) : 0;
      bld.floors.push({ floor: maxFloor + 1, rooms: [], roomMeta: {} });
      return next;
    });
    setSaveStatus('idle');
  };

  const removeFloor = (bldId: string, floorIdx: number) => {
    setEditedBuildings(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next[bldId].floors.splice(floorIdx, 1);
      return next;
    });
    setSaveStatus('idle');
  };

  const addBuilding = () => {
    const id = `BLD_${Date.now()}`;
    setEditedBuildings(prev => ({
      ...prev,
      [id]: {
        id,
        name: 'New Building',
        abbr: 'NEW · Hostel',
        icon: '🏢',
        colorClass: 'vs',
        genderTag: '👤 Mixed',
        nameClass: '',
        numClass: '',
        barClass: '',
        floors: []
      }
    }));
    setOpenBldIdx(id);
    setSaveStatus('idle');
  };

  const removeBuilding = (id: string) => {
    if (confirm(`Are you sure you want to remove ${editedBuildings[id].name}?`)) {
      setEditedBuildings(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setSaveStatus('idle');
    }
  };

  const saveAll = async () => {
    try {
      setIsSaving(true);
      setSaveStatus('saving');
      await onUpdateBuildings(editedBuildings);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error("Save failed:", error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="px-6 md:px-10 pb-20">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl text-[#084f4f] mb-1">⚙️ Settings</h2>
          <p className="text-[#5a6472]">Manage building structures, floors, and room configurations.</p>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === 'success' && (
            <span className="text-xs font-bold text-green-600 animate-pulse">Changes Saved!</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-xs font-bold text-red-600">Failed to Save</span>
          )}
          <button 
            onClick={() => {
              setEditedBuildings(JSON.parse(JSON.stringify(buildings)));
              setSaveStatus('idle');
            }}
            disabled={isSaving}
            className="px-4 py-2.5 bg-white border border-[#f0e8d8] rounded-xl text-sm font-bold text-[#5a6472] flex items-center gap-2 hover:bg-black/5 disabled:opacity-50"
          >
            <RotateCcw size={16} /> Reset
          </button>
          <button 
            onClick={saveAll}
            disabled={isSaving}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg transition-all",
              saveStatus === 'saving' ? "bg-[#5a6472] text-white" : "bg-[#0d6e6e] text-white shadow-[#0d6e6e]/20",
              isSaving && "opacity-80 cursor-wait"
            )}
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : <Save size={16} />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      
      {/* User Management Section */}
      <div className="bg-white rounded-3xl border border-[#f0e8d8] shadow-xl overflow-hidden p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-[#0d6e6e] uppercase tracking-widest flex items-center gap-2">
            <Users size={18} /> User Management
          </h3>
          <span className="text-[10px] text-[#5a6472] uppercase font-bold tracking-widest bg-[#fdf8f0] px-3 py-1 rounded-full border border-[#f0e8d8]">
            {users.length} Active Users
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map(u => (
            <div key={u.uid} className="bg-[#fdf8f0]/30 border border-[#f0e8d8] rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0d6e6e]/10 rounded-xl flex items-center justify-center text-[#0d6e6e]">
                  <Users size={20} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-[#1a1a2e] truncate">{u.email}</p>
                  <p className="text-[10px] text-[#5a6472] uppercase font-semibold">
                    {u.isAdmin ? 'Administrator' : 'Staff / Staff User'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  onUpdateUser({ ...u, isAdmin: !u.isAdmin });
                }}
                disabled={u.email.toLowerCase() === 'vkatakam@gitam.edu'}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  u.isAdmin 
                    ? "bg-[#d94f3d]/10 text-[#d94f3d] hover:bg-[#d94f3d] hover:text-white"
                    : "bg-[#0d6e6e]/10 text-[#0d6e6e] hover:bg-[#0d6e6e] hover:text-white",
                  u.email.toLowerCase() === 'vkatakam@gitam.edu' && "opacity-50 cursor-not-allowed"
                )}
                title={u.isAdmin ? "Remove Admin Access" : "Grant Admin Access"}
              >
                {u.isAdmin ? <ShieldOff size={18} /> : <Shield size={18} />}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#f0e8d8] shadow-xl overflow-hidden p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-[#0d6e6e] uppercase tracking-widest flex items-center gap-2">
            <Building2 size={18} /> Buildings & Rooms
          </h3>
          <button 
            onClick={addBuilding}
            className="px-4 py-2 bg-[#e0f4f4] text-[#0d6e6e] rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#0d6e6e] hover:text-white transition-all"
          >
            <Plus size={14} /> Add Building
          </button>
        </div>

        <div className="space-y-4">
          {Object.values(editedBuildings).map(b => (
            <div key={b.id} className="border border-[#f0e8d8] rounded-2xl overflow-hidden">
              <button 
                onClick={() => setOpenBldIdx(openBldId === b.id ? null : b.id)}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[#fdf8f0]/50 transition-colors"
              >
                <span className="text-2xl">{b.icon}</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-[#1a1a2e]">{b.name}</p>
                  <p className="text-[10px] text-[#5a6472] uppercase font-semibold">{b.abbr} · {b.floors.length} Floors</p>
                </div>
                <ChevronDown className={cn("text-gray-400 transition-transform", openBldId === b.id && "rotate-180")} size={20} />
              </button>

              {openBldId === b.id && (
                <div className="p-6 bg-[#fdf8f0]/40 border-t border-[#f0e8d8] space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <EditField label="Name" value={b.name} onChange={v => handleBldFieldChange(b.id, 'name', v)} />
                    <EditField label="Abbreviation" value={b.abbr} onChange={v => handleBldFieldChange(b.id, 'abbr', v)} />
                    <EditField label="Icon (Emoji)" value={b.icon} onChange={v => handleBldFieldChange(b.id, 'icon', v)} />
                    <EditField label="Gender/Type Tag" value={b.genderTag} onChange={v => handleBldFieldChange(b.id, 'genderTag', v)} />
                    <div>
                      <label className="block text-[10px] font-bold text-[#5a6472] uppercase mb-1.5 ml-1">Color Theme</label>
                      <select 
                        className="w-full bg-white border border-[#f0e8d8] rounded-xl px-4 py-2 text-sm outline-none"
                        value={b.colorClass || 'vs'}
                        onChange={e => handleBldFieldChange(b.id, 'colorClass', e.target.value)}
                      >
                        <option value="vs">Teal (VS)</option>
                        <option value="sq">Gold (SQ)</option>
                        <option value="nbh">Indigo (NBH)</option>
                        <option value="sbh">Rose (SBH)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-bold text-[#5a6472] uppercase tracking-[2px]">Floor Configuration</h4>
                      <button 
                        onClick={() => addFloor(b.id)}
                        className="text-[10px] font-bold text-[#0d6e6e] hover:underline"
                      >
                        ＋ ADD FLOOR
                      </button>
                    </div>

                    {b.floors.map((fl, fIdx) => {
                      const firstRoom = fl.rooms[0];
                      const meta = fl.roomMeta[firstRoom] || { type: '', category: '', capacity: 1, amenities: [] };

                      return (
                        <div key={fIdx} className="bg-white border border-[#f0e8d8] rounded-2xl p-5 shadow-sm relative group">
                          <button 
                            onClick={() => removeFloor(b.id, fIdx)}
                            className="absolute top-4 right-4 p-2 text-gray-300 hover:text-[#d94f3d] transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div className="md:col-span-1">
                              <label className="block text-[10px] font-bold text-[#5a6472] uppercase mb-1.5">Floor No.</label>
                              <input 
                                type="number"
                                className="w-full bg-[#fdf8f0] border border-[#f0e8d8] rounded-xl px-4 py-2 text-sm outline-none"
                                value={fl.floor || 0}
                                onChange={e => {
                                  const next = JSON.parse(JSON.stringify(editedBuildings));
                                  next[b.id].floors[fIdx].floor = parseInt(e.target.value) || 0;
                                  setEditedBuildings(next);
                                }}
                              />
                            </div>
                            <div className="md:col-span-3">
                              <label className="block text-[10px] font-bold text-[#5a6472] uppercase mb-1.5 ml-1">Rooms (comma separated)</label>
                              <textarea
                                className="w-full bg-[#fdf8f0] border border-[#f0e8d8] rounded-xl px-4 py-2 text-sm outline-none resize-none"
                                rows={2}
                                value={(fl.rooms || []).join(', ')}
                                onChange={e => handleRoomsChange(b.id, fIdx, e.target.value)}
                                placeholder="101, 102, 103..."
                              />
                            </div>
                          </div>

                          <div className="pt-4 border-t border-dashed border-[#f0e8d8] space-y-4">
                            <div className="flex items-center justify-between">
                              <h5 className="text-[9px] font-bold text-[#5a6472] uppercase tracking-wider">Floor Defaults (Bulk Edit)</h5>
                              <button 
                                onClick={() => {
                                  const key = `${b.id}-${fIdx}`;
                                  setIndividualEditFloor(individualEditFloor === key ? null : key);
                                }}
                                className={cn(
                                  "text-[10px] font-bold px-3 py-1 rounded-lg transition-all border",
                                  individualEditFloor === `${b.id}-${fIdx}`
                                    ? "bg-[#0d6e6e] text-white border-transparent"
                                    : "bg-white text-[#0d6e6e] border-[#0d6e6e]/20 hover:bg-[#e0f4f4]"
                                )}
                              >
                                {individualEditFloor === `${b.id}-${fIdx}` ? "Close Individual Settings" : "Manage Individual Rooms"}
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[9px] font-bold text-[#5a6472] uppercase mb-1 ml-1">Default Room Type</label>
                                <input 
                                  className="w-full bg-white border border-[#f0e8d8] rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#0d6e6e]/20"
                                  value={meta.type || ''}
                                  onChange={e => handleFloorMetaChange(b.id, fIdx, 'type', e.target.value)}
                                  placeholder="e.g. Standard"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-[#5a6472] uppercase mb-1 ml-1">Room Category</label>
                                <input 
                                  className="w-full bg-white border border-[#f0e8d8] rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#0d6e6e]/20"
                                  value={meta.category || ''}
                                  onChange={e => handleFloorMetaChange(b.id, fIdx, 'category', e.target.value)}
                                  placeholder="e.g. 4 Sharing"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-[#5a6472] uppercase mb-1 ml-1">Capacity</label>
                                <input 
                                  type="number"
                                  min="1"
                                  className="w-full bg-white border border-[#f0e8d8] rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#0d6e6e]/20"
                                  value={meta.capacity || 1}
                                  onChange={e => handleFloorMetaChange(b.id, fIdx, 'capacity', e.target.value)}
                                  placeholder="e.g. 4"
                                />
                              </div>
                            </div>

                            <div className="bg-[#f0f4f4]/30 rounded-xl p-3 border border-[#0d6e6e]/10">
                              <label className="block text-[9px] font-bold text-[#0d6e6e] uppercase mb-2 ml-1">Manage Floor Amenities</label>
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {(meta.amenities || []).map(amen => (
                                  <div key={amen} className="flex items-center gap-1 bg-[#0d6e6e]/10 text-[#0d6e6e] px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">
                                    {amen}
                                    <button onClick={() => handleRemoveAmenityFromFloor(b.id, fIdx, amen)} className="hover:text-[#d94f3d]">
                                      <X size={10} />
                                    </button>
                                  </div>
                                ))}
                                {(!meta.amenities || meta.amenities.length === 0) && (
                                  <span className="text-[10px] text-[#5a6472] italic">No custom amenities defined for this floor.</span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <input 
                                  className="flex-1 bg-white border border-[#f0e8d8] rounded-lg px-2 py-1 text-[10px] outline-none"
                                  placeholder="New Amenity Name..."
                                  value={newAmenInput}
                                  onChange={e => setNewAmenInput(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      handleAddAmenityToFloor(b.id, fIdx, newAmenInput);
                                      setNewAmenInput('');
                                    }
                                  }}
                                />
                                <button 
                                  onClick={() => {
                                    handleAddAmenityToFloor(b.id, fIdx, newAmenInput);
                                    setNewAmenInput('');
                                  }}
                                  className="bg-[#0d6e6e] text-white px-3 py-1 rounded-lg text-[10px] font-bold"
                                >
                                  Add
                                </button>
                              </div>
                            </div>

                            {individualEditFloor === `${b.id}-${fIdx}` && (
                              <div className="bg-[#fdf8f0]/50 rounded-xl border border-[#f0e8d8] p-4 mt-4 animate-in slide-in-from-top-2 duration-200">
                                <h6 className="text-[10px] font-bold text-[#5a6472] uppercase mb-4 border-b border-[#f0e8d8] pb-2">Room Level Overrides</h6>
                                <div className="max-h-60 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                                  {fl.rooms.map(rno => {
                                    const rMeta = fl.roomMeta[rno] || { type: '', category: '', capacity: 1, amenities: [] };
                                    return (
                                      <div key={rno} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white p-3 rounded-lg border border-[#f0e8d8] shadow-xs">
                                        <div className="w-12 h-6 bg-[#0d6e6e] rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                          {rno}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 flex-1 w-full">
                                          <input 
                                            className="bg-[#f9fafb] border border-gray-200 rounded px-2 py-1 text-[11px] outline-none focus:border-[#0d6e6e]"
                                            value={rMeta.category || ''}
                                            onChange={e => handleRoomMetaChange(b.id, fIdx, rno, 'category', e.target.value)}
                                            placeholder="Category"
                                          />
                                          <input 
                                            className="bg-[#f9fafb] border border-gray-200 rounded px-2 py-1 text-[11px] outline-none focus:border-[#0d6e6e]"
                                            value={rMeta.type || ''}
                                            onChange={e => handleRoomMetaChange(b.id, fIdx, rno, 'type', e.target.value)}
                                            placeholder="Type"
                                          />
                                          <input 
                                            type="number"
                                            className="bg-[#f9fafb] border border-gray-200 rounded px-2 py-1 text-[11px] outline-none focus:border-[#0d6e6e]"
                                            value={rMeta.capacity || 1}
                                            onChange={e => handleRoomMetaChange(b.id, fIdx, rno, 'capacity', e.target.value)}
                                            placeholder="Cap"
                                          />
                                          <input 
                                            className="bg-[#f9fafb] border border-gray-200 rounded px-2 py-1 text-[11px] outline-none focus:border-[#0d6e6e]"
                                            value={(rMeta.amenities || []).join(', ')}
                                            onChange={e => handleRoomMetaChange(b.id, fIdx, rno, 'amenities', e.target.value)}
                                            placeholder="Amenities (A, B...)"
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end pt-4 border-t border-[#f0e8d8]">
                    <button 
                      onClick={() => removeBuilding(b.id)}
                      className="px-4 py-2 text-[#d94f3d] text-xs font-bold flex items-center gap-2 hover:bg-[#fdecea] rounded-xl transition-all"
                    >
                      <Trash2 size={14} /> Delete Building
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EditField({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-[#5a6472] uppercase mb-1.5 ml-1">{label}</label>
      <input 
        className="w-full bg-white border border-[#f0e8d8] rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0d6e6e]/10 transition-all"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
