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
import { Building, CheckInData, CheckInRecord, HistoricalRecord, UserProfile } from './types';
import DashboardView from './components/Dashboard';
import RoomsView from './components/RoomsView';
import RecordsView from './components/Records';
import SettingsView from './components/Settings';
import HistoryView from './components/History';
import { Home, ClipboardList, Settings, ShieldCheck, History, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import logo from './assets/images/gitam_official_logo_1781087797030.png';
import { auth, db, signInWithGoogle, signInWithGoogleRedirect, logout, OperationType, handleFirestoreError } from './lib/firebase';
import { onAuthStateChanged, User, getRedirectResult } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'records' | 'settings' | 'history'>('dashboard');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [buildings, setBuildings] = useState<Record<string, Building>>(INITIAL_BUILDINGS);
  const [checkInData, setCheckInData] = useState<CheckInData>({});
  const [history, setHistory] = useState<HistoricalRecord[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Auth Listener
  useEffect(() => {
    // Check for redirect result first
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser(result.user);
        }
      })
      .catch((error) => {
        console.error("Redirect login error:", error);
        setLoginError("Failed to complete sign-in via redirect. Please try again.");
      });

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const isDefaultAdmin = u.email?.toLowerCase() === 'vkatakam@gitam.edu';
        if (isDefaultAdmin) setIsAdmin(true);

        const userDocRef = doc(db, 'users', u.uid);
        onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
            const profile = snapshot.data() as UserProfile;
            setIsAdmin(profile.isAdmin || isDefaultAdmin);
          } else {
            setDoc(userDocRef, {
              uid: u.uid,
              email: u.email || '',
              isAdmin: isDefaultAdmin
            }).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${u.uid}`));
            if (!isDefaultAdmin) setIsAdmin(false);
          }
        }, (error) => {
          // If we can't read the profile, but we match the default admin, stay admin
          if (!isDefaultAdmin) {
            handleFirestoreError(error, OperationType.GET, `users/${u.uid}`);
            setIsAdmin(false);
          }
        });
      } else {
        setIsAdmin(false);
      }
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

  // Sync Users (Admins only)
  useEffect(() => {
    if (!user || !isAdmin) {
      setAllUsers([]);
      return;
    }

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users: UserProfile[] = [];
      snapshot.forEach(doc => {
        users.push(doc.data() as UserProfile);
      });
      setAllUsers(users);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'users'));

    return () => unsubUsers();
  }, [user, isAdmin]);

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

  const handleUpdateUser = async (profile: UserProfile) => {
    try {
      await setDoc(doc(db, 'users', profile.uid), profile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${profile.uid}`);
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

  const handleLogin = async () => {
    setLoginError(null);
    try {
      // For Median.co/WebViews, we try popup first, but if it fails or if we want better stability
      // we might want to prioritize redirect.
      await signInWithGoogle();
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        setLoginError('Sign-in window was closed before completion.');
      } else if (error.code === 'auth/cancelled-by-user') {
        setLoginError('Sign-in was cancelled.');
      } else if (error.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        setLoginError(`Domain (${domain}) is not authorized. Please add it to "Authorized domains" in Firebase settings.`);
      } else if (error.code === 'auth/popup-blocked' || error.code === 'auth/internal-error') {
        // Fallback to redirect if popup is blocked or in environments that don't support popups
        console.log('Popup blocked or failed, trying redirect...');
        try {
          await signInWithGoogleRedirect();
        } catch (redirectError) {
          setLoginError('Sign-in popup was blocked and redirect fallback failed. Please check your browser settings.');
        }
      } else {
        setLoginError('An unexpected error occurred. Trying alternative sign-in...');
        try {
          await signInWithGoogleRedirect();
        } catch (redirectError) {
          console.error('All login methods failed:', error);
        }
      }
    }
  };

  const breadcrumbs = [
    { label: 'Dashboard', icon: <Home size={14} />, active: activeTab === 'dashboard' && !selectedBuildingId, onClick: () => { setActiveTab('dashboard'); setSelectedBuildingId(null); } },
    ...(selectedBuildingId ? [{ label: buildings[selectedBuildingId]?.name || selectedBuildingId, active: true }] : []),
    ...(activeTab === 'records' ? [{ label: 'Records', icon: <ClipboardList size={14} />, active: true }] : []),
    ...(activeTab === 'history' ? [{ label: 'Room History', icon: <History size={14} />, active: true }] : []),
    ...(activeTab === 'settings' && isAdmin ? [{ label: 'Settings', icon: <Settings size={14} />, active: true }] : []),
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
          {isAdmin && (
            <TabButton 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')}
              label="Settings"
              icon={<Settings size={16} />}
            />
          )}
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
        {isAdmin && (
          <button onClick={() => setActiveTab('settings')} className={cn("p-2 text-white/60", activeTab === 'settings' && "text-white")}><Settings size={20} /></button>
        )}
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
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="bg-white p-12 rounded-[40px] shadow-2xl border border-[#f0e8d8] max-w-md w-full text-center relative overflow-hidden"
            >
              <motion.div 
                initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ 
                  delay: 0.2, 
                  duration: 0.8, 
                  type: "spring",
                  stiffness: 100,
                  damping: 10
                }}
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="mb-8 flex justify-center"
              >
                <div className="relative group">
                  <div className="absolute inset-0 bg-[#0d6e6e] blur-3xl opacity-20 group-hover:opacity-30 transition-opacity" />
                  <motion.img 
                    animate={{ 
                      y: [0, -8, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    src={logo} 
                    alt="GITAM University Logo" 
                    className="w-48 h-48 rounded-full shadow-2xl relative z-10 border-[6px] border-white object-contain bg-white p-4"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="w-16 h-1 w-full max-w-[60px] bg-[#c9922a] mx-auto mb-6 rounded-full opacity-30" />
                <h2 className="font-serif text-3xl mb-3 text-[#0d6e6e]">Restricted Access</h2>
                <p className="text-[#5a6472] mb-10 leading-relaxed text-sm">
                  Hostel Management System is protected by end-to-end encryption. Please authenticate with GITAM credentials to proceed.
                </p>
              </motion.div>

              {loginError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2"
                >
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                  {loginError}
                </motion.div>
              )}

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogin}
                className="w-full bg-[#c9922a] hover:bg-[#b07d20] text-white py-4 px-6 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all shadow-lg shadow-[#c9922a]/20"
              >
                <LogIn size={20} />
                Sign in with Google
              </motion.button>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-8 text-center"
            >
              <p className="text-[10px] text-[#5a6472]/50 uppercase tracking-[4px]">Powered by Google Firebase Enterprise</p>
            </motion.div>
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

            {activeTab === 'settings' && isAdmin && (
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
                  users={allUsers}
                  onUpdateUser={handleUpdateUser}
                />
              </motion.div>
            )}
            {activeTab === 'settings' && !isAdmin && (
              <motion.div
                key="unauthorized"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <ShieldCheck size={48} className="text-[#c9922a] mb-4" />
                <h2 className="text-xl font-serif text-[#0d6e6e] mb-2">Admin Access Only</h2>
                <p className="text-[#5a6472] mb-6">You don't have permission to access the settings panel.</p>
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className="bg-[#0d6e6e] text-white px-6 py-2 rounded-xl text-sm font-bold"
                >
                  Return to Dashboard
                </button>
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

