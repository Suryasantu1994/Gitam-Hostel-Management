/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Building, CheckInData, CheckInRecord, HistoricalRecord } from '../types';
import { Search, Download, Trash2, Signature, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface RecordsViewProps {
  buildings: Record<string, Building>;
  checkInData: CheckInData;
  onUpdateCheckIn: (bldId: string, rno: string, record: CheckInRecord) => void;
  onAddHistory: (record: HistoricalRecord) => void;
}

export default function RecordsView({ buildings, checkInData, onUpdateCheckIn, onAddHistory }: RecordsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [buildingFilter, setBuildingFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'checked-in' | 'not-assigned' | 'reserved'>('all');
  const [showSignatureUrl, setShowSignatureUrl] = useState<{name: string, url: string} | null>(null);

  const handleCheckout = (r: any) => {
    const key = `${r.bid}_${r.rno}`;
    const currentRecord = checkInData[key];
    
    if (!currentRecord) return;

    if (confirm(`Are you sure you want to check out ${r.name} from Room ${r.rno} (Bed ${r.bedIdx + 1})?`)) {
      const today = new Date().toISOString().split('T')[0];
      const building = buildings[r.bid];
      if (!building) return;

      const floor = building.floors.find(f => f.floor === r.floor);
      const capacity = floor?.roomMeta[r.rno]?.capacity || 1;
      
        // Add to history if it was an actual student
      if (r.name && r.name !== 'Vacant Bed') {
        const isGuest = r.building.toLowerCase().includes('guest house');
        onAddHistory({
          id: Math.random().toString(36).substr(2, 9),
          buildingId: r.bid,
          buildingName: r.building,
          roomNumber: r.rno,
          studentName: r.name,
          studentId: r.studentId,
          course: r.course,
          year: r.year,
          designation: r.designation,
          contact: r.contact,
          parentContact: r.parentContact,
          checkinDate: r.checkinDate,
          checkoutDate: today,
          signature: r.signature || undefined,
          roomType: r.roomType,
          remarks: currentRecord.remarks
        });
      }

      const newRecord = { ...currentRecord };
      
      const normalizeArray = (arr: any[] | undefined, cap: number, defaultVal: any = '') => {
        const base = Array.isArray(arr) ? [...arr] : [];
        while (base.length < cap) base.push(defaultVal);
        return base.slice(0, cap);
      };

      newRecord.students = normalizeArray(newRecord.students, capacity);
      newRecord.studentIds = normalizeArray(newRecord.studentIds, capacity);
      newRecord.courses = normalizeArray(newRecord.courses, capacity);
      newRecord.years = normalizeArray(newRecord.years, capacity);
      newRecord.contacts = normalizeArray(newRecord.contacts, capacity);
      newRecord.parentCtcs = normalizeArray(newRecord.parentCtcs, capacity);
      newRecord.signatures = normalizeArray(newRecord.signatures, capacity);
      newRecord.designations = normalizeArray(newRecord.designations || [], capacity);
      newRecord.checkinDates = normalizeArray(newRecord.checkinDates, capacity);
      newRecord.checkoutDates = normalizeArray(newRecord.checkoutDates, capacity);
      newRecord.isReservedList = normalizeArray(newRecord.isReservedList, capacity, false);

      // Clear the specific bed
      newRecord.students[r.bedIdx] = '';
      newRecord.studentIds[r.bedIdx] = '';
      newRecord.courses[r.bedIdx] = '';
      newRecord.years[r.bedIdx] = '';
      newRecord.contacts[r.bedIdx] = '';
      newRecord.parentCtcs[r.bedIdx] = '';
      newRecord.signatures[r.bedIdx] = '';
      if (!newRecord.designations) newRecord.designations = [];
      newRecord.designations[r.bedIdx] = '';
      newRecord.checkinDates[r.bedIdx] = '';
      newRecord.checkoutDates[r.bedIdx] = today;
      newRecord.isReservedList[r.bedIdx] = false;

      newRecord.updatedAt = new Date().toISOString();
      
      onUpdateCheckIn(r.bid, r.rno, newRecord);
    }
  };

  const allRecords = Object.values(buildings).flatMap(b => {
    return b.floors.flatMap(f => {
      return f.rooms.flatMap(rno => {
        const data = (checkInData[`${b.id}_${rno}`] || { students: [] }) as any;
        const meta = f.roomMeta[rno];
        const capacity = meta?.capacity || 0;
        
        return Array.from({ length: capacity }).map((_, i) => {
          const name = (data.students || [])[i];
          const isOccupied = name && name.trim() !== '';
          const isReserved = isOccupied && (data.isReservedList ? data.isReservedList[i] : (data.isReserved || false));
          const status = isOccupied ? (isReserved ? 'reserved' : 'checked-in') : 'not-assigned';
          
          return {
            name: isOccupied ? name.trim() : 'Vacant Bed',
            studentId: isOccupied ? ((data.studentIds || [])[i] || '') : '',
            course: isOccupied ? ((data.courses || [])[i] || '') : '',
            year: isOccupied ? ((data.years || [])[i] || '') : '',
            contact: isOccupied ? ((data.contacts || [])[i] || '') : '',
            parentContact: isOccupied ? ((data.parentCtcs || [])[i] || '') : '',
            signature: isOccupied ? ((data.signatures || [])[i] || null) : null,
            designation: isOccupied ? ((data.designations || [])[i] || '') : '',
            building: b.name,
            bid: b.id,
            rno,
            floor: f.floor,
            roomType: meta?.type || '',
            category: meta?.category || '',
            bed: i + 1,
            checkinDate: isOccupied ? ((data.checkinDates?.[i]) || (data.checkinDate || '')) : '',
            checkoutDate: (data.checkoutDates?.[i]) || (data.checkoutDate || ''),
            isReserved,
            status,
            bedIdx: i
          };
        });
      });
    });
  });

  const filtered = allRecords.filter(r => {
    const matchesSearch = 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.building.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.rno.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !dateFilter || r.checkinDate === dateFilter;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesBuilding = buildingFilter === 'all' || r.bid === buildingFilter;
    
    return matchesSearch && matchesDate && matchesStatus && matchesBuilding;
  });

  const activeCount = allRecords.filter(r => r.status === 'checked-in' || r.status === 'reserved').length;

  const exportCSV = () => {
    if (!filtered.length) return;
    const hdrs = ['Student Name', 'Roll No.', 'Course', 'Year', 'Building', 'Room', 'Room Type', 'Bed', 'Check-In', 'Status'];
    const rows = filtered.map(r => [r.name, r.studentId, r.course, r.year, r.building, r.rno, r.roomType, r.bed, r.checkinDate, r.isReserved ? 'Reserved' : 'Active']);
    const csv = [hdrs, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GITAM_Hostel_Records_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="px-6 md:px-10">
      <div className="mb-8">
        <h2 className="font-serif text-3xl text-[#084f4f] mb-1">Accommodation Records</h2>
        <p className="text-[#5a6472]">{activeCount} active check-ins / {allRecords.length} total beds across GITAM hostels</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a6472]" size={18} />
          <input 
            className="w-full bg-white border border-[#f0e8d8] rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#0d6e6e]/20 outline-none shadow-sm transition-all"
            placeholder="Search by name, roll no., building, room..."
            value={searchTerm || ''}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <select 
            value={buildingFilter}
            onChange={e => setBuildingFilter(e.target.value)}
            className="bg-white border border-[#f0e8d8] rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#0d6e6e]/20 outline-none shadow-sm transition-all text-[#5a6472] font-medium min-w-[160px]"
          >
            <option value="all">All Buildings</option>
            {Object.values(buildings).map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <select 
            value={statusFilter || 'all'}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-white border border-[#f0e8d8] rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#0d6e6e]/20 outline-none shadow-sm transition-all text-[#5a6472] font-medium min-w-[140px]"
          >
            <option value="all">All Statuses</option>
            <option value="checked-in">Checked In</option>
            <option value="reserved">Reserved</option>
            <option value="not-assigned">Not Assigned</option>
          </select>
          <div className="relative">
            <input 
              type="date"
              className="bg-white border border-[#f0e8d8] rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#0d6e6e]/20 outline-none shadow-sm transition-all text-[#5a6472] font-medium"
              value={dateFilter || ''}
              onChange={e => setDateFilter(e.target.value)}
            />
            {dateFilter && (
              <button 
                onClick={() => setDateFilter('')}
                className="absolute -top-2 -right-2 w-5 h-5 bg-[#d94f3d] text-white rounded-full flex items-center justify-center text-[10px] shadow-sm hover:scale-110 transition-transform"
              >
                <X size={10} />
              </button>
            )}
          </div>
          <button 
            onClick={exportCSV}
            className="px-6 py-3 bg-[#0d6e6e] border border-[#0d6e6e] rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 hover:bg-[#084f4f] transition-all shadow-lg shadow-[#0d6e6e]/20"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#f0e8d8] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fdf8f0]">
                <th className="px-6 py-4 text-[10px] font-bold text-[#5a6472] uppercase tracking-widest border-b border-[#f0e8d8]">Student</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#5a6472] uppercase tracking-widest border-b border-[#f0e8d8]">Roll No.</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#5a6472] uppercase tracking-widest border-b border-[#f0e8d8]">Location</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#5a6472] uppercase tracking-widest border-b border-[#f0e8d8]">Room Info</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#5a6472] uppercase tracking-widest border-b border-[#f0e8d8]">Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#5a6472] uppercase tracking-widest border-b border-[#f0e8d8]">Check-In</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#5a6472] uppercase tracking-widest border-b border-[#f0e8d8]">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#5a6472] uppercase tracking-widest border-b border-[#f0e8d8]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e8d8]">
              {filtered.map((r, idx) => (
                <tr key={`${r.bid}_${r.rno}_${r.bedIdx}`} className="hover:bg-[#fdf8f0]/40 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-[#1a1a2e]">{r.name}</p>
                    <p className="text-xs text-[#5a6472]">
                      {r.course} {r.year ? `· ${r.year}${r.year === 'PG' ? '' : ' Yr'}` : ''}
                      {r.designation && <span className="text-[#0d6e6e] font-semibold"> · {r.designation}</span>}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {r.building.toLowerCase().includes('guest house') ? (
                       <span className="text-[10px] font-bold text-[#5a6472] uppercase bg-[#f0e8d8]/50 px-2 py-1 rounded-md tracking-wider">GUEST</span>
                    ) : (
                      <span className="text-xs font-mono text-[#5a6472] bg-[#f0e8d8]/50 px-2 py-1 rounded-md">{r.studentId || '—'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-semibold text-[#1a1a2e]">{r.building}</p>
                    <p className="text-[10px] text-[#5a6472] uppercase tracking-wide">Floor {r.floor}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-[#0d6e6e]">Room {r.rno}</p>
                    <p className="text-[10px] text-[#5a6472] uppercase tracking-wide">Bed {r.bed} · {r.category}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold text-[#c9922a] uppercase bg-[#fdf8f0] px-2 py-1 rounded-md border border-[#f0e8d8]">
                      {r.roomType || 'STANDARD'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-[#1a1a2e] font-medium">
                    {r.checkinDate || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      r.status === 'checked-in' ? "bg-[#e8f5e9] text-[#2e7d32]" : 
                      r.status === 'reserved' ? "bg-[#fef3e0] text-[#7a5200]" :
                      "bg-[#f0f0f0] text-[#5a6472]"
                    )}>
                      {r.status === 'checked-in' ? 'Checked In' : 
                       r.status === 'reserved' ? 'Reserved' : 'Not Assigned'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {r.signature && (
                        <button 
                          onClick={() => setShowSignatureUrl({ name: r.name, url: r.signature })}
                          className="p-2 text-[#0d6e6e] hover:bg-[#0d6e6e]/10 rounded-xl transition-colors"
                          title="View Signature"
                        >
                          <Signature size={18} />
                        </button>
                      )}
                      {(r.status === 'checked-in' || r.status === 'reserved') && (
                        <button 
                          onClick={() => handleCheckout(r)}
                          className="p-2 text-[#d94f3d] hover:bg-[#fdecea] rounded-xl transition-colors group/btn"
                          title="Check Out"
                        >
                          <Trash2 size={18} className="group-hover/btn:scale-110 transition-transform" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-[#fdf8f0] rounded-full flex items-center justify-center text-3xl text-gray-300">📋</div>
                      <p className="text-sm font-medium text-[#5a6472]">No records found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showSignatureUrl && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowSignatureUrl(null)}>
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowSignatureUrl(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <h4 className="text-center text-sm font-bold text-[#0d6e6e] uppercase tracking-widest mb-6">Signature: {showSignatureUrl.name}</h4>
            <div className="bg-[#fdf8f0] border border-[#f0e8d8] rounded-2xl p-4 flex items-center justify-center min-h-32">
              <img src={showSignatureUrl.url} alt="Signature" className="max-w-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
