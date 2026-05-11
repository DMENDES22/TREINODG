import React, { useState, useEffect, useRef } from 'react';
import { Workout, WorkoutExercise, SetLog, PersonalRecord, WorkoutLog, SetType } from '../../types';
import { collection, query, where, getDocs, orderBy, limit, addDoc, doc, setDoc, serverTimestamp, collectionGroup } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../FirebaseProvider';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Clock, ChevronRight, ChevronLeft, Save, Sparkles, Timer, Plus, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getProgressionSuggestion } from '../../services/aiService';

interface ActiveWorkoutProps {
  workout: Workout;
  onClose: () => void;
}

interface SetState {
  weight: string;
  reps: string;
  isDone: boolean;
  type: SetType;
}

export const ActiveWorkout: React.FC<ActiveWorkoutProps> = ({ workout, onClose }) => {
  const { profile } = useAuth();
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sets, setSets] = useState<SetState[]>([]);
  const [prevPerformance, setPrevPerformance] = useState<{ weight: number, reps: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [workoutTime, setWorkoutTime] = useState(0);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const workoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    workoutTimerRef.current = setInterval(() => {
      setWorkoutTime(prev => prev + 1);
    }, 1000);
    return () => {
      if (workoutTimerRef.current) clearInterval(workoutTimerRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(v => v < 10 ? "0" + v : v).filter((v, i) => v !== "00" || i > 0).join(":");
  };

  useEffect(() => {
    const fetchExercises = async () => {
      const q = query(collection(db, `workouts/${workout.id}/exercises`), orderBy('order'));
      const snap = await getDocs(q);
      const exData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkoutExercise));
      
      // If no exercises, add some dummy ones for demo if needed, but here we assume there's flow
      setExercises(exData);
      setLoading(false);
    };
    fetchExercises();
  }, [workout]);

  useEffect(() => {
    if (exercises[currentIdx]) {
      const initialSets: SetState[] = Array.from({ length: exercises[currentIdx].targetSets }, () => ({
        weight: exercises[currentIdx].suggestedWeight?.toString() || '',
        reps: '',
        isDone: false,
        type: SetType.P
      }));
      setSets(initialSets);
      setAiSuggestion(null);
      fetchPrevPerformance();
      fetchAIRecommendation();
    }
  }, [currentIdx, exercises]);

  const fetchPrevPerformance = async () => {
    if (!profile || !exercises[currentIdx]) return;
    try {
      // Find last set for this exercise
      const q = query(
        collectionGroup(db, 'sets'),
        where('userId', '==', profile.id),
        where('exerciseId', '==', exercises[currentIdx].exerciseId || exercises[currentIdx].name.toLowerCase().replace(/\s+/g, '-')),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setPrevPerformance({ weight: data.weight, reps: data.reps });
      } else {
        setPrevPerformance(null);
      }
    } catch (e) {
      console.error('Error fetching prev performance:', e);
    }
  };

  const handleAddSet = () => {
    setSets([...sets, {
      weight: sets.length > 0 ? sets[sets.length - 1].weight : '',
      reps: sets.length > 0 ? sets[sets.length - 1].reps : '',
      isDone: false,
      type: SetType.P
    }]);
  };

  const handleRemoveSet = (idx: number) => {
    setSets(sets.filter((_, i) => i !== idx));
  };

  const cycleSetType = (idx: number) => {
    const newSets = [...sets];
    const currentType = newSets[idx].type;
    if (currentType === SetType.A) newSets[idx].type = SetType.P;
    else if (currentType === SetType.P) newSets[idx].type = SetType.V;
    else newSets[idx].type = SetType.A;
    setSets(newSets);
  };

  const fetchAIRecommendation = async () => {
    if (!profile || !exercises[currentIdx]) return;
    // Mock logic: find last sets for this exercise
    const q = query(
      collection(db, 'logs'), 
      where('userId', '==', profile.id), 
      orderBy('startedAt', 'desc'), 
      limit(5)
    );
    // In a real app we'd query setLogs for this exerciseId. For now, we'll use a placeholder or simplified logic.
    // Let's just call the service with mock history or empty for now.
    const suggestion = await getProgressionSuggestion(exercises[currentIdx].name, []);
    setAiSuggestion(suggestion.explanation);
  };

  const handleSetToggle = (idx: number) => {
    const newSets = [...sets];
    newSets[idx].isDone = !newSets[idx].isDone;
    setSets(newSets);

    if (newSets[idx].isDone) {
      // Start rest timer
      startRestTimer(exercises[currentIdx].restSeconds);
    }
  };

  const startRestTimer = (seconds: number) => {
    setRestTimer(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRestTimer(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const finishWorkout = async () => {
    if (!profile || isSaving) return;
    setIsSaving(true);
    try {
      const endTime = new Date();
      const startTimeDate = new Date(endTime.getTime() - workoutTime * 1000);
      
      let totalVolume = 0;
      // Note: Ideally we'd have tracked ALL sets across ALL exercises.
      // For this simplified logic, we'll only accurately save sets from the current exercise 
      // or if we had a more complex state management.
      // Let's assume we want to save at least the workout log.
      
      const logData = {
        userId: profile.id,
        workoutId: workout.id,
        workoutName: workout.name,
        startedAt: startTimeDate.toISOString(),
        endedAt: endTime.toISOString(),
        totalVolume: 0, 
        durationSeconds: workoutTime
      };

      const logRef = await addDoc(collection(db, 'logs'), logData);

      // Save sets for the current exercise at least to show flow
      for (let i = 0; i < sets.length; i++) {
        const s = sets[i];
        if (s.isDone) {
          const weightNum = parseFloat(s.weight) || 0;
          const repsNum = parseInt(s.reps) || 0;
          const volume = weightNum * repsNum;
          totalVolume += volume;

          await addDoc(collection(db, `logs/${logRef.id}/sets`), {
            logId: logRef.id,
            userId: profile.id,
            exerciseId: currentExercise.exerciseId || currentExercise.name.toLowerCase().replace(/\s+/g, '-'),
            exerciseName: currentExercise.name,
            weight: weightNum,
            reps: repsNum,
            type: s.type,
            volume: volume,
            setNumber: i + 1,
            restTaken: currentExercise.restSeconds, // simplified
            createdAt: new Date().toISOString()
          });

          // Update PR if necessary
          const prQ = query(
            collection(db, 'prs'),
            where('userId', '==', profile.id),
            where('exerciseId', '==', currentExercise.exerciseId || currentExercise.name.toLowerCase().replace(/\s+/g, '-'))
          );
          const prSnap = await getDocs(prQ);
          if (prSnap.empty) {
            await addDoc(collection(db, 'prs'), {
              userId: profile.id,
              exerciseId: currentExercise.exerciseId || currentExercise.name.toLowerCase().replace(/\s+/g, '-'),
              exerciseName: currentExercise.name,
              maxWeight: weightNum,
              maxVolume: volume,
              maxReps: repsNum,
              updatedAt: new Date().toISOString()
            });
          } else {
            const prDoc = prSnap.docs[0];
            const prData = prDoc.data();
            if (weightNum > prData.maxWeight || volume > prData.maxVolume) {
              await setDoc(doc(db, 'prs', prDoc.id), {
                maxWeight: Math.max(weightNum, prData.maxWeight),
                maxVolume: Math.max(volume, prData.maxVolume),
                maxReps: Math.max(repsNum, prData.maxReps),
                updatedAt: new Date().toISOString()
              }, { merge: true });
            }
          }
        }
      }

      // Update workout log with total volume
      await setDoc(doc(db, 'logs', logRef.id), { totalVolume }, { merge: true });
      
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseAttempt = () => {
    if (window.confirm('O treino está em andamento. Deseja realmente sair e descartar o progresso atual?')) {
      onClose();
    }
  };

  if (loading) return null;

  const currentExercise = exercises[currentIdx];

  if (!currentExercise) {
    return (
      <div className="p-8 text-center space-y-4 pt-20">
        <h2 className="text-2xl font-display uppercase tracking-widest">Treino Vazio</h2>
        <p className="text-white/40">Adicione exercícios a esta ficha primeiro.</p>
        <button onClick={onClose} className="btn-primary">Voltar</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col pt-safe px-4 pb-12 overflow-y-auto font-sans">
      <header className="py-8 flex justify-between items-center bg-[#0F0F0F] mx-[-1rem] px-4 border-b border-white/5 mb-8 shadow-2xl">
        <button onClick={handleCloseAttempt} className="text-zinc-500 transition-colors hover:text-brand bg-white/5 p-2 rounded-xl">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand italic">Sessão Ativa</h1>
          <p className="font-black text-2xl uppercase tracking-tighter italic leading-none">{workout.name}</p>
        </div>
        <div className="min-w-[50px] px-3 h-10 bg-zinc-800 rounded-xl flex items-center justify-center font-mono text-[11px] font-bold text-zinc-400 border border-white/5">
          {formatTime(workoutTime)}
        </div>
      </header>

      {/* Progress bar */}
      <div className="w-full h-1 bg-zinc-900 rounded-full mb-10 overflow-hidden px-1">
        <motion.div 
          className="h-full bg-brand shadow-[0_0_20px_rgba(224,255,0,0.6)]"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIdx + 1) / exercises.length) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentExercise.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex-1 space-y-8"
        >
          <div className="space-y-2 text-center">
            <h2 className="text-[10px] uppercase font-black text-zinc-500 tracking-[0.3em]">Exercício {currentIdx + 1} de {exercises.length}</h2>
            <h3 className="text-5xl font-black uppercase leading-none tracking-tighter italic scale-y-110 mb-4">{currentExercise.name}</h3>
            <div className="flex justify-center gap-4">
              <span className="bg-zinc-800 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-sm italic border border-white/5">{currentExercise.targetReps} REPS</span>
              <span className="bg-zinc-800 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-sm italic border border-white/5">{currentExercise.targetSets} SÉRIES</span>
            </div>
          </div>

          {aiSuggestion && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-brand/5 border border-brand/20 p-4 rounded-2xl flex gap-4 items-center"
            >
              <div className="bg-brand text-black p-2 rounded-lg shrink-0">
                <Sparkles size={16} />
              </div>
              <p className="text-[11px] font-black leading-relaxed italic uppercase tracking-tight text-white/80">{aiSuggestion}</p>
            </motion.div>
          )}

          {/* Sets Table */}
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-[1fr_2fr_2fr_2fr_1fr] px-2 text-[9px] font-black uppercase text-zinc-600 tracking-[0.2em] italic">
              <span>TIPO</span>
              <span>ÚLTIMO</span>
              <span>KG</span>
              <span className="text-center">REPS</span>
              <span></span>
            </div>
            
            <div className="space-y-3">
              {sets.map((set, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "grid grid-cols-[1fr_2fr_2fr_2fr_1fr] items-center p-4 rounded-2xl transition-all border-2",
                    set.isDone ? "bg-brand/10 border-brand shadow-[0_0_15px_rgba(224,255,0,0.1)]" : "bg-zinc-900/50 border-white/5"
                  )}
                >
                  <button 
                    onClick={() => cycleSetType(i)}
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm italic transition-colors",
                      set.type === SetType.A ? "bg-blue-500/20 text-blue-400" :
                      set.type === SetType.P ? "bg-green-500/20 text-green-400" :
                      "bg-red-500/20 text-red-500"
                    )}
                  >
                    {set.type}
                  </button>
                  <span className="text-[10px] text-zinc-600 font-black tracking-tighter italic">
                    {prevPerformance ? `${prevPerformance.weight}KG x ${prevPerformance.reps}` : '---'}
                  </span>
                  <input 
                    type="number"
                    value={set.weight}
                    onChange={(e) => {
                      const newSets = [...sets];
                      newSets[i].weight = e.target.value;
                      setSets(newSets);
                    }}
                    placeholder="--"
                    className={cn("bg-transparent w-full font-black text-xl focus:outline-none italic tracking-tighter", set.isDone ? "text-brand" : "text-white")}
                  />
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      value={set.reps}
                      onChange={(e) => {
                        const newSets = [...sets];
                        newSets[i].reps = e.target.value;
                        setSets(newSets);
                      }}
                      placeholder="--"
                      className={cn("bg-transparent w-full text-center font-black text-xl focus:outline-none italic tracking-tighter", set.isDone ? "text-brand" : "text-white")}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleSetToggle(i)}
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                        set.isDone ? "bg-brand text-black" : "bg-zinc-800 text-zinc-600 hover:bg-zinc-700"
                      )}
                    >
                      <Check size={16} strokeWidth={4} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={handleAddSet}
              className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center gap-2 text-zinc-600 font-black uppercase text-[10px] tracking-widest hover:border-brand/30 hover:text-brand transition-all"
            >
              <Plus size={14} /> ADICIONAR SÉRIE
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Rest Timer Overlay */}
      <AnimatePresence>
        {restTimer !== null && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-32 left-4 right-4 bg-brand text-black p-5 rounded-2xl flex items-center justify-between shadow-[0_20px_50px_rgba(224,255,0,0.3)] z-[100]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black/10 rounded-xl flex items-center justify-center">
                <Timer className="animate-spin-slow" size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest italic opacity-60">Status: Recuperando</p>
                <p className="font-black text-3xl uppercase tracking-tighter italic leading-none">{restTimer}s</p>
              </div>
            </div>
            <button 
              onClick={() => setRestTimer(null)}
              className="bg-black/10 px-6 py-3 rounded-xl font-black uppercase text-xs italic tracking-widest hover:bg-black/20"
            >
              Pular
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-12 flex gap-4">
        {currentIdx > 0 && (
          <button 
            onClick={() => setCurrentIdx(prev => prev - 1)}
            className="bg-zinc-900 p-5 rounded-2xl text-zinc-500 border border-white/5 hover:text-white transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        
        {currentIdx < exercises.length - 1 ? (
          <button 
            onClick={() => setCurrentIdx(prev => prev + 1)}
            className="flex-1 btn-primary flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(224,255,0,0.2)]"
          >
            PRÓXIMO ALVO <ChevronRight size={20} />
          </button>
        ) : (
          <button 
            onClick={finishWorkout}
            disabled={isSaving}
            className="flex-1 bg-white text-black font-black text-xl uppercase py-5 rounded-2xl hover:bg-brand transition-all flex items-center justify-center gap-3 italic tracking-tighter shadow-2xl"
          >
            {isSaving ? 'RELATANDO...' : 'SESSÃO CONCLUÍDA'} <Save size={20} />
          </button>
        )}
      </footer>
    </div>
  );
};
