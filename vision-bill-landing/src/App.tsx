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
  ShieldCheck, 
  Zap,
  Menu,
  X,
  Plus,
  ChevronDown,
  Star,
  Quote
} from 'lucide-react';

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
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-tr from-primary to-secondary blur-lg opacity-40 group-hover:opacity-80 transition-opacity" />
            <div className="relative w-12 h-12 bg-black border border-white/10 rounded-2xl flex items-center justify-center overflow-hidden">
               <img src="/logo.png" alt="VisionBill" className="w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
            </div>
          </div>
          <span className="font-outfit text-3xl font-black tracking-tight flex items-baseline">
            Vision<span className="text-primary">Bill</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-10 text-sm font-bold tracking-wide">
          <a href="#solution" className="text-white/50 hover:text-white transition-colors">The Solution</a>
          <a href="#features" className="text-white/50 hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="text-white/50 hover:text-white transition-colors">Pricing</a>
          <MagneticButton className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-full shadow-xl shadow-primary/20 transition-all active:scale-95">
            Get the App
          </MagneticButton>
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
      className="text-xl text-white/40 leading-relaxed"
    >
      {subtitle}
    </motion.p>
  </div>
);

const FeatureRow = ({ title, description, icon: Icon, imageSide = 'right' }: any) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  return (
    <div ref={ref} className={`flex flex-col ${imageSide === 'right' ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-20 py-32`}>
      <motion.div 
        className="flex-1"
        initial={{ opacity: 0, x: imageSide === 'right' ? -50 : 50 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-8">
          <Icon className="text-primary w-8 h-8" />
        </div>
        <h3 className="text-3xl md:text-5xl font-outfit font-bold mb-6">{title}</h3>
        <p className="text-lg text-white/50 leading-relaxed mb-8">{description}</p>
        <div className="flex items-center gap-4 text-primary font-bold cursor-pointer group">
          Learn how it works 
          <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
        </div>
      </motion.div>

      <motion.div 
        className="flex-1 relative"
        initial={{ opacity: 0, scale: 0.8, rotate: imageSide === 'right' ? 5 : -5 }}
        animate={isInView ? { opacity: 1, scale: 1, rotate: 0 } : {}}
        transition={{ duration: 1, ease: "circOut" }}
      >
        <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 rounded-[3rem] glass flex items-center justify-center p-12 overflow-hidden">
          <motion.div 
            animate={{ y: isInView ? [0, -20, 0] : 0 }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-full h-full bg-white/5 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden"
          >
             <div className="absolute top-0 left-0 w-full h-2 bg-primary/20" />
             <div className="p-8 space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-4 w-full bg-white/5 rounded-full" />
                ))}
                <div className="h-32 w-full bg-primary/10 rounded-2xl border border-primary/20 flex items-center justify-center">
                   <div className="w-12 h-12 rounded-full border-2 border-primary border-dashed animate-spin" />
                </div>
             </div>
          </motion.div>
        </div>
        <div className={`absolute -inset-20 bg-primary/10 blur-[100px] rounded-full -z-10`} />
      </motion.div>
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      infinite: false,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);
  const rotate = useTransform(scrollYProgress, [0, 0.2], [0, -5]);
  const opacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  
  const springScroll = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <div ref={containerRef} className="text-white selection:bg-primary/30 min-h-screen">
      <Navbar />

      {/* Hero: Parallax Zoom Out */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.div 
          style={{ scale, rotate }}
          className="relative z-20 text-center px-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <span className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-black uppercase tracking-[0.3em] text-white/60">
              The Future of Receipts
            </span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-[9.5rem] font-outfit font-extrabold leading-[0.85] tracking-tighter mb-12"
          >
            Scan. <br />
            <motion.span 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="text-gradient inline-block"
            >
              Simplify.
            </motion.span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-white/40 max-w-2xl mx-auto leading-relaxed mb-12 font-medium"
          >
            VisionBill transforms chaotic receipt piles into structured digital insights using the power of AI.
          </motion.p>
          <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: 0.3 }}
             className="flex justify-center"
          >
             <MagneticButton className="bg-white text-black px-12 py-5 rounded-2xl font-black text-lg shadow-[0_20px_50px_rgba(25,25,25,0.15)] hover:scale-105 active:scale-95 transition-all">
                Get Started for Free
             </MagneticButton>
          </motion.div>
        </motion.div>

        {/* Parallax Background Elements */}
        <motion.div 
           className="absolute top-1/2 left-0 w-full text-[25vw] font-black pointer-events-none opacity-[0.02] select-none leading-none -translate-y-1/2 whitespace-nowrap"
           style={{ x: useTransform(scrollYProgress, [0, 1], [100, -1000]) }}
        >
          VISIONBILL INTELLIGENCE
        </motion.div>

        <motion.div style={{ opacity }} className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/20 animate-bounce">
           <ChevronDown className="w-8 h-8" />
        </motion.div>
        
        <div className="absolute inset-0 z-10 pointer-events-none">
           <motion.div 
             animate={{ y: [0, -50, 0], x: [0, 30, 0] }}
             transition={{ duration: 20, repeat: Infinity }}
             className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#4ade80]/10 blur-[150px] rounded-full" 
           />
           <motion.div 
             animate={{ y: [0, 50, 0], x: [0, -30, 0] }}
             transition={{ duration: 15, repeat: Infinity }}
             className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-[#38bdf8]/10 blur-[150px] rounded-full" 
           />
        </div>
      </section>

      {/* Shared Pantry Highlight with Scroll Scale */}
      <section className="relative overflow-hidden">
         <motion.div 
           initial={{ opacity: 0, scale: 0.8 }}
           whileInView={{ opacity: 1, scale: 1 }}
           transition={{ duration: 1.5, ease: "circOut" }}
           className="max-w-7xl mx-auto px-8 py-60 text-center"
         >
            <h2 className="text-5xl md:text-8xl font-outfit font-black mb-12">The last scanner <br /> you'll ever need.</h2>
            <div className="flex flex-wrap justify-center gap-12 mt-20 opacity-30">
               <Smartphone size={100} />
               <Receipt size={100} />
               <TrendingUp size={100} />
               <Users size={100} />
            </div>
         </motion.div>
      </section>

      {/* The Solution Section: Fade in Content */}
      <section id="solution" className="max-w-7xl mx-auto px-8 py-32">
        <SectionHeading 
          badge="The Solution"
          title="From paper waste to digital wisdom."
          subtitle="We didn't just build a scanner. We built a bridge between your physical purchases and your digital future."
        />

        {/* Live Interactive Demo Section */}
        <section className="mb-40">
           <div className="grid md:grid-cols-2 gap-20 items-center">
              <div className="relative group">
                 <div className="absolute -inset-10 bg-primary/20 blur-[100px] rounded-full group-hover:bg-primary/30 transition-all opacity-0 group-hover:opacity-100" />
                 <motion.div 
                   whileHover={{ scale: 1.02 }}
                   className="glass rounded-[2.5rem] p-1 border-white/10"
                 >
                    <LiveDemo />
                 </motion.div>
              </div>
              <div>
                 <MotiBadge text="Try the Magic" />
                 <h3 className="text-4xl md:text-5xl font-outfit font-black mb-8 leading-tight">Seeing is believing.</h3>
                 <p className="text-xl text-white/40 leading-relaxed mb-10">
                    Interact with our live preview to see how VisionBill itemizes a chaotic grocery receipt into a structured digital record in under 2 seconds.
                 </p>
                 <div className="flex flex-col gap-6">
                    <BenefitRow icon={<Zap className="text-yellow-400" />} text="99% OCR accuracy on handwritten or faded bills." />
                    <BenefitRow icon={<ShieldCheck className="text-blue-400" />} text="Privacy first: Extraction happens in secure cloud isolated from your personal ID." />
                 </div>
              </div>
           </div>
        </section>

        <motion.div 
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.3
              }
            }
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="space-y-20"
        >
          <FeatureRow 
            icon={Camera}
            title="Visionary OCR"
            description="Our advanced OCR (Optical Character Recognition) engine doesn't just read text—it understands context. It knows the difference between a pack of milk and a milk-based dessert, categorizing your life automatically."
            imageSide="right"
          />
          <FeatureRow 
            icon={Users}
            title="Unified Households"
             description="Living together shouldn't be about tracking who owes who. Shared pantries and bill splitting are baked into the core experience, making household management invisible."
            imageSide="left"
          />
          <FeatureRow 
            icon={TrendingUp}
            title="Predictive Savings"
            description="Our AI tracks price history across thousands of users. We'll warn you if your favorite brands are hiking prices, suggest cheaper alternatives, and predict your monthly spend before it happens."
            imageSide="right"
          />
        </motion.div>
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
                  <div className="w-12 h-12 rounded-xl glass flex items-center justify-center hover:text-primary transition-colors cursor-pointer"><Smartphone className="w-6 h-6" /></div>
                  <div className="w-12 h-12 rounded-xl glass flex items-center justify-center hover:text-primary transition-colors cursor-pointer"><ShieldCheck className="w-6 h-6" /></div>
                  <div className="w-12 h-12 rounded-xl glass flex items-center justify-center hover:text-primary transition-colors cursor-pointer"><Zap className="w-6 h-6" /></div>
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

const BenefitRow = ({ icon, text }: any) => (
  <div className="flex gap-4 items-start">
    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 mt-1">
      {icon}
    </div>
    <p className="text-white/60 text-lg leading-relaxed">{text}</p>
  </div>
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

const LiveDemo = () => {
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanned, setScanned] = React.useState(false);
  
  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScanned(true);
    }, 2000);
  };

  return (
    <div className="p-8 min-h-[500px] flex flex-col">
       <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-2xl">
               <Camera className="text-white" />
            </div>
            <h4 className="text-xl font-black font-outfit">Live OCR Demo</h4>
          </div>
          <button 
             onClick={() => { setScanned(false); handleScan(); }}
             className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-xs font-black uppercase transition-all"
          >
             Reset Simulation
          </button>
       </div>

       <div className="flex-1 rounded-3xl bg-black/40 border border-white/5 p-8 flex flex-col relative overflow-hidden">
          {isScanning && (
            <motion.div 
              initial={{ top: -10 }}
              animate={{ top: '100%' }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent z-10 shadow-[0_0_20px_rgba(74,222,128,0.8)]"
            />
          )}

          {!scanned && !isScanning ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
               <Receipt className="w-20 h-20 text-white/10 mb-8" />
               <p className="text-lg font-bold text-white/50 mb-8">Place a messy receipt to see the magic.</p>
               <button 
                 onClick={handleScan}
                 className="bg-primary text-white px-10 py-5 rounded-2xl font-black shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
               >
                 Simulation: Scan Receipt
               </button>
            </div>
          ) : (
             <AnimatePresence mode="wait">
               {isScanning ? (
                 <motion.div 
                   key="loading" 
                   initial={{ opacity: 0 }} 
                   animate={{ opacity: 1 }} 
                   exit={{ opacity: 0 }}
                   className="flex-1 flex flex-col items-center justify-center"
                 >
                    <div className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-8" />
                    <p className="text-primary font-black uppercase tracking-widest text-xs">Analyzing pixels...</p>
                 </motion.div>
               ) : (
                 <motion.div 
                   key="results"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="space-y-4"
                 >
                    <div className="flex justify-between items-end mb-8">
                       <div>
                          <p className="text-xs text-white/30 font-black uppercase mb-1">Merchant Found</p>
                          <p className="text-2xl font-outfit font-black">Reliance Smart</p>
                       </div>
                       <p className="text-2xl font-outfit font-black text-green-400">₹842.50</p>
                    </div>
                    <DemoItem name="Amul Gold Milk 500ml" price="₹33.00" category="Dairy" />
                    <DemoItem name="Taj Mahal Tea 250g" price="₹210.00" category="Beverages" />
                    <DemoItem name="Maggi 2-Minute Noodles (6-pack)" price="₹168.00" category="Packaged" delay={0.1} />
                    <DemoItem name="Potatoes (2kg)" price="₹48.00" category="Vegetables" delay={0.2} />
                    <DemoItem name="Central GST (9%)" price="₹42.50" category="Taxes" delay={0.3} />
                 </motion.div>
               )}
             </AnimatePresence>
          )}
       </div>
    </div>
  );
};

const DemoItem = ({ name, price, category, delay = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    className="flex items-center justify-between p-4 glass rounded-xl border-white/5"
  >
     <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black">
           {name[0]}
        </div>
        <div>
           <p className="text-sm font-bold">{name}</p>
           <p className="text-[10px] text-white/30 uppercase tracking-widest font-black">{category}</p>
        </div>
     </div>
     <p className="text-sm font-black">{price}</p>
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
     <button className={`w-full py-5 rounded-2xl font-black text-lg transition-all active:scale-95 ${primary ? 'bg-white text-black' : 'border border-white/10 hover:bg-white/5'}`}>
        {btnText}
     </button>
  </motion.div>
);

const FooterLinkGroup = ({ title, links }: any) => (
  <div>
    <h5 className="text-xs font-black uppercase tracking-[0.2em] text-white/20 mb-8">{title}</h5>
    <ul className="space-y-5">
      {links.map((l: string) => (
        <li key={l} className="text-white/40 hover:text-primary transition-colors cursor-pointer font-bold">{l}</li>
      ))}
    </ul>
  </div>
);

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
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
