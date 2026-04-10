import { useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Receipt, Zap, Check } from 'lucide-react';

const ReceiptSlider = () => {
  const x = useMotionValue(100);

  // Masking percentages
  const maskWidth = useTransform(x, (val) => `${val}%`);

  return (
    <div className="relative w-full h-[500px] bg-black/40 rounded-3xl overflow-hidden group border border-white/5 shadow-2xl">
      {/* --- LAYER 1: DIGITAL (TRANSFORMED) --- */}
      <div className="absolute inset-0 p-8 flex flex-col justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
         <div className="space-y-4 max-w-md mx-auto w-full">
            <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                     <Check className="text-black w-6 h-6" />
                  </div>
                  <h4 className="text-xl font-black font-outfit uppercase tracking-tighter">Verified Vision</h4>
               </div>
               <span className="text-2xl font-black text-primary">₹842.50</span>
            </div>
            
            {[
              { n: "Amul Gold Milk", p: "33.00", c: "Dairy" },
              { n: "Taj Mahal Tea", p: "210.00", c: "Bev" },
              { n: "Noodles 6-Pack", p: "168.00", c: "Pack" },
              { n: "Potatoes 2kg", p: "48.00", c: "Veg" }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between p-4 glass rounded-2xl border-white/5"
              >
                 <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black">{item.n[0]}</div>
                    <div>
                       <p className="text-sm font-bold">{item.n}</p>
                       <p className="text-[10px] text-white/30 uppercase font-black">{item.c}</p>
                    </div>
                 </div>
                 <span className="text-sm font-black">₹{item.p}</span>
              </motion.div>
            ))}
         </div>
      </div>

      {/* --- LAYER 2: PAPER (ORIGINAL) --- */}
      <motion.div 
        style={{ width: maskWidth }}
        className="absolute inset-y-0 left-0 bg-[#1a1a1a] z-20 overflow-hidden border-r-2 border-primary/50"
      >
        <div className="absolute inset-0 w-[500px] flex items-center justify-center opacity-40">
           <div className="w-64 h-96 bg-white/10 rounded-sm shadow-inner flex flex-col p-6 space-y-4 rotate-2">
              <div className="h-4 w-3/4 bg-white/10 rounded" />
              <div className="h-4 w-1/2 bg-white/10 rounded" />
              <div className="flex-1 border-y border-white/5 my-4" />
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-2 w-full bg-white/5 rounded" />)}
              <div className="h-8 w-1/4 self-end bg-white/10 rounded mt-4" />
           </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className="flex flex-col items-center gap-4 text-white/20">
              <Receipt className="w-20 h-20" />
              <p className="font-outfit font-black uppercase text-xs tracking-widest">Paper Input</p>
           </div>
        </div>
      </motion.div>

      {/* --- LAYER 3: DRAG SLIDER --- */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 400 }}
        style={{ x }}
        className="absolute inset-y-0 left-0 w-1 z-30 cursor-ew-resize flex items-center justify-center"
      >
         <div className="h-full w-0.5 bg-primary/60 shadow-[0_0_20px_rgba(74,222,128,1)]" />
         <div className="absolute w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-transform">
            <Zap className="text-black w-6 h-6" />
         </div>
         <div className="absolute -top-10 bg-primary px-3 py-1 rounded-md text-[10px] font-black text-black uppercase tracking-tighter whitespace-nowrap">
            Drag to Scan
         </div>
      </motion.div>

      {/* Overlay Instructions */}
      <div className="absolute bottom-6 right-8 text-[10px] font-black uppercase tracking-widest text-white/20 select-none z-40">
         Tactile Interaction Demo
      </div>
    </div>
  );
};

export default ReceiptSlider;
