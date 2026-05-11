import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Plus, Trash2, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { WorkoutType } from '../../types';
import { EXERCISE_LIBRARY } from '../../constants';
import { cn } from '../../lib/utils';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../FirebaseProvider';

interface CreateWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateWorkoutModal: React.FC<CreateWorkoutModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { profile } = useAuth();
  const [name, setName] = useState('');
  const [type, setType] = useState<WorkoutType>(WorkoutType.A);
  const [selectedExercises, setSelectedExercises] = useState<{ name: string; sets: number; reps: string; rest: number }[]>([]);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!profile || !name || selectedExercises.length === 0) return;
    setIsSaving(true);
    try {
      const workoutRef = await addDoc(collection(db, 'workouts'), {
        name,
        type,
        userId: profile.id,
        createdAt: new Date().toISOString()
      });

      for (let i = 0; i < selectedExercises.length; i++) {
        const ex = selectedExercises[i];
        await addDoc(collection(db, `workouts/${workoutRef.id}/exercises`), {
          name: ex.name,
          targetSets: ex.sets,
          targetReps: ex.reps,
          restSeconds: ex.rest,
          order: i + 1,
          workoutId: workoutRef.id,
          exerciseId: ex.name.toLowerCase().replace(/\s+/g, '-'),
        });
      }
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleExercise = (exName: string) => {
    if (selectedExercises.find(e => e.name === exName)) {
      setSelectedExercises(selectedExercises.filter(e => e.name !== exName));
    } else {
      setSelectedExercises([...selectedExercises, { name: exName, sets: 3, reps: '10-12', rest: 60 }]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-surface rounded-3xl w-full max-w-md h-[90vh] flex flex-col overflow-hidden border border-white/5 shadow-2xl"
      >
        {/* Header */}
        <header className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand italic">Novo Arsenal</h2>
            <h3 className="font-black text-2xl uppercase tracking-tighter italic">Personalizar <span className="text-brand">Treino</span></h3>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Workout Basics */}
          <section className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Identificação da Ficha</label>
              <input 
                type="text" 
                placeholder="Ex: Upper Day / Perna Foco Quadríceps" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full input-dark font-bold italic tracking-tight text-lg"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Tipo de Divisão</label>
              <div className="flex flex-wrap gap-2">
                {Object.values(WorkoutType).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all italic border",
                      type === t ? "bg-brand text-black border-brand" : "bg-white/5 text-zinc-500 border-white/5 hover:border-white/10"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Exercises List */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Arsenal de Exercícios</label>
              <button 
                onClick={() => setIsAddingExercise(true)}
                className="text-brand flex items-center gap-1 text-[10px] font-black uppercase tracking-widest border border-brand/20 px-3 py-1 rounded-full hover:bg-brand/10"
              >
                <Plus size={14} strokeWidth={3} /> Adicionar
              </button>
            </div>

            <div className="space-y-3">
              {selectedExercises.map((ex, i) => (
                <div key={ex.name} className="card-premium p-4 flex gap-4 items-center border border-white/5">
                  <div className="bg-brand/10 text-brand w-8 h-8 rounded-lg flex items-center justify-center font-black italic">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black uppercase tracking-tighter italic text-lg truncate leading-none">{ex.name}</p>
                    <div className="flex gap-4 mt-2">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Séries</span>
                        <input 
                          type="number" 
                          value={ex.sets}
                          onChange={(e) => {
                            const newExs = [...selectedExercises];
                            newExs[i].sets = parseInt(e.target.value) || 0;
                            setSelectedExercises(newExs);
                          }}
                          className="bg-transparent border-b border-white/10 w-8 font-mono text-xs focus:outline-none focus:border-brand"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Reps</span>
                        <input 
                          type="text" 
                          value={ex.reps}
                          onChange={(e) => {
                            const newExs = [...selectedExercises];
                            newExs[i].reps = e.target.value;
                            setSelectedExercises(newExs);
                          }}
                          className="bg-transparent border-b border-white/10 w-12 font-mono text-xs focus:outline-none focus:border-brand"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Descanço(s)</span>
                        <input 
                          type="number" 
                          value={ex.rest}
                          onChange={(e) => {
                            const newExs = [...selectedExercises];
                            newExs[i].rest = parseInt(e.target.value) || 0;
                            setSelectedExercises(newExs);
                          }}
                          className="bg-transparent border-b border-white/10 w-12 font-mono text-xs focus:outline-none focus:border-brand"
                        />
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedExercises(selectedExercises.filter(e => e.name !== ex.name))}
                    className="text-zinc-700 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {selectedExercises.length === 0 && (
                <p className="text-center py-10 text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] italic bg-zinc-900/20 rounded-2xl border border-dashed border-white/5">
                  Nenhum exercício selecionado
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="p-6 border-t border-white/5 bg-zinc-900/50">
          <button 
            disabled={isSaving || !name || selectedExercises.length === 0}
            onClick={handleSave}
            className="w-full btn-primary"
          >
            {isSaving ? 'Codificando Arsenal...' : 'Salvar Ficha de Ataque'}
          </button>
        </footer>

        {/* Exercise Library Overlay */}
        <AnimatePresence>
          {isAddingExercise && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 bg-surface z-50 flex flex-col"
            >
              <header className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/80">
                <div>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand italic">Biblioteca</h2>
                  <h3 className="font-black text-2xl uppercase tracking-tighter italic">Selecionar <span className="text-brand">Alvos</span></h3>
                </div>
                <button onClick={() => setIsAddingExercise(false)} className="p-2 bg-white/5 rounded-xl">
                  <Check size={20} className="text-brand" />
                </button>
              </header>

              <div className="p-4 border-b border-white/5">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="Buscar exercício..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-bg-matte border border-white/5 rounded-xl text-white font-bold italic focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {Object.entries(EXERCISE_LIBRARY).map(([category, exs]) => {
                  const filtered = exs.filter(e => e.toLowerCase().includes(search.toLowerCase()));
                  if (filtered.length === 0) return null;
                  const isExpanded = expandedCategory === category || search.length > 0;

                  return (
                    <div key={category} className="space-y-2">
                      <button 
                        onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                        className="w-full flex justify-between items-center p-4 bg-zinc-900/50 rounded-xl border border-white/5"
                      >
                        <span className="font-black uppercase tracking-widest text-zinc-400 italic text-xs">{category}</span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      
                      {isExpanded && (
                        <div className="grid grid-cols-1 gap-2 pl-2">
                          {filtered.map(ex => {
                            const isSelected = selectedExercises.some(s => s.name === ex);
                            return (
                              <button
                                key={ex}
                                onClick={() => toggleExercise(ex)}
                                className={cn(
                                  "flex justify-between items-center p-4 rounded-xl border transition-all italic font-black uppercase tracking-tighter",
                                  isSelected 
                                    ? "bg-brand/10 border-brand text-brand" 
                                    : "bg-white/5 border-white/5 text-white/60 hover:border-white/10"
                                )}
                              >
                                {ex}
                                {isSelected ? <Check size={16} strokeWidth={3} /> : <Plus size={16} className="opacity-20" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
