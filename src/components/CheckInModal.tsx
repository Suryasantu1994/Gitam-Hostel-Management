/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { Building, CheckInRecord, HistoricalRecord } from '../types';
import SignatureCanvas from 'react-signature-canvas';
import { X, Check, Trash2, Pencil } from 'lucide-react';
import { cn } from '../lib/utils';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  building: Building;
  roomNumber: string;
  existingRecord?: CheckInRecord;
  onSave: (record: CheckInRecord) => void;
  onAddHistory: (record: HistoricalRecord) => void;
}

export default function CheckInModal({ isOpen, onClose, building, roomNumber, existingRecord, onSave, onAddHistory }: CheckInModalProps) {
  const floor = building.floors.find(f => f.rooms.includes(roomNumber));
  const meta = floor?.roomMeta[roomNumber] || { type: '', category: '', capacity: 1, amenities: [] };
  const cap = meta.capacity || 1;

  const [activeBedIdx, setActiveBedIdx] = useState(0);
  const [students, setStudents] = useState<string[]>(() => {
    const arr = existingRecord?.students || Array(cap).fill('');
    const result = [...arr];
    while (result.length < cap) result.push('');
    return result.slice(0, cap);
  });
  const [studentIds, setStudentIds] = useState<string[]>(() => {
    const arr = existingRecord?.studentIds || Array(cap).fill('');
    const result = [...arr];
    while (result.length < cap) result.push('');
    return result.slice(0, cap);
  });
  const [courses, setCourses] = useState<string[]>(() => {
    const arr = existingRecord?.courses || Array(cap).fill('');
    const result = [...arr];
    while (result.length < cap) result.push('');
    return result.slice(0, cap);
  });
  const [years, setYears] = useState<string[]>(() => {
    const arr = existingRecord?.years || Array(cap).fill('');
    const result = [...arr];
    while (result.length < cap) result.push('');
    return result.slice(0, cap);
  });
  const [contacts, setContacts] = useState<string[]>(() => {
    const arr = existingRecord?.contacts || Array(cap).fill('');
    const result = [...arr];
    while (result.length < cap) result.push('');
    return result.slice(0, cap);
  });
  const [parentCtcs, setParentCtcs] = useState<string[]>(() => {
    const arr = existingRecord?.parentCtcs || Array(cap).fill('');
    const result = [...arr];
    while (result.length < cap) result.push('');
    return result.slice(0, cap);
  });
  const [signatures, setSignatures] = useState<string[]>(() => {
    const arr = existingRecord?.signatures || Array(cap).fill('');
    const result = [...arr];
    while (result.length < cap) result.push('');
    return result.slice(0, cap);
  });
  const [designations, setDesignations] = useState<string[]>(() => {
    const arr = existingRecord?.designations || Array(cap).fill('');
    const result = [...arr];
    while (result.length < cap) result.push('');
    return result.slice(0, cap);
  });
  const [checkinDates, setCheckinDates] = useState<string[]>(() => {
    if (existingRecord?.checkinDates) {
      const arr = [...existingRecord.checkinDates];
      while (arr.length < cap) arr.push('');
      return arr.slice(0, cap);
    }
    const defaultDate = existingRecord?.checkinDate || new Date().toISOString().split('T')[0];
    return Array(cap).fill(defaultDate);
  });
  const [checkoutDates, setCheckoutDates] = useState<string[]>(() => {
    if (existingRecord?.checkoutDates) {
      const arr = [...existingRecord.checkoutDates];
      while (arr.length < cap) arr.push('');
      return arr.slice(0, cap);
    }
    const defaultDate = existingRecord?.checkoutDate || '';
    return Array(cap).fill(defaultDate);
  });
  const [isReservedList, setIsReservedList] = useState<boolean[]>(() => {
    if (existingRecord?.isReservedList) {
      const arr = [...existingRecord.isReservedList];
      while (arr.length < cap) arr.push(false);
      return arr.slice(0, cap);
    }
    const defaultValue = existingRecord?.isReserved || false;
    return Array(cap).fill(defaultValue);
  });
  
  const [amenities, setAmenities] = useState<Record<string, boolean>>(existingRecord?.amenities || {});
  const [remarks, setRemarks] = useState(existingRecord?.remarks || '');

  const sigPad = useRef<SignatureCanvas>(null);

  const handleSave = () => {
    onSave({
      students, studentIds, courses, years, contacts, parentCtcs, signatures, designations,
      amenities, checkinDates, checkoutDates, remarks, isReservedList,
      updatedAt: new Date().toISOString()
    });
  };

  const saveSignature = () => {
    if (sigPad.current) {
      const data = sigPad.current.toDataURL();
      const newSigs = [...signatures];
      newSigs[activeBedIdx] = data;
      setSignatures(newSigs);
    }
  };

  const clearSignature = () => {
    if (sigPad.current) sigPad.current.clear();
    const newSigs = [...signatures];
    newSigs[activeBedIdx] = '';
    setSignatures(newSigs);
  };

  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);

  const handleBedCheckout = () => {
    const today = new Date().toISOString().split('T')[0];

    // Add to history if there was a student
    if (students[activeBedIdx]) {
      onAddHistory({
        id: Math.random().toString(36).substr(2, 9),
        buildingId: building.id,
        buildingName: building.name,
        roomNumber: roomNumber,
        studentName: students[activeBedIdx],
        studentId: studentIds[activeBedIdx],
        course: courses[activeBedIdx],
        year: years[activeBedIdx],
        designation: designations[activeBedIdx],
        contact: contacts[activeBedIdx],
        parentContact: parentCtcs[activeBedIdx],
        checkinDate: checkinDates[activeBedIdx],
        checkoutDate: today,
        signature: signatures[activeBedIdx] || undefined,
        remarks: remarks
      });
    }

    const newStudents = [...students];
    const newIds = [...studentIds];
    const newCourses = [...courses];
    const newYears = [...years];
    const newContacts = [...contacts];
    const newParentCtcs = [...parentCtcs];
    const newSigs = [...signatures];
    const newDesigs = [...designations];
    const newCDates = [...checkinDates];
    const newExDates = [...checkoutDates];
    const newRes = [...isReservedList];
    
    newStudents[activeBedIdx] = '';
    newIds[activeBedIdx] = '';
    newCourses[activeBedIdx] = '';
    newYears[activeBedIdx] = '';
    newContacts[activeBedIdx] = '';
    newParentCtcs[activeBedIdx] = '';
    newSigs[activeBedIdx] = '';
    newDesigs[activeBedIdx] = '';
    newCDates[activeBedIdx] = '';
    newExDates[activeBedIdx] = today; // Mark current checkout date
    newRes[activeBedIdx] = false;
    
    setStudents(newStudents);
    setStudentIds(newIds);
    setCourses(newCourses);
    setYears(newYears);
    setContacts(newContacts);
    setParentCtcs(newParentCtcs);
    setSignatures(newSigs);
    setDesignations(newDesigs);
    setCheckinDates(newCDates);
    setCheckoutDates(newExDates);
    setIsReservedList(newRes);

    // Auto-save the checkout action to ensure persistence
    onSave({
      students: newStudents, 
      studentIds: newIds, 
      courses: newCourses, 
      years: newYears, 
      contacts: newContacts, 
      parentCtcs: newParentCtcs, 
      signatures: newSigs,
      designations: newDesigs,
      amenities, 
      checkinDates: newCDates, 
      checkoutDates: newExDates, 
      remarks, 
      isReservedList: newRes,
      updatedAt: new Date().toISOString()
    });
    onClose();
  };

  const isGuestHouse = building.name.toLowerCase().includes('guest house');
  const roomAmens = meta.amenities?.length ? meta.amenities : ['BED', 'BED SHEET', 'PILLOW', 'DOOR MAT', 'WRITING TABLE', 'CHAIR', 'DUSTBIN', 'MIRROR', 'CURTAIN', 'ALMIRAH'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-top-12 duration-300 ease-out">
        {/* Header */}
        <div className="bg-linear-to-br from-[#084f4f] to-[#14a0a0] p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 border border-white/30 rounded-lg px-3 py-1 text-[10px] font-bold text-[#f0b84a] uppercase tracking-widest">
              Room Detail
            </div>
            <h3 className="text-white font-serif text-lg">Room {roomNumber} · {building.name}</h3>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white/70 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex flex-col gap-8" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {/* Room Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <InfoField label="Room No." value={roomNumber} />
            <InfoField label="Building" value={building.name} />
            <InfoField label="Type" value={meta.type} />
            <InfoField label="Category" value={meta.category} />
          </div>

          {/* Bed Tabs */}
          <div>
            <div className="flex gap-2 border-b-2 border-[#f0e8d8] mb-6 overflow-x-auto no-scrollbar">
              {Array.from({ length: cap }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveBedIdx(i);
                    setShowCheckoutConfirm(false);
                  }}
                  className={cn(
                    "px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 -mb-0.5 whitespace-nowrap",
                    activeBedIdx === i 
                      ? "border-[#0d6e6e] text-[#0d6e6e]" 
                      : "border-transparent text-[#5a6472] hover:text-[#0d6e6e]"
                  )}
                >
                  Bed {i + 1} {students[i] && <span className="ml-1 text-[#1a8f7d]">●</span>}
                </button>
              ))}
            </div>

            <div className="bg-[#fdf8f0]/50 p-6 rounded-2xl border border-[#f0e8d8]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-bold text-[#5a6472] uppercase tracking-[2px]">Bed Details</h4>
                {(students[activeBedIdx] || isReservedList[activeBedIdx]) && (
                  <div className="relative">
                    {showCheckoutConfirm ? (
                      <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-200">
                        <span className="text-[10px] font-bold text-[#d94f3d] uppercase">Confirm?</span>
                        <button 
                          onClick={handleBedCheckout}
                          className="px-3 py-1.5 bg-[#d94f3d] text-white rounded-lg text-[10px] font-bold uppercase hover:bg-[#b04030] transition-all shadow-sm"
                        >
                          Yes
                        </button>
                        <button 
                          onClick={() => setShowCheckoutConfirm(false)}
                          className="px-3 py-1.5 bg-[#5a6472] text-white rounded-lg text-[10px] font-bold uppercase"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setShowCheckoutConfirm(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fdecea] text-[#d94f3d] rounded-lg text-[10px] font-bold uppercase hover:bg-[#d94f3d] hover:text-white transition-all shadow-sm"
                      >
                        <Trash2 size={12} /> Check Out Bed
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#5a6472] uppercase mb-1.5 ml-1">
                    {isGuestHouse ? 'Guest Name*' : 'Student Name*'}
                  </label>
                  <input 
                    className="w-full bg-white border border-[#f0e8d8] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0d6e6e]/20 outline-none"
                    value={students[activeBedIdx] || ''}
                    onChange={e => {
                      const newStudents = [...students];
                      newStudents[activeBedIdx] = e.target.value;
                      setStudents(newStudents);
                    }}
                    placeholder="Full name"
                  />
                </div>
                {!isGuestHouse ? (
                  <div>
                    <label className="block text-[10px] font-bold text-[#5a6472] uppercase mb-1.5 ml-1">Roll / Reg. No.</label>
                    <input 
                      className="w-full bg-white border border-[#f0e8d8] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0d6e6e]/20 outline-none"
                      value={studentIds[activeBedIdx] || ''}
                      onChange={e => {
                        const newIds = [...studentIds];
                        newIds[activeBedIdx] = e.target.value;
                        setStudentIds(newIds);
                      }}
                      placeholder="e.g. 21BCE1234"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold text-[#5a6472] uppercase mb-1.5 ml-1">Designation</label>
                    <input 
                      className="w-full bg-white border border-[#f0e8d8] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0d6e6e]/20 outline-none"
                      value={designations[activeBedIdx] || ''}
                      onChange={e => {
                        const newDesigs = [...designations];
                        newDesigs[activeBedIdx] = e.target.value;
                        setDesignations(newDesigs);
                      }}
                      placeholder="e.g. Professor, Manager"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#5a6472] uppercase mb-1.5 ml-1">
                    {isGuestHouse ? 'Department' : 'Course / Branch'}
                  </label>
                  <input 
                    className="w-full bg-white border border-[#f0e8d8] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0d6e6e]/20 outline-none"
                    value={courses[activeBedIdx] || ''}
                    onChange={e => {
                      const newCourses = [...courses];
                      newCourses[activeBedIdx] = e.target.value;
                      setCourses(newCourses);
                    }}
                    placeholder={isGuestHouse ? "e.g. Computer Science" : "e.g. B.Tech CSE"}
                  />
                </div>
                {!isGuestHouse && (
                  <div>
                    <label className="block text-[10px] font-bold text-[#5a6472] uppercase mb-1.5 ml-1">Year</label>
                    <select 
                      className="w-full bg-white border border-[#f0e8d8] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0d6e6e]/20 outline-none"
                      value={years[activeBedIdx] || ''}
                      onChange={e => {
                        const newYears = [...years];
                        newYears[activeBedIdx] = e.target.value;
                        setYears(newYears);
                      }}
                    >
                      <option value="">Select year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                      <option value="PG">PG</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-[10px] font-bold text-[#5a6472] uppercase mb-1.5 ml-1">Contact No.</label>
                  <input 
                    className="w-full bg-white border border-[#f0e8d8] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0d6e6e]/20 outline-none"
                    value={contacts[activeBedIdx] || ''}
                    onChange={e => {
                      const newContacts = [...contacts];
                      newContacts[activeBedIdx] = e.target.value;
                      setContacts(newContacts);
                    }}
                    placeholder="Mobile"
                  />
                </div>
                {!isGuestHouse && (
                  <div>
                    <label className="block text-[10px] font-bold text-[#5a6472] uppercase mb-1.5 ml-1">Parent Contact</label>
                    <input 
                      className="w-full bg-white border border-[#f0e8d8] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0d6e6e]/20 outline-none"
                      value={parentCtcs[activeBedIdx] || ''}
                      onChange={e => {
                        const newParentCtcs = [...parentCtcs];
                        newParentCtcs[activeBedIdx] = e.target.value;
                        setParentCtcs(newParentCtcs);
                      }}
                      placeholder="Parent mobile"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#5a6472] uppercase mb-1.5 ml-1">Check-In Date*</label>
                  <input 
                    type="date"
                    className="w-full bg-white border border-[#f0e8d8] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0d6e6e]/20 outline-none"
                    value={checkinDates[activeBedIdx] || ''}
                    onChange={e => {
                      const next = [...checkinDates];
                      next[activeBedIdx] = e.target.value;
                      setCheckinDates(next);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#5a6472] uppercase mb-1.5 ml-1">Expected Checkout</label>
                  <input 
                    type="date"
                    className="w-full bg-white border border-[#f0e8d8] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0d6e6e]/20 outline-none"
                    value={checkoutDates[activeBedIdx] || ''}
                    onChange={e => {
                      const next = [...checkoutDates];
                      next[activeBedIdx] = e.target.value;
                      setCheckoutDates(next);
                    }}
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={cn(
                    "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                    isReservedList[activeBedIdx] ? "bg-[#c9922a] border-transparent shadow-sm" : "bg-white border-[#f0e8d8] group-hover:border-[#c9922a]"
                  )}>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={!!isReservedList[activeBedIdx]} 
                      onChange={e => {
                        const next = [...isReservedList];
                        next[activeBedIdx] = e.target.checked;
                        setIsReservedList(next);
                      }} 
                    />
                    {isReservedList[activeBedIdx] && <Check size={14} className="text-white" />}
                  </div>
                  <span className="text-sm text-[#5a6472] font-medium select-none">Mark Bed as Reserved only</span>
                </label>
              </div>

              {/* Digital Signature */}
              <div className="col-span-full">
                <label className="block text-[10px] font-bold text-[#5a6472] uppercase mb-1.5 ml-1">
                  {isGuestHouse ? 'Guest Digital Signature' : 'Student Digital Signature'}
                </label>
                {signatures[activeBedIdx] ? (
                  <div className="relative group bg-white border border-[#f0e8d8] rounded-2xl p-4 flex items-center justify-center">
                    <img src={signatures[activeBedIdx]} alt="Signature" className="max-h-24" />
                    <button 
                      onClick={clearSignature}
                      className="absolute top-2 right-2 p-2 bg-[#fdecea] text-[#d94f3d] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="bg-white border-2 border-dashed border-[#f0e8d8] rounded-2xl overflow-hidden">
                    <SignatureCanvas 
                      ref={sigPad}
                      onEnd={saveSignature}
                      penColor="#1a1a2e"
                      canvasProps={{ className: "w-full h-32 cursor-crosshair" }}
                    />
                    <div className="bg-[#f0e8d8]/30 px-4 py-2 flex items-center justify-between text-[10px] font-bold text-[#5a6472]">
                      <span className="flex items-center gap-1.5"><Pencil size={10} /> SIGN HERE</span>
                      <button onClick={clearSignature} className="hover:text-[#d94f3d]">CLEAR</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Overall Remarks */}
          <div>
            <h4 className="text-[10px] font-bold text-[#5a6472] uppercase tracking-[2px] mb-4 flex items-center gap-2">
              Room Remarks
              <div className="flex-1 h-px bg-[#f0e8d8]" />
            </h4>
            <div className="mb-4">
              <label className="block text-[10px] font-bold text-[#5a6472] uppercase mb-1.5 ml-1">General Remarks</label>
              <textarea 
                className="w-full bg-white border border-[#f0e8d8] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0d6e6e]/20 outline-none min-h-20"
                value={remarks || ''}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Any special requests or observations for the room..."
              />
            </div>
          </div>

          {/* Amenities */}
          <div>
            <h4 className="text-[10px] font-bold text-[#5a6472] uppercase tracking-[2px] mb-4 flex items-center gap-2">
              Room Amenities Check
              <div className="flex-1 h-px bg-[#f0e8d8]" />
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {roomAmens.map(amen => (
                <button
                  key={amen}
                  onClick={() => setAmenities(prev => ({ ...prev, [amen]: !prev[amen] }))}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 w-full rounded-xl text-xs font-medium border-1.5 transition-all text-center justify-center",
                    amenities[amen] !== false
                      ? "bg-[#0d6e6e] border-[#0d6e6e] text-white shadow-sm"
                      : "bg-white border-[#f0e8d8] text-[#5a6472]"
                  )}
                >
                  {amen}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-[#fdf8f0] border-t border-[#f0e8d8] flex justify-end gap-3 rounded-b-3xl">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-[#5a6472] hover:bg-black/5 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-8 py-2.5 bg-linear-to-r from-[#084f4f] to-[#0d6e6e] rounded-xl text-sm font-bold text-white shadow-lg shadow-[#0d6e6e]/20"
          >
            Confirm Check-In
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-[#fdf8f0] p-3 rounded-xl border border-[#f0e8d8]">
      <p className="text-[9px] font-bold text-[#5a6472] uppercase mb-0.5 tracking-wider">{label}</p>
      <p className="text-xs font-bold text-[#1a1a2e] truncate">{value}</p>
    </div>
  );
}
