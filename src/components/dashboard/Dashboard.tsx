import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../FirebaseProvider';
import { WorkoutLog, PersonalRecord } from '../../types';
import { Activity, Flame, TrendingUp, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../lib/utils';

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [recentLogs, setRecentLogs] = useState<WorkoutLog[]>([]);
  const [topPrs, setTopPrs] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const fetchData = async () => {
      try {
        const logsQuery = query(
          collection(db, 'logs'),
          where('userId', '==', profile.id),
          orderBy('startedAt', 'desc'),
          limit(5)
        );
        const logsSnap = await getDocs(logsQuery);
        setRecentLogs(logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkoutLog)));

        const prsQuery = query(
          collection(db, 'prs'),
          where('userId', '==', profile.id),
          orderBy('maxWeight', 'desc'),
          limit(3)
        );
        const prsSnap = await getDocs(prsQuery);
        setTopPrs(prsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PersonalRecord)));
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile]);

  if (loading) return <div className="flex justify-center items-center h-full">Carregando...</div>;

  const weeklyVol = recentLogs.reduce((acc, log) => acc + log.totalVolume, 0);

  return (
    <div className="space-y-6 pb-20">
      <header className="p-4 pt-8 flex items-center justify-between">
        <div>
          <h1 className="font-black text-3xl uppercase tracking-tighter italic leading-none">APEX <span className="text-brand">OVERLOAD</span></h1>
          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mt-1">Evolução de Elite</p>
        </div>
        <div className="w-10 h-10 bg-zinc-800 rounded-full border border-white/20 p-0.5 overflow-hidden">
          <img 
            src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.id}`} 
            alt="profile" 
            className="w-full h-full rounded-full object-cover grayscale"
          />
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 gap-4 px-4">
        {[
          { label: 'Sessão Hoje', value: recentLogs[0] ? format(new Date(recentLogs[0].startedAt), 'EEE', { locale: ptBR }) : 'N/A', icon: Activity },
          { label: 'Vol. Semanal', value: `${(weeklyVol / 1000).toFixed(1)}k`, icon: TrendingUp },
          { label: 'Performance', value: 'Lv. 42', icon: Flame },
          { label: 'Duração Est.', value: '65m', icon: Clock },
        ].map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="card-premium p-5 flex flex-col gap-1"
          >
            <div className="flex justify-between items-start">
              <span className="text-zinc-500 text-[9px] uppercase font-black tracking-widest">{stat.label}</span>
              <stat.icon size={14} className="text-white/20" />
            </div>
            <span className={cn("text-3xl font-black uppercase tracking-tighter", i === 1 ? "text-brand" : "text-white")}>{stat.value}</span>
            {i === 1 && <div className="h-[2px] w-8 bg-brand mt-1" />}
          </motion.div>
        ))}
      </section>

      {/* AI Progress Card - Apex Theme */}
      <section className="px-4">
        <div className="bg-brand/5 border border-brand/20 p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-brand animate-pulse"></div>
            <span className="text-[11px] font-black uppercase text-brand tracking-wider">Apex Progression Engine</span>
          </div>
          <p className="text-zinc-300 text-sm leading-relaxed mb-4">
            Você completou <span className="text-white font-bold">todas as reps</span> no último treino. Sua performance está em <span className="text-brand font-bold underline underline-offset-4 tracking-tighter uppercase italic">Peak Performance</span>.
          </p>
          <div className="flex gap-4">
             <div className="flex-1 bg-black/40 p-3 border border-white/5 rounded-xl">
                <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">Status</p>
                <p className="text-xs font-bold text-white uppercase italic tracking-tighter">Hyper-Focus</p>
             </div>
             <div className="flex-1 bg-black/40 p-3 border border-white/5 rounded-xl">
                <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">Recomendação</p>
                <p className="text-xs font-bold text-brand uppercase italic tracking-tighter">+2.5KG Top Set</p>
             </div>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="px-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-4 px-1">Histórico de Sessões</h2>
        <div className="space-y-4">
          {recentLogs.map((log) => (
            <div key={log.id} className="card-premium p-5 flex items-center justify-between border-l-4 border-brand">
              <div>
                <span className="text-[10px] bg-brand text-black px-2 py-0.5 font-black uppercase italic mb-1 inline-block">Sessão Concluída</span>
                <h3 className="font-black text-2xl uppercase tracking-tighter leading-none">{log.workoutName}</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1 tracking-widest">{format(new Date(log.startedAt), "dd 'de' MMM", { locale: ptBR })}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black tracking-tighter">{log.totalVolume.toLocaleString()}KG</p>
                <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest italic">{(log.durationSeconds / 60).toFixed(0)} MIN</p>
              </div>
            </div>
          ))}
          {recentLogs.length === 0 && <p className="text-white/40 text-sm text-center py-8">Nenhum treino registrado.</p>}
        </div>
      </section>
    </div>
  );
};
