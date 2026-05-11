import React from 'react';
import { motion } from 'motion/react';
import { signInWithGoogle } from '../../lib/firebase';
import { LogIn } from 'lucide-react';

export const Login: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-brand-neon rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-brand flex items-center justify-center">
            <div className="w-8 h-8 bg-black rotate-45"></div>
          </div>
        </div>
        <h1 className="font-black text-7xl uppercase tracking-tighter italic leading-none">
          APEX<br /><span className="text-brand">OVERLOAD</span>
        </h1>
        <p className="text-zinc-500 mt-6 max-w-[280px] mx-auto text-[10px] leading-relaxed tracking-[0.3em] uppercase font-black italic">
          High Performance Training<br />Progression System v1.0
        </p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={signInWithGoogle}
        className="mt-16 group relative flex items-center gap-6 bg-brand text-black px-10 py-5 rounded-xl font-black uppercase text-lg hover:bg-white transition-all active:scale-95 italic tracking-tighter"
      >
        Entrar com Google
      </motion.button>

      <footer className="absolute bottom-12 flex flex-col items-center gap-4 opacity-30">
        <div className="flex gap-8 text-[9px] font-mono uppercase tracking-[0.2em]">
          <div>STATUS: <span className="text-brand">SYSTEM_READY</span></div>
          <div>AUTH: <span className="text-brand">SECURED</span></div>
        </div>
        <p className="text-[10px] text-zinc-500 uppercase tracking-[0.5em] font-black">
          Apex Fitness Experience
        </p>
      </footer>
    </div>
  );
};
