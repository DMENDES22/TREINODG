import React from 'react';
import { Home, Dumbbell, History, Trophy, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

export type Tab = 'dashboard' | 'workouts' | 'history' | 'prs' | 'profile';

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs: { id: Tab; icon: any; label: string }[] = [
    { id: 'dashboard', icon: Home, label: 'Início' },
    { id: 'workouts', icon: Dumbbell, label: 'Treinos' },
    { id: 'history', icon: History, label: 'Histórico' },
    { id: 'prs', icon: Trophy, label: 'Recordes' },
    { id: 'profile', icon: User, label: 'Perfil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0F0F0F] border-t border-white/10 px-4 pb-safe pt-2 flex justify-around items-center z-50 h-16 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-col items-center gap-1 transition-all relative px-4 flex-1",
              isActive ? "text-brand" : "text-zinc-600 hover:text-zinc-400"
            )}
          >
            <Icon size={18} strokeWidth={isActive ? 3 : 2} className={cn("transition-transform", isActive && "scale-110")} />
            <span className="text-[9px] font-black tracking-[0.15em] uppercase italic">{tab.label}</span>
            {isActive && (
              <motion.div 
                layoutId="nav-indicator"
                className="absolute -top-3 w-10 h-1 bg-brand shadow-[0_0_15px_rgba(224,255,0,0.8)]" 
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};
