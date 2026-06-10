/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { Building, CheckInData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LabelList, LineChart, Line } from 'recharts';
import { cn } from '../lib/utils';
import { TrendingUp, Users, Target, Zap, X, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  buildings: Record<string, Building>;
  checkInData: CheckInData;
  onSelectBuilding: (id: string) => void;
}

export default function Dashboard({ buildings, checkInData, onSelectBuilding }: DashboardProps) {
  const buildingArray = Object.values(buildings);
  
  const getOcc = (bid: string, rno: string) => {
    const rec = checkInData[`${bid}_${rno}`];
    return rec ? (rec.students || []).filter(s => s && s.trim()).length : 0;
  };

  const dashboardData = buildingArray.map(b => {
    const allR = b.floors.flatMap(fl => fl.rooms.map(rno => ({ rno, meta: fl.roomMeta[rno] })));
    const totalRooms = allR.length;
    const occupiedRooms = allR.filter(x => {
      const occ = getOcc(b.id, x.rno);
      return occ > 0;
    }).length;
    const vacantRooms = totalRooms - occupiedRooms;
    const totalBuildingCap = allR.reduce((acc, x) => acc + (x.meta?.capacity || 0), 0);
    const studentsCount = allR.reduce((acc, x) => acc + getOcc(b.id, x.rno), 0);
    const utilizationPct = totalBuildingCap ? Math.round((studentsCount / totalBuildingCap) * 100) : 0;
    
    return {
      name: b.name.replace(/Hostel|Bhavan/gi, '').trim() || b.abbr,
      id: b.id,
      occupied: occupiedRooms,
      vacant: vacantRooms,
      total: totalRooms,
      students: studentsCount,
      utilization: utilizationPct,
      capacity: totalBuildingCap
    };
  });

  const totalRooms = dashboardData.reduce((a, b) => a + b.total, 0);
  const totalStudents = dashboardData.reduce((a, b) => a + b.students, 0);
  const totalOccupied = dashboardData.reduce((a, b) => a + b.occupied, 0);
  const totalVacant = totalRooms - totalOccupied;

  const pieData = [
    { name: 'Occupied', value: totalOccupied, color: '#1a8f7d' },
    { name: 'Vacant', value: totalVacant, color: '#e8e0d0' }
  ];

  // Insight Categories
  const categoryStats: Record<string, { used: number, total: number }> = {};
  const typeStats: Record<string, { occupiedRooms: number, totalRooms: number, capacity: number, students: number }> = {};

  buildingArray.forEach(b => {
    b.floors.forEach(f => {
      Object.entries(f.roomMeta).forEach(([rno, meta]) => {
        // Category Metrics
        const cat = meta.category || 'Unknown';
        if (!categoryStats[cat]) categoryStats[cat] = { used: 0, total: 0 };
        categoryStats[cat].total += meta.capacity;
        const rec = checkInData[`${b.id}_${rno}`];
        const occStudents = rec ? (rec.students || []).filter(s => s && s.trim()).length : 0;
        categoryStats[cat].used += occStudents;

        // Type Metrics
        const rtype = (meta.type || 'Standard').trim().toUpperCase();
        if (!typeStats[rtype]) typeStats[rtype] = { occupiedRooms: 0, totalRooms: 0, capacity: 0, students: 0 };
        typeStats[rtype].totalRooms += 1;
        typeStats[rtype].capacity += meta.capacity;
        typeStats[rtype].students += occStudents;
        if (occStudents > 0) {
          typeStats[rtype].occupiedRooms += 1;
        }
      });
    });
  });

  const totalCap = dashboardData.reduce((a, b) => a + b.capacity, 0);
  const totalOccupancyPct = totalCap ? Math.round((totalStudents / totalCap) * 100) : 0;

  const typeData = Object.entries(typeStats).map(([name, stats]) => ({
    name,
    ...stats,
    occupancyPct: stats.capacity ? Math.round((stats.students / stats.capacity) * 100) : 0
  })).sort((a, b) => b.occupancyPct - a.occupancyPct);

  const [selectedTypeDetails, setSelectedTypeDetails] = useState<string | null>(null);

  const getTypeRoomDetails = (typeName: string) => {
    const details: Array<{ building: string, floor: string, room: string, capacity: number, students: number, category: string }> = [];
    buildingArray.forEach(b => {
      b.floors.forEach(f => {
        Object.entries(f.roomMeta).forEach(([rno, meta]) => {
          const rtype = (meta.type || 'Standard').trim().toUpperCase();
          if (rtype === typeName) {
            const rec = checkInData[`${b.id}_${rno}`];
            const occStudents = rec ? (rec.students || []).filter(s => s && s.trim()).length : 0;
            details.push({
              building: b.name,
              floor: `Floor ${f.floor}`,
              room: rno,
              capacity: meta.capacity,
              students: occStudents,
              category: meta.category
            });
          }
        });
      });
    });
    return details;
  };

  const catInsightData = Object.entries(categoryStats).map(([name, stats]) => ({
    name,
    percent: Math.round((stats.used / stats.total) * 100) || 0,
    used: stats.used,
    total: stats.total,
    shareOfTotal: totalCap ? Math.round((stats.total / totalCap) * 100) : 0
  })).sort((a, b) => b.percent - a.percent);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const checkinsOnDate = useMemo(() => {
    return Object.values(checkInData).reduce((acc, data) => {
      const dates = data.checkinDates || [];
      const students = data.students || [];
      return acc + students.filter((s, i) => s && s.trim() && dates[i] === selectedDate).length;
    }, 0);
  }, [checkInData, selectedDate]);

  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const activityData = last7Days.map(date => {
    const count = Object.values(checkInData).reduce((acc, data) => {
      const dates = data.checkinDates || [];
      const students = data.students || [];
      return acc + students.filter((s, i) => s && s.trim() && dates[i] === date).length;
    }, 0);
    return { date: date.slice(5), fullDate: date, count };
  });

  return (
    <div className="px-6 md:px-10 pb-20">
      {/* Detail Modal */}
      {selectedTypeDetails && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl border border-[#f0e8d8]"
          >
            <div className="p-6 border-b border-[#f0e8d8] flex items-center justify-between bg-[#fdfaf5]">
              <div>
                <h3 className="text-xl font-serif text-[#084f4f] flex items-center gap-3">
                  <span className="bg-[#0d6e6e] text-white p-1.5 rounded-lg"><Zap size={16} /></span>
                  {selectedTypeDetails} Inventory
                </h3>
                <p className="text-[10px] font-bold text-[#5a6472] uppercase tracking-wider mt-1">Detailed room distribution and occupancy</p>
              </div>
              <button 
                onClick={() => setSelectedTypeDetails(null)}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
              >
                <X size={20} className="text-[#5a6472]" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {getTypeRoomDetails(selectedTypeDetails).map((item, idx) => (
                  <div key={idx} className="p-4 bg-[#fdfaf5] border border-[#f0e8d8] rounded-2xl flex items-center justify-between group hover:border-[#c9922a] transition-colors">
                    <div>
                      <p className="text-[#1a1a2e] font-bold text-sm">Room {item.room}</p>
                      <p className="text-[9px] text-[#5a6472] uppercase font-bold">{item.building} • {item.floor}</p>
                      <p className="text-[8px] text-[#c9922a] font-bold mt-0.5">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-serif font-bold text-[#0d6e6e]">{item.students}/{item.capacity}</p>
                      <p className="text-[9px] text-[#5a6472] font-bold uppercase tracking-tighter">Students</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 bg-[#fdfaf5] border-t border-[#f0e8d8] flex justify-end">
              <button 
                onClick={() => setSelectedTypeDetails(null)}
                className="px-6 py-2 bg-[#0d6e6e] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#0d6e6e]/20 hover:bg-[#0a5a5a] transition-all"
              >
                Close View
              </button>
            </div>
          </motion.div>
        </div>
      )}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl text-[#084f4f] mb-1">Residence Hostels</h2>
          <p className="text-[#5a6472]">Select a building to manage room allotments and student check-ins</p>
        </div>
        <div className="flex items-center gap-3 bg-white border border-[#f0e8d8] px-4 py-2 rounded-2xl shadow-sm">
          <Calendar size={18} className="text-[#0d6e6e]" />
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-[#5a6472] uppercase tracking-[1px]">Select Date</span>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold text-[#1a1a2e] focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <StatCard icon="🏢" label="Buildings" value={buildingArray.length} color="bg-[#e0f4f4]" />
        <StatCard icon="🚪" label="Total Rooms" value={totalRooms} color="bg-[#fef3e0]" />
        <StatCard icon="✅" label="Students In" value={totalStudents} color="bg-[#e8f5e9]" />
        <StatCard icon="📅" label="Daily Check-ins" value={checkinsOnDate} color="bg-[#e0f2f1]" />
        <StatCard icon="⬜" label="Vacant Rooms" value={totalVacant} color="bg-[#fdecea]" />
        <StatCard icon="🎯" label="Utilization" value={totalOccupancyPct} unit="%" color="bg-[#ede9fe]" />
      </div>

      {/* Room Insights & Analytics */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0d6e6e] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#0d6e6e]/20">
              <Zap size={16} />
            </div>
            <div>
              <h3 className="font-serif text-2xl text-[#084f4f]">Category Performance</h3>
              <p className="text-[10px] text-[#5a6472] font-bold uppercase tracking-widest">Real-time room type and capacity metrics</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {typeData.map(type => (
            <button 
              key={type.name} 
              onClick={() => setSelectedTypeDetails(type.name)}
              className="bg-white border border-[#f0e8d8] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all text-left relative overflow-hidden group cursor-pointer active:scale-95"
            >
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm transition-transform group-hover:scale-110",
                    type.name.includes('AC') ? "bg-[#0d6e6e] text-white" : 
                    type.name.includes('STANDARD') ? "bg-[#c9922a] text-white" : "bg-[#4338ca] text-white"
                  )}>
                    {type.name.includes('GUEST') ? '🏠' : type.name.includes('AC') ? '❄️' : '🌬️'}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1a1a2e] leading-tight text-sm uppercase">{type.name}</h4>
                    <p className="text-[9px] text-[#5a6472] uppercase font-bold tracking-wider">{type.totalRooms} Rooms</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-serif font-bold text-[#0d6e6e]">{type.occupancyPct}%</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[9px] mb-1.5 font-bold uppercase tracking-wider">
                    <span className="text-[#5a6472]">Utilization</span>
                    <span className="text-[#1a1a2e]">{type.students} / {type.capacity} Beds</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#fdf8f0] rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full transition-all duration-1000", 
                        type.name.includes('AC') ? "bg-[#0d6e6e]" : 
                        type.name.includes('STANDARD') ? "bg-[#c9922a]" : "bg-[#4338ca]"
                      )} 
                      style={{ width: `${type.occupancyPct}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest pt-3 border-t border-[#f0e8d8] border-dashed text-[#5a6472]">
                  <span>{type.occupiedRooms} Active</span>
                  <div className="w-1 h-1 bg-[#f0e8d8] rounded-full" />
                  <span>{type.totalRooms - type.occupiedRooms} Vacant</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div className="bg-white rounded-2xl border border-[#f0e8d8] p-6 shadow-sm">
          <h3 className="text-sm font-bold text-[#0d6e6e] uppercase tracking-wider mb-6 flex items-center gap-2">
            📊 Room Occupancy
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="occupied" name="Occupied" fill="#1a8f7d" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="occupied" position="top" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#084f4f' }} />
                </Bar>
                <Bar dataKey="vacant" name="Vacant" fill="#f0e8d8" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="vacant" position="top" style={{ fontSize: '10px', fill: '#5a6472' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#f0e8d8] p-6 shadow-sm">
          <h3 className="text-sm font-bold text-[#c9922a] uppercase tracking-wider mb-6 flex items-center gap-2">
            🏘️ Bed Utilization (%)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`${value}% Utilization`]}
                />
                <Bar dataKey="utilization" fill="#c9922a" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="utilization" position="top" formatter={(v: any) => `${v}%`} style={{ fontSize: '10px', fontWeight: 'bold', fill: '#7a5200' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#f0e8d8] p-6 shadow-sm">
          <h3 className="text-sm font-bold text-[#0d6e6e] uppercase tracking-wider mb-6 flex items-center gap-2">
            📈 Daily Activity
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  name="Check-ins" 
                  stroke="#0d6e6e" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#0d6e6e', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#f0e8d8] p-6 shadow-sm">
          <h3 className="text-sm font-bold text-[#0d6e6e] uppercase tracking-wider mb-6 flex items-center gap-2">
            🍩 Overall Status
          </h3>
          <div className="h-64 flex flex-col items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <OccupancySummary 
        totalOccupied={totalOccupied} 
        totalRooms={totalRooms} 
        totalStudents={totalStudents} 
        totalCap={totalCap} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {buildingArray.map(b => (
          <BuildingCard 
            key={b.id} 
            building={b} 
            checkInData={checkInData}
            onClick={() => onSelectBuilding(b.id)}
          />
        ))}
      </div>
    </div>
  );
}

function OccupancySummary({ totalOccupied, totalRooms, totalStudents, totalCap }: { totalOccupied: number, totalRooms: number, totalStudents: number, totalCap: number }) {
  const roomPct = totalRooms ? Math.round((totalOccupied / totalRooms) * 100) : 0;
  const studentPct = totalCap ? Math.round((totalStudents / totalCap) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-[#f0e8d8] p-6 shadow-sm mb-10 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <Users size={160} className="text-[#0d6e6e]" />
      </div>
      <div className="relative z-10">
        <h3 className="text-sm font-bold text-[#0d6e6e] uppercase tracking-wider mb-8 flex items-center gap-2">
          🎯 Overall Occupancy Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <div className="flex justify-between items-end mb-3">
              <div>
                <p className="text-4xl font-serif font-bold text-[#1a1a2e]">{roomPct}%</p>
                <p className="text-[10px] text-[#5a6472] font-bold uppercase tracking-widest mt-1">Room Occupancy Rate</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[#1a1a2e]">{totalOccupied} / {totalRooms}</p>
                <p className="text-[9px] text-[#5a6472] uppercase">Rooms Occupied</p>
              </div>
            </div>
            <div className="h-3 w-full bg-[#fdf8f0] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#0d6e6e] rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(13,110,110,0.2)]" 
                style={{ width: `${roomPct}%` }}
              />
            </div>
            <p className="mt-4 text-[11px] text-[#5a6472] leading-relaxed">
              Based on the number of rooms that have at least one student checked in relative to the total number of rooms in all buildings.
            </p>
          </div>
          <div>
            <div className="flex justify-between items-end mb-3">
              <div>
                <p className="text-4xl font-serif font-bold text-[#0d6e6e]">{studentPct}%</p>
                <p className="text-[10px] text-[#5a6472] font-bold uppercase tracking-widest mt-1">Bed Utilization Rate</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[#1a1a2e]">{totalStudents} / {totalCap}</p>
                <p className="text-[9px] text-[#5a6472] uppercase">Beds Occupied</p>
              </div>
            </div>
            <div className="h-3 w-full bg-[#fdf8f0] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#c9922a] rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(201,146,42,0.2)]" 
                style={{ width: `${studentPct}%` }}
              />
            </div>
            <p className="mt-4 text-[11px] text-[#5a6472] leading-relaxed">
              Based on the total number of students currently checked in relative to the total student capacity across all hostel buildings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, unit = '' }: { icon: string, label: string, value: number, color: string, unit?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#f0e8d8] shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-xl", color)}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-[#5a6472] font-medium">{label}</p>
        <p className="text-2xl font-bold text-[#1a1a2e] leading-tight">{value}{unit}</p>
      </div>
    </div>
  );
}

function BuildingCard({ building, checkInData, onClick }: { building: Building, checkInData: CheckInData, onClick: () => void }) {
  const allR = building.floors.flatMap(fl => fl.rooms.map(rno => ({ rno, meta: fl.roomMeta[rno] })));
  const total = allR.length;
  
  const getOcc = (rno: string) => {
    const rec = checkInData[`${building.id}_${rno}`];
    return rec ? (rec.students || []).filter(s => s && s.trim()).length : 0;
  };

  const occupied = allR.filter(x => getOcc(x.rno) > 0).length;
  const students = allR.reduce((acc, x) => acc + getOcc(x.rno), 0);
  const vacant = total - occupied;
  const pct = total ? Math.round((occupied / total) * 100) : 0;
  
  const types = [...new Set(allR.map(x => x.meta?.type).filter(Boolean))].slice(0, 2);
  const cats = [...new Set(allR.map(x => x.meta?.category).filter(Boolean))].slice(0, 2);

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl border border-[#f0e8d8] shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 group"
    >
      <div className={cn("p-6 border-b border-[#f0e8d8] relative", 
        building.id === 'VS' ? "before:bg-[#0d6e6e]" : 
        building.id === 'SQ' ? "before:bg-[#c9922a]" : 
        building.id === 'NBH' ? "before:bg-[#4338ca]" : "before:bg-[#c2185b]",
        "before:absolute before:top-0 before:left-0 before:right-0 before:h-1"
      )}>
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform", 
          building.id === 'VS' ? "bg-[#e0f4f4]" : 
          building.id === 'SQ' ? "bg-[#fef3e0]" : 
          building.id === 'NBH' ? "bg-[#ede9fe]" : "bg-[#fce4ec]"
        )}>
          {building.icon}
        </div>
        <h3 className="font-serif text-xl mb-1">{building.name}</h3>
        <p className="text-[11px] uppercase tracking-widest text-[#5a6472] font-semibold">{building.abbr}</p>
      </div>

      <div className="p-6 pb-2">
        <div className="flex flex-wrap gap-2 mb-4">
          {types.map(t => <span key={t} className="text-[10px] font-bold bg-[#e0f4f4] text-[#084f4f] px-2 py-1 rounded-md uppercase">🏠 {t}</span>)}
          {cats.map(c => <span key={c} className="text-[10px] font-bold bg-[#fef3e0] text-[#7a5200] px-2 py-1 rounded-md uppercase">👥 {c}</span>)}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6 text-center">
          <div className="bg-[#fdf8f0] rounded-xl py-3">
            <p className="text-xl font-bold text-[#0d6e6e]">{total}</p>
            <p className="text-[9px] uppercase tracking-wider text-[#5a6472]">Rooms</p>
          </div>
          <div className="bg-[#fdf8f0] rounded-xl py-3">
            <p className="text-xl font-bold text-[#c9922a]">{occupied}</p>
            <p className="text-[9px] uppercase tracking-wider text-[#5a6472]">Occ.</p>
          </div>
          <div className="bg-[#fdf8f0] rounded-xl py-3">
            <p className="text-xl font-bold text-[#1a1a2e]">{students}</p>
            <p className="text-[9px] uppercase tracking-wider text-[#5a6472]">Stud.</p>
          </div>
        </div>

        <div className="h-1.5 w-full bg-[#f0e8d8] rounded-full overflow-hidden mb-4">
          <div 
            className={cn("h-full rounded-full transition-all duration-1000",
              building.id === 'VS' ? "bg-[#0d6e6e]" : 
              building.id === 'SQ' ? "bg-[#c9922a]" : 
              building.id === 'NBH' ? "bg-[#4338ca]" : "bg-[#c2185b]"
            )} 
            style={{ width: `${pct}%` }} 
          />
        </div>
      </div>

      <div className="px-6 py-4 bg-[#fdf8f0] flex items-center justify-between text-xs text-[#5a6472] border-t border-[#f0e8d8]">
        <span>{pct}% Occupied · {building.floors.length} Floors</span>
        <span className="text-[#0d6e6e] font-bold group-hover:translate-x-1 transition-transform">View Rooms →</span>
      </div>
    </div>
  );
}
