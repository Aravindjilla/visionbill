import React, { useRef, useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import { 
  motion, 
  useScroll, 
  useTransform, 
  useSpring, 
  useInView,
  AnimatePresence 
} from 'framer-motion';
import { 
  Camera, 
  Users, 
  Receipt, 
  TrendingUp, 
  Smartphone,
  ScanLine,
  ShieldCheck, 
  Zap,
  Menu,
  X,
  Plus,
  Star,
  Quote,
  ArrowRight
} from 'lucide-react';
import Tilt from './components/Tilt';
import VisionCursor from './components/VisionCursor';
import SavingsPulse3D from './components/SavingsPulse3D';
import { Suspense } from 'react';

// --- Components ---

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    return scrollY.onChange((latest) => setIsScrolled(latest > 50));
  }, [scrollY]);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'glass py-4' : 'py-8'}`}>
      <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
        <a href="/" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-4 cursor-pointer group relative z-[100]">
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-tr from-primary to-secondary blur-lg opacity-40 group-hover:opacity-80 transition-opacity" />
            <div className="relative w-12 h-12 bg-black border border-white/20 rounded-2xl flex items-center justify-center overflow-hidden">
               <img src="./logo.png" alt="VisionBill" className="w-10 h-10 object-contain" />
            </div>
          </div>
          <span className="font-outfit text-3xl font-black tracking-tight flex items-baseline">
            Vision<span className="text-primary">Bill</span>
          </span>
        </a>
        <div className="hidden md:flex items-center gap-10 text-sm font-bold tracking-wide">
          <a href="#solution" className="text-white/50 hover:text-white transition-colors">The Solution</a>
          <a href="#features" className="text-white/50 hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="text-white/50 hover:text-white transition-colors">Pricing</a>
          <a href="#pricing">
            <MagneticButton className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-full shadow-xl shadow-primary/20 transition-all active:scale-95">
              Get the App
            </MagneticButton>
          </a>
        </div>
        <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>
    </nav>
  );
};

const SectionHeading = ({ title, subtitle, badge }: { title: string, subtitle: string, badge?: string }) => (
  <div className="max-w-3xl mb-20">
    {badge && (
      <motion.span 
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-6"
      >
        {badge}
      </motion.span>
    )}
    <motion.h2 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      className="text-4xl md:text-6xl font-outfit font-extrabold mb-8 leading-tight"
    >
      {title}
    </motion.h2>
    <motion.p 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="text-xl text-white/50 leading-relaxed font-inter"
    >
      {subtitle}
    </motion.p>
  </div>
);

const MobileFrame = ({ children, className = "" }: any) => (
  <div className={`relative w-[300px] h-[610px] md:w-[340px] md:h-[700px] bg-[#050505] rounded-[3.5rem] border-[8px] border-[#1a1a1a] shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] overflow-hidden ${className} ring-1 ring-white/10 ring-inset`}>
    {/* Inner Titanium Bezel */}
    <div className="absolute inset-0 border-[4px] border-[#2a2a2a] rounded-[3rem] pointer-events-none z-50 shadow-inner" />
    
    {/* Dynamic Island */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-[1.5rem] z-[100] flex items-center justify-center border-x border-b border-white/5">
       <div className="w-8 h-1 bg-white/5 rounded-full" />
    </div>
    
    {/* Screen Glare Reflection */}
    <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent rotate-45 pointer-events-none z-10" />

    <div className="w-full h-full p-2 flex flex-col overflow-y-scroll hide-scrollbar scroll-smooth bg-black relative z-0">
       {children}
    </div>
  </div>
);

const DashboardMockup = () => (
  <div className="flex-1 bg-black p-4 pt-12 relative overflow-hidden">
    {/* Global HUD Header */}
    <div className="flex justify-between items-center mb-10 px-2">
      <div>
        <p className="text-[9px] text-white/30 uppercase font-black tracking-widest mb-1">Elite Perspective</p>
        <p className="text-2xl font-outfit font-black">Universe 👋</p>
      </div>
      <div className="relative group">
         <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-secondary blur-md opacity-40 group-hover:opacity-100 transition-opacity" />
         <div className="relative w-12 h-12 rounded-2xl bg-black border border-white/10 flex items-center justify-center font-black text-sm text-white">VB</div>
      </div>
    </div>
    
    {/* Elite Metrics Layer */}
    <div className="grid grid-cols-2 gap-4 mb-8">
      <div className="glass-elite p-5 rounded-[2rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-20"><TrendingUp size={14} /></div>
        <p className="text-[9px] uppercase text-white/30 font-black mb-1.5 tracking-tighter">Velocity</p>
        <p className="text-2xl font-black font-outfit">₹24,842</p>
        <div className="flex items-center gap-1.5 mt-2">
           <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
           <p className="text-[10px] text-red-500/80 font-black">+14.2%</p>
        </div>
      </div>
      <div className="glass-elite p-5 rounded-[2rem] border-primary/20 bg-primary/[0.02]">
        <div className="absolute top-0 right-0 p-2 opacity-40 text-primary"><ShieldCheck size={14} /></div>
        <p className="text-[9px] uppercase text-primary font-black mb-1.5 tracking-tighter">AI Savings</p>
        <p className="text-2xl font-black font-outfit text-primary">₹3,105</p>
        <p className="text-[9px] text-white/30 font-bold mt-2">Goal: 84% met</p>
      </div>
    </div>

    {/* Luminous Area Chart Mockup */}
    <div className="glass-elite p-6 rounded-[2.5rem] mb-8 overflow-hidden relative group">
       <div className="flex justify-between items-end mb-6">
          <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Spending Trend</p>
          <div className="flex gap-1">
             {[1,2,3,4,5,6].map(i => (
                <div key={i} className="w-1 rounded-full bg-white/5" style={{ height: Math.random() * 20 + 5 }} />
             ))}
          </div>
       </div>
       <div className="relative h-24 flex items-end gap-1.5 px-1">
          {/* Simulated Area Chart using Divs */}
          <div className="flex-1 bg-primary/20 rounded-t-lg h-[40%] transition-all hover:bg-primary/40" />
          <div className="flex-1 bg-primary/20 rounded-t-lg h-[60%] transition-all hover:bg-primary/40" />
          <div className="flex-1 bg-primary/40 rounded-t-lg h-[90%] transition-all hover:bg-primary/60 relative">
             <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(74,222,128,1)]" />
          </div>
          <div className="flex-1 bg-primary/20 rounded-t-lg h-[50%] transition-all hover:bg-primary/40" />
          <div className="flex-1 bg-primary/20 rounded-t-lg h-[75%] transition-all hover:bg-primary/40" />
       </div>
    </div>

    {/* Recent Activities List */}
    <div className="space-y-4 px-1">
       <div className="flex justify-between items-end px-1 mb-2">
          <p className="text-[9px] font-black uppercase text-white/20 tracking-[0.4em]">Activities</p>
          <span className="text-[9px] font-black text-primary uppercase tracking-tighter cursor-pointer">Intelligence Details</span>
       </div>
       {[
          { icon: 'R', title: 'Reliance Smart', time: 'Gemini Extracted', val: '₹842', glow: true },
          { icon: 'A', title: 'Adobe Cloud', time: 'Subscription', val: '₹4,200', glow: false }
       ].map((item, i) => (
          <div key={i} className={`glass-elite p-4 rounded-2xl flex justify-between items-center transition-all hover:bg-white/5 ${item.glow ? 'ring-1 ring-primary/20' : ''}`}>
             <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${item.glow ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/40'}`}>
                   {item.icon}
                </div>
                <div>
                   <p className="text-xs font-bold font-inter">{item.title}</p>
                   <p className="text-[9px] text-white/20 uppercase font-black tracking-tighter">{item.time}</p>
                </div>
             </div>
             <p className={`text-xs font-black ${item.glow ? 'text-primary' : ''}`}>{item.val}</p>
          </div>
       ))}
    </div>
  </div>
);

const ScannerMockup = () => (
  <div className="flex-1 bg-black relative flex flex-col items-center justify-center py-10 px-4">
    <div className="w-full max-w-[280px] space-y-8">
        <div className="flex justify-between items-center opacity-30 px-2">
            <ScanLine className="w-5 h-5 text-primary" />
            <div className="flex gap-1.5">
               <div className="w-1 h-3 bg-white/20 rounded-full" />
               <div className="w-1 h-5 bg-primary/40 rounded-full" />
               <div className="w-1 h-2 bg-white/20 rounded-full" />
            </div>
        </div>

        <div className="relative group">
           <div className="absolute -inset-1 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="w-full h-80 rounded-[2.5rem] glass-elite border-primary/20 relative overflow-hidden backdrop-blur-3xl">
                <div className="absolute inset-0 bg-primary/5" />
                <motion.div 
                  animate={{ top: ['0%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-20 bg-gradient-to-b from-transparent via-primary to-transparent z-10 shadow-[0_0_40px_rgba(74,222,128,0.8)]"
                />
                
                <div className="absolute inset-x-8 top-12 space-y-4">
                   {[1, 2, 3].map(i => (
                     <div key={i} className="h-2 w-full bg-white/10 rounded-full relative overflow-hidden">
                        <motion.div 
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                          className="absolute inset-0 bg-primary/40"
                        />
                     </div>
                   ))}
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full px-6">
                   <div className="px-6 py-3 rounded-full bg-black/60 backdrop-blur-3xl border border-white/10 flex items-center justify-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">Gemini-Vision v2.1</span>
                   </div>
                </div>
           </div>
        </div>
        
        <div className="space-y-3 px-1">
            <p className="text-[10px] font-black uppercase text-white/20 tracking-[0.2em] mb-4">Detected Entities</p>
            {[
              { label: 'Merchant', val: 'Starbucks Coffee' },
              { label: 'Total', val: '₹1,240.00' },
              { label: 'Tax ID', val: 'GSTIN24...' }
            ].map((item, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex justify-between items-center p-4 glass-elite rounded-2xl"
                >
                   <span className="text-[9px] font-bold text-white/30 uppercase">{item.label}</span>
                   <span className="text-[10px] font-black text-primary">{item.val}</span>
                </motion.div>
            ))}
        </div>
    </div>
  </div>
);



const FeatureRow = ({ title, description, icon: Icon, imageSide = 'right', specialComponent }: any) => {
  const ref = useRef(null);
  
  return (
    <div ref={ref} className={`flex flex-col ${imageSide === 'right' ? 'md:flex-row' : 'md:flex-row-reverse'} gap-32 items-center py-40`}>
       <motion.div 
         initial={{ opacity: 0, x: imageSide === 'right' ? -40 : 40 }}
         whileInView={{ opacity: 1, x: 0 }}
         transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
         className="flex-1 space-y-12"
       >
         <div className="relative group w-20 h-20">
            <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full opacity-40 group-hover:opacity-100 transition-opacity" />
            <div className="relative w-full h-full rounded-2xl bg-[#0a0a0a] border border-white/10 flex items-center justify-center shadow-2xl">
               <Icon className="text-primary w-10 h-10" />
            </div>
         </div>
         
         <div className="space-y-8">
            <h3 className="text-5xl md:text-7xl font-outfit font-black leading-[1.05] tracking-[-0.04em] text-white">
              {title}
            </h3>
            <p className="text-xl text-white/40 leading-relaxed font-inter font-medium max-w-lg">
              {description}
            </p>
         </div>

         <a href="#solution" className="inline-flex items-center gap-6 text-primary font-black uppercase text-[10px] tracking-[0.4em] hover:text-white transition-all group overflow-hidden">
            <span className="relative">
               Explore Intelligence
               <div className="absolute -bottom-1 left-0 w-0 h-[1px] bg-primary group-hover:w-full transition-all duration-500" />
            </span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-3 transition-transform" />
         </a>
       </motion.div>

       <Tilt className="flex-1 relative w-full">
         <div className="aspect-[4/3] bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 rounded-[4rem] glass-strong flex items-center justify-center p-2 overflow-hidden border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,1)]">
            {specialComponent ? (
              <div className="w-full h-full">
                <Suspense fallback={null}>
                  {specialComponent}
                </Suspense>
              </div>
            ) : (
              <div className="w-full h-full p-12 relative overflow-hidden group/card bg-black/20">
                {/* Animated Scanning Beam */}
                <motion.div 
                  animate={{ top: ['-20%', '120%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-40 bg-gradient-to-b from-transparent via-primary/10 to-transparent z-10 pointer-events-none"
                />

                <div className="space-y-6 opacity-60 group-hover/card:opacity-100 transition-opacity duration-700">
                  {/* Mock UI: Sidebar + Content */}
                  <div className="flex gap-6">
                    <div className="w-1/3 space-y-4">
                      <div className="h-12 w-full bg-white/10 rounded-2xl shimmer" />
                      <div className="h-44 w-full bg-white/5 rounded-2xl border border-white/5" />
                      <div className="h-12 w-full bg-white/5 rounded-2xl" />
                    </div>
                    <div className="flex-1 space-y-6">
                      <div className="h-48 w-full bg-primary/5 rounded-[2.5rem] border border-primary/10 flex items-center justify-center p-8">
                        <div className="w-full space-y-4">
                          <div className="h-4 w-3/4 bg-primary/20 rounded-full" />
                          <div className="h-4 w-1/2 bg-primary/20 rounded-full" />
                          <div className="h-12 w-full bg-white/5 rounded-2xl flex items-center px-4">
                             <div className="w-2 h-2 rounded-full bg-primary animate-pulse mr-3" />
                             <div className="h-2 w-1/2 bg-white/10 rounded-full" />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="h-28 bg-secondary/5 rounded-2xl border border-secondary/10" />
                        <div className="h-28 bg-white/5 rounded-2xl border border-white/5" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Hover Reveal Label */}
                <div className="absolute inset-x-0 bottom-0 py-8 bg-gradient-to-t from-black to-transparent flex items-center justify-center pointer-events-none">
                   <p className="font-outfit font-black text-sm uppercase tracking-[0.4em] text-white/40">Real-time Interface</p>
                </div>
              </div>
            )}
         </div>
         <div className={`absolute -inset-10 bg-gradient-to-tr from-primary/10 to-secondary/10 blur-[100px] rounded-full -z-10`} />
       </Tilt>
    </div>
  );
};

// --- Main App Component ---

import VisionPrism3D from './components/VisionPrism3D';
import FloatingPhysicalGoods from './components/FloatingPhysicalGoods';

// --- Main App Component ---

const App = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.1,
      lerp: 0.1,
      infinite: false,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const springScroll = useSpring(scrollYProgress, { stiffness: 200, damping: 50 });

  // Cinematic Parallax Transformation Layers
  const prismScale = useTransform(scrollYProgress, [0, 0.2], [1, 1.8]);
  const prismOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0.4]);
  const prismY = useTransform(scrollYProgress, [0, 0.3], [0, 200]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.1], [0, -100]);
  
  // Floating Reality Layer Parallax
  const layer1Y = useTransform(scrollYProgress, [0, 1], [0, -1000]);
  const layer2Y = useTransform(scrollYProgress, [0, 1], [0, -2000]);

  return (
    <div ref={containerRef} className="text-white selection:bg-primary/30 min-h-screen relative origin-center bg-[#020202]">
      {/* Cinematic Background Infrastructure */}
      <div className="fixed inset-0 z-0">
          <div className="bg-mesh">
             <div className="mesh-blob mesh-blob-1" />
             <div className="mesh-blob mesh-blob-2" />
          </div>
          <div className="grain-overlay opacity-40 shadow-inner" />
      </div>

      {/* Floating Reality Parallax Layers */}
      <motion.div style={{ y: layer1Y }} className="fixed inset-0 pointer-events-none z-[1]">
         <FloatingPhysicalGoods />
      </motion.div>
      <motion.div style={{ y: layer2Y }} className="fixed inset-0 pointer-events-none z-[2] opacity-50 blur-[2px]">
         <FloatingPhysicalGoods />
      </motion.div>

      <VisionCursor />
      <Navbar />

      {/* Hero: Cinematic Vision Prism Stage */}
      <section id="hero" className="relative h-[120vh] flex items-center justify-center overflow-hidden z-10">
        {/* Layer 1: The 3D Prism Centerpiece */}
        <motion.div 
           style={{ scale: prismScale, opacity: prismOpacity, y: prismY }}
           className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden"
        >
           <div className="w-full h-full max-w-7xl pt-20">
              <Suspense fallback={null}>
                 <VisionPrism3D />
              </Suspense>
           </div>
        </motion.div>

        {/* Layer 2: Typographic Impact Stage */}
        <div className="relative z-10 text-center px-6 max-w-7xl select-none pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-14 pointer-events-auto"
          >
            <span className="px-8 py-3 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-black uppercase tracking-[0.5em] text-primary backdrop-blur-3xl shadow-[0_0_40px_rgba(74,222,128,0.2)]">
               Vision AI — Release 2.5
            </span>
          </motion.div>
          
          <motion.div style={{ opacity: textOpacity, y: textY }} className="pointer-events-none">
            <h1 className="text-[6rem] md:text-[14rem] font-outfit font-black leading-[0.8] tracking-[-0.06em] mb-20 text-white relative">
              <span className="relative z-10">Digital</span> <br />
              <span className="text-gradient inline-block mix-blend-lighten relative">
                 Alchemy.
              </span>
            </h1>
            
            <p className="text-2xl text-white/30 max-w-3xl mx-auto leading-relaxed mb-16 font-inter font-medium tracking-tight">
               Turning physical receipts into intelligence with one tap. <br />
               Experience the absolute standard in mobile household scanning.
            </p>
          </motion.div>

          {/* conversion kinetic pods */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-8 mb-16"
          >
             <div className="group relative z-[100] perspective-1000 pointer-events-auto cursor-pointer">
                <MagneticButton className="h-20 w-60 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2rem] flex items-center px-8 transition-all hover:bg-white/5 active:scale-95 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]">
                   <Smartphone className="w-8 h-8 mr-6 text-primary group-hover:rotate-12 transition-transform" />
                   <div className="text-left">
                      <p className="text-[10px] uppercase font-black text-white/20 leading-none mb-1">Available on</p>
                      <p className="text-lg font-black text-white">App Store</p>
                   </div>
                </MagneticButton>
                <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-transparent opacity-0 group-hover:opacity-40 blur-xl transition-opacity animate-pulse-slow" />
             </div>

             <div className="group relative z-[100] perspective-1000 pointer-events-auto cursor-pointer">
                <MagneticButton className="h-20 w-60 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2rem] flex items-center px-8 transition-all hover:bg-white/5 active:scale-95 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]">
                   <Smartphone className="w-8 h-8 mr-6 text-secondary group-hover:rotate-12 transition-transform" />
                   <div className="text-left">
                      <p className="text-[10px] uppercase font-black text-white/20 leading-none mb-1">Get it on</p>
                      <p className="text-lg font-black text-white">Google Play</p>
                   </div>
                </MagneticButton>
                <div className="absolute -inset-1 bg-gradient-to-tr from-secondary to-transparent opacity-0 group-hover:opacity-40 blur-xl transition-opacity animate-pulse-slow" />
             </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="pointer-events-auto">
             <a href="#solution" className="inline-flex items-center gap-4 text-white/20 hover:text-white transition-all uppercase font-black text-[10px] tracking-[0.6em]">
                Enter The Core
                <ArrowRight className="w-5 h-5 animate-bounce-horizontal" />
             </a>
          </motion.div>
        </div>
      </section>

      {/* Feature Narrative Stage: Depth Scroll */}
      <section id="solution" className="relative z-10 bg-[#020202] py-40">
        <div className="max-w-7xl mx-auto px-8">
           <SectionHeading 
             badge="Intelligence Stage"
             title="Messy Paper. Clean Wisdom."
             subtitle="We've re-engineered the scanning experience to be completely kinetic. Watch your physical reality transform in real-time."
           />

           <div className="space-y-60">
              <FeatureRow 
                icon={Camera}
                title="Vision Prism Scan"
                description="Our refractive OCR engine identifies more than just prices. It builds a digital twin of every purchase, metadata intact, available across all your platforms instantly."
                imageSide="right"
                specialComponent={<MobileFrame><ScannerMockup /></MobileFrame>}
              />
              
              <FeatureRow 
                icon={TrendingUp}
                title="Economic Oracle"
                description="Predictive saving models that track brand inflation in your specific household. We alert you when your essentials fluctuate, before you even reach the checkout."
                imageSide="left"
                specialComponent={<SavingsPulse3D />}
              />

              <FeatureRow 
                icon={Users}
                title="Unified Households"
                description="Multiple devices, one intelligence. Household synchronization so perfect, it feels local. Share receipts and split bills with haptic visual confirmation."
                imageSide="right"
                specialComponent={<MobileFrame><DashboardMockup /></MobileFrame>}
              />
           </div>
        </div>
      </section>

      {/* Horizontal Scroll or Stat Count (AOS style) */}
      <section className="py-40 bg-white/5 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-8">
           <div className="grid md:grid-cols-4 gap-12 text-center">
             <StatItem value="1M+" label="Receipts Scanned" />
             <StatItem value="₹2Cr+" label="Savings Identified" />
             <StatItem value="50K+" label="Active Households" />
             <StatItem value="99.9%" label="AI Accuracy" />
           </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-40 px-8">
        <div className="max-w-7xl mx-auto">
           <div className="text-center mb-24">
              <MotiBadge text="User Love" />
              <h2 className="text-4xl md:text-6xl font-outfit font-black leading-tight">Mastering households everywhere.</h2>
           </div>
           <motion.div 
             variants={{
               hidden: { opacity: 0 },
               show: {
                 opacity: 1,
                 transition: { staggerChildren: 0.2 }
               }
             }}
             initial="hidden"
             whileInView="show"
             viewport={{ once: true }}
             className="grid md:grid-cols-3 gap-10"
           >
              <TestimonialCard 
                name="Aravind J."
                role="Co-living Resident"
                quote="The 'Shared Pantry' feature is a lifesaver. No more guessing who bought the milk last week."
              />
              <TestimonialCard 
                name="Sarah K."
                role="Family Manager"
                quote="I've identified ₹2,500 in brand price hikes over 3 months. VisionBill paid for itself instantly."
              />
              <TestimonialCard 
                name="Rajesh V."
                role="Frequent Shopper"
                quote="Fastest scanner I've ever used. The Gemini integration feels like it's reading my mind."
              />
           </motion.div>
        </div>
      </section>

      {/* FAQ: Addressing Intuitive Doubts */}
      <section className="py-20 px-8 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
           <h2 className="text-3xl font-outfit font-black mb-16 text-center">Frequently Asked Questions</h2>
           <div className="space-y-8">
              <FAQItem 
                q="Does it work with handwritten local bills?" 
                a="Yes! VisionBill is powered by Gemini 1.5 Flash, which has specialized vision models to handle messy, handwritten, or partially faded shop receipts." 
              />
              <FAQItem 
                q="Is my data safe?" 
                a="We use enterprise-grade encryption. Your receipt images are processed for extraction and then deleted from our cache after metadata storage." 
              />
              <FAQItem 
                q="How does 'Long Bill Mode' work?" 
                a="If your receipt is too long for one shot, you can take multiple overlapping segments. Our AI 'stitches' them together to create a single coherent bill." 
              />
           </div>
        </div>
      </section>

      {/* Pricing: The Story Finale */}
      <section id="pricing" className="py-40 px-8">
        <div className="max-w-7xl mx-auto">
          <SectionHeading 
            badge="The Final Choice"
            title="Invest in your focus."
            subtitle="Choose a plan that scales with your household. Whether you're tracking solo or managing a busy family home, we have a story for you."
          />

          <div className="grid md:grid-cols-3 gap-8">
             <SimplePricingCard 
                name="Casual"
                price="₹0"
                features={['5 Scans / mo', 'Personal Pantry', 'Basic History']}
                btnText="Start for Free"
             />
             <SimplePricingCard 
                primary
                name="Power User"
                price="₹49"
                features={['Unlimited Scans', 'Shared Households', 'Price Spike Alerts', 'AI Analytics']}
                btnText="Unlock Pro"
             />
             <SimplePricingCard 
                name="Family Lifetime"
                price="₹999"
                features={['Lifetime Access', 'Family Bundle', 'Early Beta Features', 'Direct Support']}
                btnText="Get Lifetime"
             />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-32 px-8 border-t border-white/5 bg-black">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-20">
            <div className="max-w-sm">
               <div className="flex items-center gap-3 mb-8">
                  <Receipt className="text-primary w-8 h-8" />
                  <span className="text-3xl font-outfit font-black">VisionBill</span>
               </div>
               <p className="text-white/40 leading-relaxed mb-10 text-lg">
                  Empowering households to master their spending via intelligent AI automation. 
               </p>
                <div className="flex gap-6">
                   <div 
                     onClick={() => alert("Launching on iOS & Android soon!")}
                     className="w-12 h-12 rounded-xl glass flex items-center justify-center hover:text-primary transition-colors cursor-pointer"
                   >
                     <Smartphone className="w-6 h-6" />
                   </div>
                   <div 
                     onClick={() => alert("Enterprise Security details available upon request.")}
                     className="w-12 h-12 rounded-xl glass flex items-center justify-center hover:text-primary transition-colors cursor-pointer"
                   >
                     <ShieldCheck className="w-6 h-6" />
                   </div>
                   <div 
                     onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                     className="w-12 h-12 rounded-xl glass flex items-center justify-center hover:text-primary transition-colors cursor-pointer"
                   >
                     <Zap className="w-6 h-6" />
                   </div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-20">
               <FooterLinkGroup title="App" links={['Features', 'Marketplace', 'Pricing']} />
               <FooterLinkGroup title="Company" links={['The Solution', 'Privacy', 'Support']} />
               <FooterLinkGroup title="Legal" links={['Terms', 'Security', 'GDPR']} />
            </div>
         </div>
      </footer>

      {/* Progress Bar */}
      <motion.div 
        style={{ scaleX: springScroll }} 
        className="fixed bottom-0 left-0 right-0 h-1.5 bg-primary origin-left z-[100]" 
      />
    </div>
  );
};

// --- Sub-components ---

const MotiBadge = ({ text }: { text: string }) => (
  <motion.span 
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-6"
  >
    {text}
  </motion.span>
);


const FAQItem = ({ q, a }: any) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div onClick={() => setOpen(!open)} className="glass rounded-3xl p-8 cursor-pointer group">
       <div className="flex justify-between items-center">
          <h4 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{q}</h4>
          <Plus className={`w-5 h-5 transition-transform duration-300 ${open ? 'rotate-45 text-primary' : 'text-white/40'}`} />
       </div>
       <AnimatePresence>
          {open && (
            <motion.div 
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
               <p className="text-white/40 leading-relaxed font-medium">{a}</p>
            </motion.div>
          )}
       </AnimatePresence>
    </div>
  );
};

const TestimonialCard = ({ name, role, quote }: any) => (
  <motion.div 
    whileHover={{ y: -10 }}
    className="glass p-12 rounded-[2.5rem] relative"
  >
     <Quote className="absolute top-8 right-8 w-12 h-12 text-white/5 opacity-20" />
     <div className="flex gap-1 mb-8">
        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
     </div>
     <p className="text-xl italic text-white/80 mb-10 leading-relaxed">"{quote}"</p>
     <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center font-black">
           {name[0]}
        </div>
        <div>
           <p className="font-bold">{name}</p>
           <p className="text-xs text-white/40 tracking-widest uppercase">{role}</p>
        </div>
     </div>
  </motion.div>
);


const DemoItem = ({ name, price, category, delay = 0, glow }: any) => (
  <motion.div 
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    className={`flex items-center justify-between p-4 glass-elite rounded-2xl transition-all hover:bg-white/5 ${glow ? 'bg-primary/[0.03] border-primary/20' : ''}`}
  >
     <div className="flex items-center gap-4 text-left">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black transition-colors ${glow ? 'bg-primary/20 text-primary' : 'bg-[#0a0a0a] text-white/30'}`}>
           {name[0]}
        </div>
        <div>
           <p className="text-xs font-bold leading-none mb-1.5">{name}</p>
           <p className="text-[9px] text-white/20 uppercase tracking-widest font-black">{category}</p>
        </div>
     </div>
     <p className={`text-xs font-black ${glow ? 'text-primary' : ''}`}>{price}</p>
  </motion.div>
);

const StatItem = ({ value, label }: any) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref}>
      <motion.h4 
        initial={{ opacity: 0, scale: 0.5 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        className="text-5xl md:text-7xl font-outfit font-black text-gradient mb-4"
      >
        {value}
      </motion.h4>
      <p className="text-white/40 font-bold uppercase tracking-widest text-xs">{label}</p>
    </div>
  );
};

const SimplePricingCard = ({ name, price, features, btnText, primary }: any) => (
  <Tilt className="h-full">
    <motion.div 
      whileHover={{ y: -10 }}
      className={`p-12 rounded-[3rem] glass flex flex-col h-full border-white/5 transition-all duration-500 ${primary ? 'bg-primary/5 ring-2 ring-primary/40' : 'hover:bg-white/5'}`}
    >
       <h4 className="text-lg font-bold text-white/50 mb-4">{name}</h4>
       <div className="flex items-baseline gap-2 mb-10">
          <span className="text-6xl font-outfit font-extrabold">{price}</span>
          {price !== '₹999' && <span className="text-white/20 text-xl">/mo</span>}
       </div>
       <ul className="space-y-6 mb-12 flex-1">
          {features.map((f: string) => (
            <li key={f} className="flex items-center gap-4 text-white/60 font-medium">
               <Plus className="w-5 h-5 text-primary" />
               {f}
            </li>
          ))}
       </ul>
       <button 
          onClick={() => alert("Redirecting to Purchase... VisionBill for Home is launching soon!")}
          className={`w-full py-5 rounded-2xl font-black text-lg transition-all active:scale-95 ${primary ? 'bg-white text-black' : 'border border-white/10 hover:bg-white/5'}`}
       >
          {btnText}
       </button>
    </motion.div>
  </Tilt>
);

const FooterLinkGroup = ({ title, links }: any) => (
  <div>
    <h5 className="text-xs font-black uppercase tracking-[0.2em] text-white/20 mb-8">{title}</h5>
    <ul className="space-y-5">
      {links.map((l: string) => {
        const href = `#${l.toLowerCase().replace(/\s+/g, '')}`;
        return (
          <li key={l}>
            <a href={href} className="text-white/40 hover:text-primary transition-colors cursor-pointer font-bold">
              {l}
            </a>
          </li>
        );
      })}
    </ul>
  </div>
);

const MagneticButton = ({ children, className }: any) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.1, y: middleY * 0.1 });
  };

  const reset = () => setPosition({ x: 0, y: 0 });

  const { x, y } = position;

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x, y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
    >
      <button className={className}>
        {children}
      </button>
    </motion.div>
  );
};

export default App;
