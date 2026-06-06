/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { INITIAL_BUILDINGS } from './data';
import { Building, CheckInData, CheckInRecord, HistoricalRecord } from './types';
import DashboardView from './components/Dashboard';
import RoomsView from './components/RoomsView';
import RecordsView from './components/Records';
import SettingsView from './components/Settings';
import HistoryView from './components/History';
import { Home, ClipboardList, Settings, ShieldCheck, History, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, signInWithGoogle, logout, OperationType, handleFirestoreError } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'records' | 'settings' | 'history'>('dashboard');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [buildings, setBuildings] = useState<Record<string, Building>>(INITIAL_BUILDINGS);
  const [checkInData, setCheckInData] = useState<CheckInData>({});
  const [history, setHistory] = useState<HistoricalRecord[]>([]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Synchronizers
  useEffect(() => {
    if (!user) return;

    // Sync Buildings
    const unsubBuildings = onSnapshot(collection(db, 'buildings'), (snapshot) => {
      const data: Record<string, Building> = {};
      snapshot.forEach(doc => {
        data[doc.id] = doc.data() as Building;
      });
      if (Object.keys(data).length > 0) {
        setBuildings(data);
      } else {
        // Seed buildings if empty
        console.log('Seeding buildings database...');
        Object.entries(INITIAL_BUILDINGS).forEach(async ([id, b]) => {
          try {
            await setDoc(doc(db, 'buildings', id), b);
          } catch (e) {
            console.error(`Failed to seed building ${id}:`, e);
          }
        });
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'buildings'));

    // Sync Check-ins
    const unsubCheckins = onSnapshot(collection(db, 'checkins'), (snapshot) => {
      const data: CheckInData = {};
      snapshot.forEach(doc => {
        data[doc.id] = doc.data() as CheckInRecord;
      });
      setCheckInData(data);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'checkins'));

    // Sync History
    const historyQuery = query(collection(db, 'history'), orderBy('checkinDate', 'desc'));
    const unsubHistory = onSnapshot(historyQuery, (snapshot) => {
      const data: HistoricalRecord[] = [];
      snapshot.forEach(doc => {
        data.push({ ...doc.data() as HistoricalRecord, id: doc.id });
      });
      setHistory(data);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'history'));

    return () => {
      unsubBuildings();
      unsubCheckins();
      unsubHistory();
    };
  }, [user]);

  const handleUpdateCheckIn = async (buildingId: string, roomNumber: string, record: CheckInRecord) => {
    const id = `${buildingId}_${roomNumber}`;
    try {
      await setDoc(doc(db, 'checkins', id), record);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `checkins/${id}`);
    }
  };

  const handleUpdateBuildings = async (newBuildings: Record<string, Building>) => {
    try {
      for (const [id, b] of Object.entries(newBuildings)) {
        await setDoc(doc(db, 'buildings', id), b);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'buildings');
    }
  };

  const handleAddHistory = async (record: HistoricalRecord) => {
    const id = `${Date.now()}_${record.studentId}`;
    try {
      await setDoc(doc(db, 'history', id), { ...record, id });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `history/${id}`);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'history', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `history/${id}`);
    }
  };

  const breadcrumbs = [
    { label: 'Dashboard', icon: <Home size={14} />, active: activeTab === 'dashboard' && !selectedBuildingId, onClick: () => { setActiveTab('dashboard'); setSelectedBuildingId(null); } },
    ...(selectedBuildingId ? [{ label: buildings[selectedBuildingId]?.name || selectedBuildingId, active: true }] : []),
    ...(activeTab === 'records' ? [{ label: 'Records', icon: <ClipboardList size={14} />, active: true }] : []),
    ...(activeTab === 'history' ? [{ label: 'Room History', icon: <History size={14} />, active: true }] : []),
    ...(activeTab === 'settings' ? [{ label: 'Settings', icon: <Settings size={14} />, active: true }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#fdf8f0] text-[#1a1a2e] font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 h-18 bg-linear-to-br from-[#084f4f] via-[#0d6e6e] to-[#14a0a0] px-6 md:px-10 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#c9922a] rounded-lg flex items-center justify-center font-serif text-xl text-white font-bold">G</div>
          <div>
            <h1 className="font-serif text-xl text-white leading-tight">GITAM University</h1>
            <p className="text-[10px] text-white/70 uppercase tracking-widest">Hostel Management System</p>
          </div>
        </div>

        <nav className="hidden md:flex gap-1">
          <TabButton 
            active={activeTab === 'dashboard'} 
            onClick={() => { setActiveTab('dashboard'); setSelectedBuildingId(null); }}
            label="Dashboard"
            icon={<Home size={16} />}
          />
          <TabButton 
            active={activeTab === 'records'} 
            onClick={() => setActiveTab('records')}
            label="Records"
            icon={<ClipboardList size={16} />}
          />
          <TabButton 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')}
            label="History"
            icon={<History size={16} />}
          />
          <TabButton 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
            label="Settings"
            icon={<Settings size={16} />}
          />
        </nav>

        <div className="flex items-center gap-4">
          <div className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white flex items-center gap-2">
            <div className="w-2 h-2 bg-[#f0b84a] rounded-full animate-pulse" />
            <span className="hidden sm:inline">{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          </div>

          {user && (
            <button 
              onClick={() => logout()}
              className="text-white/70 hover:text-white flex items-center gap-2 text-xs transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
              <span className="hidden lg:inline">Logout</span>
            </button>
          )}
        </div>
      </header>

      {/* Mobile Nav */}
      <nav className="md:hidden flex justify-around bg-[#0d6e6e] p-2 border-t border-white/10 sticky top-18 z-40">
        <button onClick={() => { setActiveTab('dashboard'); setSelectedBuildingId(null); }} className={cn("p-2 text-white/60", activeTab === 'dashboard' && "text-white")}><Home size={20} /></button>
        <button onClick={() => setActiveTab('records')} className={cn("p-2 text-white/60", activeTab === 'records' && "text-white")}><ClipboardList size={20} /></button>
        <button onClick={() => setActiveTab('history')} className={cn("p-2 text-white/60", activeTab === 'history' && "text-white")}><History size={20} /></button>
        <button onClick={() => setActiveTab('settings')} className={cn("p-2 text-white/60", activeTab === 'settings' && "text-white")}><Settings size={20} /></button>
      </nav>

      {/* Breadcrumbs */}
      <div className="bg-white border-b border-[#f0e8d8] px-6 md:px-10 py-2.5 flex items-center gap-2 text-xs text-[#5a6472]">
        {breadcrumbs.map((bc, i) => (
          <div key={i} className="flex items-center gap-2">
            <button 
              onClick={bc.onClick}
              disabled={bc.active}
              className={cn("flex items-center gap-1.5 hover:text-[#0d6e6e] transition-colors", bc.active && "text-[#0d6e6e] font-semibold cursor-default")}
            >
              {bc.icon}
              {bc.label}
            </button>
            {i < breadcrumbs.length - 1 && <span className="text-gray-300">/</span>}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8">
        {authLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="w-12 h-12 border-4 border-[#0d6e6e] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#5a6472] font-medium animate-pulse">Initializing Security...</p>
          </div>
        ) : !user ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="bg-white p-12 rounded-[40px] shadow-2xl border border-[#f0e8d8] max-w-md w-full text-center">
              <div className="w-24 h-24 bg-linear-to-br from-[#084f4f] to-[#14a0a0] rounded-[30px] flex items-center justify-center mx-auto mb-8 shadow-xl">
                <ShieldCheck size={48} className="text-white" />
              </div>
              <h2 className="font-serif text-3xl mb-3 text-[#0d6e6e]">Restricted Access</h2>
              <p className="text-[#5a6472] mb-10 leading-relaxed text-sm">
                Hostel Management System is protected by end-to-end encryption. Please authenticate with GITAM credentials to proceed.
              </p>
              <button 
                onClick={() => signInWithGoogle()}
                className="w-full bg-[#c9922a] hover:bg-[#b07d20] text-white py-4 px-6 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all shadow-lg active:scale-95"
              >
                <LogIn size={20} />
                Sign in with Google
              </button>
            </div>
            <div className="mt-8 text-center">
              <p className="text-[10px] text-[#5a6472]/50 uppercase tracking-[4px]">Powered by Google Firebase Enterprise</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && !selectedBuildingId && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <DashboardView 
                  buildings={buildings} 
                  checkInData={checkInData} 
                  onSelectBuilding={setSelectedBuildingId} 
                />
              </motion.div>
            )}

            {activeTab === 'dashboard' && selectedBuildingId && (
              <motion.div
                key={`rooms-${selectedBuildingId}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ 
                  duration: 0.3, 
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <RoomsView 
                  building={buildings[selectedBuildingId]} 
                  checkInData={checkInData}
                  onBack={() => setSelectedBuildingId(null)}
                  onUpdateCheckIn={handleUpdateCheckIn}
                  onAddHistory={handleAddHistory}
                />
              </motion.div>
            )}

            {activeTab === 'records' && (
              <motion.div
                key="records"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <RecordsView 
                  buildings={buildings} 
                  checkInData={checkInData} 
                  onUpdateCheckIn={handleUpdateCheckIn}
                  onAddHistory={handleAddHistory}
                />
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <HistoryView 
                  history={history} 
                  buildings={buildings}
                  onDelete={handleDeleteHistory}
                />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <SettingsView 
                  buildings={buildings} 
                  onUpdateBuildings={handleUpdateBuildings}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
        active 
          ? "bg-white/15 border border-white/20 text-white shadow-sm" 
          : "text-white/60 hover:text-white"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

