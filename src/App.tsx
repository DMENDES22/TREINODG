/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FirebaseProvider, useAuth } from './components/FirebaseProvider';
import { Login } from './components/auth/Login';
import { BottomNav, Tab } from './components/layout/BottomNav';
import { Dashboard } from './components/dashboard/Dashboard';
import { WorkoutList } from './components/workouts/WorkoutList';
import { ActiveWorkout } from './components/workouts/ActiveWorkout';
import { Workout } from './types';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <h1 className="font-display text-4xl animate-pulse text-brand italic tracking-tighter uppercase">IRONPROGRESS</h1>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <main className="flex-1 overflow-y-auto max-w-md mx-auto w-full pb-20">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'workouts' && (
          <WorkoutList onStartWorkout={(w) => setCurrentWorkout(w)} />
        )}
        {activeTab === 'history' && (
          <div className="p-8 pt-20 h-full flex flex-col items-center justify-center text-center opacity-30 gap-4">
            <div className="w-16 h-[1px] bg-brand" />
            <p className="font-display text-2xl uppercase tracking-tighter">Histórico em breve</p>
            <p className="text-xs uppercase tracking-[0.2em]">Onde sua jornada é imortalizada</p>
          </div>
        )}
        {activeTab === 'prs' && (
          <div className="p-8 pt-20 h-full flex flex-col items-center justify-center text-center opacity-30 gap-4">
            <div className="w-16 h-[1px] bg-brand" />
            <p className="font-display text-2xl uppercase tracking-tighter">Recordes Pessoais</p>
            <p className="text-xs uppercase tracking-[0.2em]">Bata seus limites hoje</p>
          </div>
        )}
        {activeTab === 'profile' && (
          <div className="p-8 pt-20 h-full flex flex-col items-center justify-center text-center space-y-6">
             <div className="w-24 h-24 rounded-full bg-surface border-4 border-brand p-1">
                <img 
                  src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                  alt="profile" 
                  className="w-full h-full rounded-full object-cover"
                />
             </div>
             <div className="space-y-1">
                <h3 className="font-display text-3xl uppercase">{user.displayName}</h3>
                <p className="text-white/40 text-xs uppercase tracking-widest">{user.email}</p>
             </div>
             <button 
              onClick={() => {}} 
              className="px-8 py-2 border border-white/10 rounded-full text-xs uppercase tracking-widest hover:bg-white/5 transition-colors"
            >
               Sair da Conta
             </button>
          </div>
        )}
      </main>

      {/* Overlays */}
      {currentWorkout && (
        <ActiveWorkout 
          workout={currentWorkout} 
          onClose={() => setCurrentWorkout(null)} 
        />
      )}

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}
