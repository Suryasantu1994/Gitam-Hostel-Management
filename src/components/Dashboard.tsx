/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Building, CheckInData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LabelList, LineChart, Line } from 'recharts';
import { cn } from '../lib/utils';
import { TrendingUp, Users, Target, Zap } from 'lucide-react';

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
  buildingArray.forEach(b => {
    b.floors.forEach(f => {
      Object.entries(f.roomMeta).forEach(([rno, meta]) => {
        const cat = meta.category || 'Unknown';
        if (!categoryStats[cat]) categoryStats[cat] = { used: 0, total: 0 };
        categoryStats[cat].total += meta.capacity;
        const rec = checkInData[`${b.id}_${rno}`];
        categoryStats[cat].used += rec ? (rec.students || []).filter(s => s && s.trim()).length : 0;
      });
    });
  });

  const totalCap = dashboardData.reduce((a, b) => a + b.capacity, 0);

  const catInsightData = Object.entries(categoryStats).map(([name, stats]) => ({
    name,
    percent: Math.round((stats.used / stats.total) * 100) || 0,
    used: stats.used,
    total: stats.total,
    shareOfTotal: totalCap ? Math.round((stats.total / totalCap) * 100) : 0
  })).sort((a, b) => b.percent - a.percent);

  const today = new Date().toISOString().split('T')[0];
  const checkinsToday = Object.values(checkInData).reduce((acc, data) => {
    const dates = data.checkinDates || [];
    const students = data.students || [];
    return acc + students.filter((s, i) => s && s.trim() && dates[i] === today).length;
  }, 0);

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
      <div className="mb-8">
        <h2 className="font-serif text-3xl text-[#084f4f] mb-1">Residence Hostels</h2>
        <p className="text-[#5a6472]">Select a building to manage room allotments and student check-ins</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard icon="🏢" label="Buildings" value={buildingArray.length} color="bg-[#e0f4f4]" />
        <StatCard icon="🚪" label="Total Rooms" value={totalRooms} color="bg-[#fef3e0]" />
        <StatCard icon="✅" label="Students In" value={totalStudents} color="bg-[#e8f5e9]" />
        <StatCard icon="📅" label="Check-ins Today" value={checkinsToday} color="bg-[#e0f2f1]" />
        <StatCard icon="⬜" label="Vacant Rooms" value={totalVacant} color="bg-[#fdecea]" />
      </div>

      {/* Insights Section */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-[#0d6e6e] rounded-lg flex items-center justify-center text-white">
            <Zap size={18} />
          </div>
          <h3 className="font-serif text-2xl text-[#084f4f]">Occupancy Insights</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {catInsightData.map(cat => (
            <div key={cat.name} className="bg-white rounded-2xl p-5 border border-[#f0e8d8] shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start relative z-10">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[9px] font-bold text-[#5a6472] uppercase tracking-widest">{cat.name}</p>
                    <span className="text-[8px] bg-[#f0e8d8] text-[#7a5200] px-1.5 py-0.5 rounded font-bold">{cat.shareOfTotal}% SHARE</span>
                  </div>
                  <p className="text-xl font-bold text-[#1a1a2e]">{cat.percent}% <span className="text-[10px] text-[#5a6472] font-normal">Occupancy</span></p>
                </div>
                <div className="bg-[#e8f5f5] text-[#0d6e6e] p-2 rounded-lg">
                  <TrendingUp size={14} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 relative z-10">
                <div className="flex-1 h-1.5 bg-[#fdf8f0] rounded-full overflow-hidden">
                  <div className="h-full bg-[#0d6e6e] rounded-full" style={{ width: `${cat.percent}%` }} />
                </div>
                <span className="text-[10px] font-bold text-[#5a6472]">{cat.used}/{cat.total}</span>
              </div>
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-[#fdf8f0] rounded-full group-hover:scale-110 transition-transform" />
            </div>
          ))}
          <div className="bg-[#0d6e6e] rounded-2xl p-5 shadow-lg shadow-[#0d6e6e]/20 text-white flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <Target size={16} />
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/70">Efficiency Goal</span>
            </div>
            <div>
              <p className="text-xs text-white/80 mb-1">Overall utilization</p>
              <p className="text-2xl font-bold">{totalCap ? Math.round((totalStudents / totalCap) * 100) : 0}%</p>
            </div>
          </div>
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

function StatCard({ icon, label, value, color }: { icon: string, label: string, value: number, color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#f0e8d8] shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-xl", color)}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-[#5a6472] font-medium">{label}</p>
        <p className="text-2xl font-bold text-[#1a1a2e] leading-tight">{value}</p>
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
