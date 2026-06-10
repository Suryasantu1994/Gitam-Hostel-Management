/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { Building, CheckInData, CheckInRecord, HistoricalRecord } from '../types';
import CheckInModal from './CheckInModal';
import { cn } from '../lib/utils';
import { ArrowLeft, Search } from 'lucide-react';
import { motion } from 'motion/react';

interface RoomsViewProps {
  building: Building;
  checkInData: CheckInData;
  onBack: () => void;
  onUpdateCheckIn: (bid: string, rno: string, rec: CheckInRecord) => void;
  onAddHistory: (record: HistoricalRecord) => void;
}

export default function RoomsView({ building, checkInData, onBack, onUpdateCheckIn, onAddHistory }: RoomsViewProps) {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const getOcc = (rno: string) => {
    const rec = checkInData[`${building.id}_${rno}`];
    return rec ? (rec.students || []).filter(s => s && s.trim()).length : 0;
  };

  const getStatus = (rno: string) => {
    const meta = building.floors.flatMap(f => f.rooms).includes(rno) 
      ? building.floors.find(f => f.rooms.includes(rno))?.roomMeta[rno] 
      : null;
    if (!meta) return 'vacant';
    const occ = getOcc(rno);
    if (occ === 0) return 'vacant';
    if (occ >= meta.capacity) return 'occupied';
    return 'partial';
  };

  const sortedFloors = useMemo(() => {
    return [...building.floors].sort((a, b) => a.floor - b.floor);
  }, [building.floors]);

  const cats = useMemo(() => 
    [...new Set(building.floors.flatMap(fl => Object.values(fl.roomMeta || {}).map(m => m?.category)))].filter(Boolean)
  , [building.floors]);
  const filterOptions = ['All', 'Vacant', 'Partial', 'Full', ...cats];

  return (
    <div className="px-6 md:px-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="font-serif text-2xl text-[#084f4f] mb-3">{building.name} — Room Grid</h2>
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] font-bold bg-[#e0f4f4] text-[#084f4f] px-2.5 py-1 rounded-md uppercase tracking-wider">🛏 {building.genderTag}</span>
            <span className="text-[10px] font-bold bg-[#fef3e0] text-[#7a5200] px-2.5 py-1 rounded-md uppercase tracking-wider">{building.floors.length} Floors</span>
          </div>
        </div>
        <button 
          onClick={onBack}
          className="self-start px-5 py-2.5 bg-white border border-[#f0e8d8] rounded-xl text-sm font-medium text-[#0d6e6e] flex items-center gap-2 transition-all hover:bg-[#0d6e6e] hover:text-white"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="flex flex-wrap items-center gap-2 flex-1 bg-white/50 p-2 rounded-2xl border border-[#f0e8d8]">
          <span className="text-xs font-bold text-[#5a6472] px-3 uppercase tracking-widest hidden sm:inline">Filter:</span>
          {filterOptions.map(opt => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={cn(
                "px-4 py-1.5 rounded-xl text-xs font-semibold transition-all",
                filter === opt 
                  ? "bg-[#0d6e6e] text-white shadow-sm" 
                  : "text-[#5a6472] hover:bg-[#0d6e6e]/10 hover:text-[#0d6e6e]"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
        <div className="relative min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            className="w-full bg-white border border-[#f0e8d8] rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-[#0d6e6e]/10 shadow-sm transition-all"
            placeholder="Search Room Number..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-6 mb-8 text-xs font-medium text-[#5a6472]">
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-white border-2 border-[#f0e8d8] rounded-sm" /> Vacant</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#c9922a] rounded-sm" /> Partial</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#0d6e6e] rounded-sm" /> Full</div>
      </div>

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.03
            }
          }
        }}
        className="flex flex-col gap-10 pb-20"
      >
        {sortedFloors.map(fl => {
          const filteredRooms = fl.rooms.filter(rno => {
            const matchesSearch = rno.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            if (filter === 'All') return true;
            const status = getStatus(rno);
            if (filter === 'Vacant') return status === 'vacant';
            if (filter === 'Partial') return status === 'partial';
            if (filter === 'Full') return status === 'occupied';
            return fl.roomMeta[rno]?.category === filter;
          });

          if (filteredRooms.length === 0 && filter !== 'All') return null;

          return (
            <motion.div 
              key={fl.floor} 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className="floor-group"
            >
              <div className="flex items-center gap-4 mb-4">
                <h3 className="text-xs font-bold text-[#5a6472] uppercase tracking-[3px]">Floor {fl.floor}</h3>
                <div className="flex-1 h-px bg-[#f0e8d8]" />
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                {filteredRooms.map(rno => (
                  <motion.div
                    key={rno}
                    variants={{
                      hidden: { opacity: 0, scale: 0.8 },
                      visible: { opacity: 1, scale: 1 }
                    }}
                  >
                    <RoomTile 
                      rno={rno} 
                      buildingId={building.id}
                      meta={fl.roomMeta[rno]}
                      occ={getOcc(rno)}
                      onClick={() => setSelectedRoom(rno)}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {selectedRoom && (
        <CheckInModal 
          isOpen={true}
          onClose={() => setSelectedRoom(null)}
          building={building}
          roomNumber={selectedRoom}
          existingRecord={checkInData[`${building.id}_${selectedRoom}`]}
          onSave={(record) => {
            onUpdateCheckIn(building.id, selectedRoom, record);
            setSelectedRoom(null);
          }}
          onAddHistory={onAddHistory}
        />
      )}
    </div>
  );
}

function RoomTile({ rno, meta, occ, onClick, buildingId }: { rno: string, meta: any, occ: number, onClick: () => void, buildingId: string }) {
  const cap = meta.capacity || 1;
  const status = occ === 0 ? 'vacant' : occ >= cap ? 'occupied' : 'partial';

  return (
    <div 
      onClick={onClick}
      className={cn(
        "aspect-square rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all border-2",
        status === 'vacant' && "bg-white border-[#f0e8d8] text-[#0d6e6e] hover:bg-[#e0f4f4] hover:border-[#0d6e6e] hover:scale-105 shadow-sm",
        status === 'occupied' && "bg-linear-to-br from-[#0d6e6e] to-[#14a0a0] border-transparent text-white hover:scale-105 shadow-md",
        status === 'partial' && "bg-linear-to-br from-[#f0b84a] to-[#e0a030] border-transparent text-white hover:scale-105 shadow-md"
      )}
    >
      <span className="text-lg font-bold">{rno}</span>
      <span className={cn("text-[7px] font-black px-1.5 py-0.5 rounded-sm bg-black/5 mb-0.5 uppercase tracking-tighter truncate max-w-full", status === 'vacant' ? "text-[#5a6472]" : "text-white/90 bg-white/10")}>
        {meta.type || 'STAND'}
      </span>
      <span className={cn("text-[9px] font-bold opacity-80 uppercase", status === 'vacant' ? "text-[#5a6472]" : "text-white")}>
        {occ} / {cap}
      </span>
      <div className="flex gap-0.5 mt-1.5 flex-wrap justify-center max-w-[80%]">
        {Array.from({ length: cap }).map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "w-1.5 h-1.5 rounded-full ring-1 ring-black/5",
              i < occ 
                ? (status === 'vacant' ? "bg-[#0d6e6e]" : "bg-white") 
                : (status === 'vacant' ? "bg-black/5" : "bg-white/30")
            )}
          />
        ))}
      </div>
    </div>
  );
}
