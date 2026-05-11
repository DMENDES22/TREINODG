import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../FirebaseProvider';
import { Workout, WorkoutType } from '../../types';
import { Plus, Play, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { CreateWorkoutModal } from './CreateWorkoutModal';

interface WorkoutListProps {
  onStartWorkout: (workout: Workout) => void;
}

export const WorkoutList: React.FC<WorkoutListProps> = ({ onStartWorkout }) => {
  const { profile } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchWorkouts = async () => {
    if (!profile) return;
    try {
      const q = query(collection(db, 'workouts'), where('userId', '==', profile.id));
      const snap = await getDocs(q);
      setWorkouts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Workout)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, [profile]);

  const createInitialWorkouts = async () => {
    if (!profile) return;
    const defaults = [
      { 
        name: 'Push (Peito, Ombro, Tríceps)', 
        type: WorkoutType.Push,
        exercises: [
          { name: 'Supino Reto', targetSets: 4, targetReps: '8-12', restSeconds: 90, suggestedWeight: 60, order: 1 },
          { name: 'Desenvolvimento Ombro', targetSets: 3, targetReps: '10-12', restSeconds: 60, suggestedWeight: 20, order: 2 },
          { name: 'Tríceps Corda', targetSets: 3, targetReps: '12-15', restSeconds: 45, suggestedWeight: 15, order: 3 },
        ]
      },
      { 
        name: 'Pull (Costas, Bíceps)', 
        type: WorkoutType.Pull,
        exercises: [
          { name: 'Puxada Frontal', targetSets: 4, targetReps: '10-12', restSeconds: 90, suggestedWeight: 50, order: 1 },
          { name: 'Remada Curvada', targetSets: 3, targetReps: '8-10', restSeconds: 90, suggestedWeight: 40, order: 2 },
          { name: 'Rosca Direta', targetSets: 3, targetReps: '12-15', restSeconds: 45, suggestedWeight: 12, order: 3 },
        ]
      },
      { 
        name: 'Legs (Quadríceps, Posterior)', 
        type: WorkoutType.Legs,
        exercises: [
          { name: 'Agachamento Livre', targetSets: 4, targetReps: '8-10', restSeconds: 120, suggestedWeight: 80, order: 1 },
          { name: 'Leg Press 45', targetSets: 3, targetReps: '12-15', restSeconds: 90, suggestedWeight: 160, order: 2 },
          { name: 'Cadeira Extensora', targetSets: 3, targetReps: '15-20', restSeconds: 45, suggestedWeight: 40, order: 3 },
        ]
      },
    ];

    for (const d of defaults) {
      const workoutRef = await addDoc(collection(db, 'workouts'), {
        name: d.name,
        type: d.type,
        userId: profile.id,
        createdAt: new Date().toISOString()
      });

      for (const ex of d.exercises) {
        await addDoc(collection(db, `workouts/${workoutRef.id}/exercises`), {
          ...ex,
          workoutId: workoutRef.id,
          exerciseId: ex.name.toLowerCase().replace(/\s+/g, '-'),
        });
      }
    }
    fetchWorkouts();
  };

  if (loading) return <div className="p-8 text-center opacity-50">Carregando planos...</div>;

  return (
    <div className="p-4 space-y-6 pb-24">
      <header className="flex justify-between items-end pt-4">
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-1">Rotinas Disponíveis</h2>
          <h1 className="font-black text-4xl uppercase tracking-tighter italic">PLANO DE <span className="text-brand">ATAQUE</span></h1>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-brand text-black p-3 rounded-xl hover:scale-110 active:scale-95 transition-transform shadow-[0_0_15px_rgba(224,255,0,0.4)]"
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </header>

      {workouts.length === 0 ? (
        <div className="text-center py-20 space-y-6 bg-zinc-900/30 rounded-3xl border border-dashed border-white/10">
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs italic">Nenhuma ficha tática encontrada.</p>
          <button 
            onClick={createInitialWorkouts}
            className="text-brand font-black uppercase tracking-tighter italic border-b-2 border-brand pb-1 hover:text-white hover:border-white transition-colors"
          >
            Gerar Arsenal Padrão
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {workouts.map((workout, i) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              key={workout.id}
              className="card-premium group relative flex items-center justify-between overflow-hidden cursor-pointer hover:border-brand/30 transition-colors"
              onClick={() => onStartWorkout(workout)}
            >
              <div className="flex-1">
                <span className="text-[9px] font-black uppercase text-brand tracking-[0.2em] italic mb-1 inline-block">{workout.type}</span>
                <h3 className="text-2xl font-black uppercase tracking-tighter leading-none italic group-hover:text-brand transition-colors">{workout.name}</h3>
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                  <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest leading-none">
                    VISTO POR ÚLTIMO: {workout.lastPerformedAt ? format(new Date(workout.lastPerformedAt), 'dd/MM/yy') : '---'}
                  </p>
                </div>
              </div>
              
              <div className="bg-zinc-800 p-4 rounded-2xl group-hover:bg-brand group-hover:text-black transition-all shadow-inner">
                <Play size={20} fill="currentColor" />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <CreateWorkoutModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={fetchWorkouts}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
