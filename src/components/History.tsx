import { useState } from 'react';
import { HistoricalRecord } from '../types';
import { Search, Calendar, MapPin, ClipboardList, User, Phone, GraduationCap, FileSignature, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface HistoryViewProps {
  history: HistoricalRecord[];
  buildings: Record<string, import('../types').Building>;
  onDelete: (id: string) => void;
}

export default function HistoryView({ history, buildings, onDelete }: HistoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [buildingFilter, setBuildingFilter] = useState<string>('all');
  const [showSignatureUrl, setShowSignatureUrl] = useState<{name: string, url: string} | null>(null);

  const filtered = history.filter(r => {
    const matchesSearch = 
      r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.buildingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !dateFilter || r.checkoutDate === dateFilter;
    const matchesBuilding = buildingFilter === 'all' || r.buildingId === buildingFilter;
    
    return matchesSearch && matchesDate && matchesBuilding;
  });

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ['Name', 'ID/Designation', 'Building', 'Room', 'Room Type', 'Department/Course', 'Year', 'Check-In', 'Check-Out', 'Laundry Pkg'];
    const rows = filtered.map(r => [
      r.studentName, 
      r.designation || r.studentId, 
      r.buildingName, 
      r.roomNumber, 
      r.roomType || '',
      r.course, 
      r.year, 
      r.checkinDate, 
      r.checkoutDate,
      r.laundryEligible ? 'Eligible' : 'Not Eligible'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Hostel_Room_History_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="px-6 md:px-10">
      <div className="mb-8">
        <h2 className="font-serif text-3xl text-[#084f4f] mb-1">Room History</h2>
        <p className="text-[#5a6472]">{filtered.length} total historical checkout records</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5cc0c0]" size={18} />
          <input 
            className="w-full bg-white border border-[#f0e8d8] rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#0d6e6e]/20 outline-none shadow-sm transition-all"
            placeholder="Search by student, building, room..."
            value={searchTerm}
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
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5cc0c0]" size={16} />
            <input 
              type="date"
              className="bg-white border border-[#f0e8d8] rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#0d6e6e]/20 outline-none shadow-sm transition-all text-[#5a6472] font-medium"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />
            {dateFilter && (
              <button 
                onClick={() => setDateFilter('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                ×
              </button>
            )}
          </div>
          <button 
            onClick={exportCSV}
            className="bg-white border border-[#f0e8d8] rounded-2xl px-6 py-3 text-sm font-bold text-[#0d6e6e] hover:bg-[#0d6e6e] hover:text-white transition-all shadow-sm flex items-center gap-2"
          >
            <ClipboardList size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#f0e8d8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fdfbf6]">
                <th className="px-6 py-4 text-[10px] font-bold text-[#5a6472] uppercase tracking-widest border-b border-[#f0e8d8]">Name & ID / Desig</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#5a6472] uppercase tracking-widest border-b border-[#f0e8d8]">Location</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#5a6472] uppercase tracking-widest border-b border-[#f0e8d8]">Room Info</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#5a6472] uppercase tracking-widest border-b border-[#f0e8d8]">Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#5a6472] uppercase tracking-widest border-b border-[#f0e8d8]">Check-In</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#5a6472] uppercase tracking-widest border-b border-[#f0e8d8]">Check-Out</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#5a6472] uppercase tracking-widest border-b border-[#f0e8d8]">Laundry</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#5a6472] uppercase tracking-widest border-b border-[#f0e8d8]">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#5a6472] uppercase tracking-widest border-b border-[#f0e8d8]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e8d8]">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-[#fdfbf6] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#f0e8d8] flex items-center justify-center text-[#0d6e6e]">
                        <User size={14} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#1a1a2e]">{r.studentName}</div>
                        <div className="text-[10px] text-[#5a6472] font-medium uppercase tracking-wider">
                          {r.designation || r.studentId || '—'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-[#1a1a2e] font-medium">
                      <MapPin size={12} className="text-[#c9922a]" />
                      {r.buildingName}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-bold text-[#1a1a2e]">Room {r.roomNumber}</div>
                    <div className="text-[10px] text-[#5a6472]">
                      {r.course} {r.year ? `• Yr ${r.year}` : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold text-[#c9922a] uppercase bg-[#fdf8f0] px-2 py-1 rounded-md border border-[#f0e8d8]">
                      {r.roomType || 'STANDARD'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-[#1a1a2e] font-medium">
                    {r.checkinDate || '—'}
                  </td>
                  <td className="px-6 py-4 text-xs text-[#d94f3d] font-bold">
                    {r.checkoutDate || '—'}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <span className={cn(
                      "px-2 py-1 rounded-md font-bold uppercase text-[9px]",
                      r.laundryEligible ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"
                    )}>
                      {r.laundryEligible ? 'Eligible' : 'Not Eligible'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500">
                      Checked Out
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       {r.signature && (
                        <button 
                          onClick={() => setShowSignatureUrl({ name: r.studentName, url: r.signature! })}
                          className="p-2 bg-[#fdf8f0] text-[#c9922a] rounded-lg hover:bg-[#c9922a] hover:text-white transition-all shadow-xs"
                          title="View Signature"
                        >
                          <FileSignature size={14} />
                        </button>
                      )}
                      <DeleteConfirmButton onDelete={() => onDelete(r.id)} />
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-3 text-gray-400">
                      <Search size={24} />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">No historical records found matching your filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showSignatureUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-serif font-bold text-[#084f4f]">Student Signature</h3>
                  <p className="text-xs text-[#5a6472]">{showSignatureUrl.name}</p>
                </div>
                <button 
                  onClick={() => setShowSignatureUrl(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
                >
                  ×
                </button>
              </div>
              <div className="bg-[#fdfbf6] rounded-2xl p-4 border border-[#f0e8d8]">
                <img src={showSignatureUrl.url} alt="Signature" className="w-full h-auto grayscale contrast-125" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DeleteConfirmButton({ onDelete }: { onDelete: () => void }) {
  const [confirm, setConfirm] = useState(false);

  if (confirm) {
    return (
      <div className="flex items-center gap-1.5 animate-in slide-in-from-right-1 duration-200">
        <button 
          onClick={onDelete}
          className="px-2 py-1 bg-red-500 text-white rounded-lg text-[9px] font-bold uppercase hover:bg-red-600 transition-all shadow-xs"
        >
          Confirm
        </button>
        <button 
          onClick={() => setConfirm(false)}
          className="px-2 py-1 bg-gray-200 text-gray-600 rounded-lg text-[9px] font-bold uppercase hover:bg-gray-300 transition-all"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={() => setConfirm(true)}
      className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-xs"
      title="Delete Record"
    >
      <Trash2 size={14} />
    </button>
  );
}
