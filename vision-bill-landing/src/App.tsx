import React from 'react';
import { motion } from 'framer-motion';
import { 
  Camera, 
  Smartphone, 
  Users, 
  Receipt, 
  TrendingUp, 
  ShieldCheck, 
  Zap,
  Download,
  Menu,
  X,
  Plus
} from 'lucide-react';

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen font-inter scroll-smooth">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Receipt className="text-white w-6 h-6" />
            </div>
            <span className="font-outfit text-2xl font-extrabold tracking-tight">VisionBill</span>
          </div>

          <div className="hidden md:flex items-center gap-10 text-sm font-medium text-white/70">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="https://visionbill.vercel.app/privacy" className="hover:text-white transition-colors">Privacy</a>
            <button className="bg-white text-black px-6 py-2.5 rounded-full font-bold hover:bg-white/90 transition-all active:scale-95">
              Download Now
            </button>
          </div>

          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden absolute top-20 w-full glass p-6 border-b border-white/10"
          >
            <div className="flex flex-col gap-6 text-center">
              <a href="#features" onClick={() => setIsMenuOpen(false)}>Features</a>
              <a href="#pricing" onClick={() => setIsMenuOpen(false)}>Pricing</a>
              <button className="bg-primary text-white p-4 rounded-xl font-bold">Download App</button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-48 pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-8"
            >
              🚀 AI-Powered Receipt Tracking 2.0
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-outfit font-extrabold leading-[1.1] mb-8"
            >
              Scan. Split. <br />
              <span className="text-gradient">Save Smarter.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-white/60 mb-10 leading-relaxed max-w-xl"
            >
              VisionBill uses state-of-the-art AI to itemize your grocery receipts, track price hikes, and manage shared household expenses—all in real-time.
            </motion.p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button className="w-full sm:w-auto bg-primary text-white px-10 py-5 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 hover:bg-primary-light transition-all active:scale-95 group">
                Download for iOS
                <Smartphone className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="w-full sm:w-auto glass text-white px-10 py-5 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-3 hover:bg-white/10 transition-all">
                Download for Android
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 relative">
            <motion.div 
              initial={{ opacity: 0, rotate: 10, scale: 0.8 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative z-10 w-[300px] md:w-[350px] mx-auto rounded-[3rem] border-8 border-[#333] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden bg-black"
            >
              {/* Fake App Mockup */}
              <div className="p-6 pt-12">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <p className="text-white/40 text-xs">Total Spend</p>
                    <p className="text-2xl font-outfit font-bold">₹4,250.00</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/20" />
                </div>
                
                <div className="glass rounded-2xl p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <Receipt className="text-primary w-5 h-5" />
                    <div>
                      <p className="text-sm font-bold">Grocery Scan</p>
                      <p className="text-[10px] text-white/40">2 mins ago • Itemized</p>
                    </div>
                    <p className="ml-auto text-sm font-bold text-green-400">+₹1,240</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="h-12 w-full bg-white/5 rounded-xl animate-pulse" />
                  <div className="h-12 w-full bg-white/5 rounded-xl animate-pulse" />
                  <div className="h-20 w-full bg-primary/20 rounded-2xl border border-primary/20 flex items-center justify-center">
                    <TrendingUp className="text-primary w-8 h-8 animate-float" />
                  </div>
                </div>
              </div>
            </motion.div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 bg-[#0c0c0e]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-outfit font-extrabold mb-6">Built for the modern household.</h2>
            <p className="text-lg text-white/40 max-w-2xl mx-auto">Stop guessing where your money goes. VisionBill does the heavy lifting so you can focus on saving.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Camera className="w-8 h-8 text-blue-400" />}
              title="Instant OCR"
              description="Our AI identifies items, quantities, and prices from receipts in seconds. No more manual entry."
            />
            <FeatureCard 
              icon={<Users className="w-8 h-8 text-purple-400" />}
              title="Shared Pantries"
              description="Collaborate with roommates or family members. See what's in stock and who bought what."
            />
            <FeatureCard 
              icon={<Zap className="w-8 h-8 text-yellow-400" />}
              title="Price Spike Alerts"
              description="Get notified if your favorite brands are getting more expensive. Track historical trends."
            />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 border-y border-white/5 bg-black/40">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center items-center gap-10 md:gap-20 opacity-30 invert">
          <Receipt className="w-24 md:w-32" />
          <Smartphone className="w-24 md:w-32" />
          <Zap className="w-24 md:w-32" />
          <ShieldCheck className="w-24 md:w-32" />
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 text-white">
            <h2 className="text-4xl md:text-5xl font-outfit font-extrabold mb-6">Simple, fair pricing.</h2>
            <p className="text-lg text-white/40">Choose the plan that fits your life.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="glass rounded-[2.5rem] p-10 border-white/5">
              <h3 className="text-xl font-bold mb-2">Essential</h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-extrabold">₹0</span>
                <span className="text-white/40">/mo</span>
              </div>
              <ul className="space-y-4 mb-10">
                <PricingItem text="5 Managed Bill Scans/mo" active />
                <PricingItem text="Personal Pantry Tracker" active />
                <PricingItem text="Basic Price History" active />
                <PricingItem text="Shared Expenses" active={false} />
                <PricingItem text="Premium OCR Engine" active={false} />
              </ul>
              <button className="w-full py-4 rounded-2xl border border-white/10 font-bold hover:bg-white/5 transition-all">
                Download Free
              </button>
            </div>

            {/* Pro Plan */}
            <div className="relative p-10 rounded-[2.5rem] overflow-hidden group">
              <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/30 transition-all" />
              <div className="absolute inset-0 border-2 border-primary/50 rounded-[2.5rem]" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold">Pro Edition</h3>
                  <span className="bg-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white">Most Popular</span>
                </div>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-extrabold">₹49</span>
                  <span className="text-white/60">/mo</span>
                </div>
                <ul className="space-y-4 mb-10">
                  <PricingItem text="Unlimited Bill Scans" active pro />
                  <PricingItem text="Unlimited Shared Pantries" active pro />
                  <PricingItem text="Predictive Spending Analytics" active pro />
                  <PricingItem text="Export to Excel & PDF" active pro />
                  <PricingItem text="Priority AI Processing" active pro />
                </ul>
                <button className="w-full py-4 rounded-2xl bg-white text-black font-extrabold shadow-xl hover:scale-[1.02] transition-all active:scale-95">
                  Get Pro Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 text-white/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
            <div>
              <div className="flex items-center gap-3 mb-6 text-white">
                <Receipt className="w-6 h-6 text-primary" />
                <span className="font-outfit text-xl font-bold">VisionBill</span>
              </div>
              <p className="max-w-xs mb-8">
                Helping modern households master their spending through AI.
              </p>
              <div className="flex gap-6">
                <Smartphone className="w-5 h-5 hover:text-white transition-colors cursor-pointer" />
                <TrendingUp className="w-5 h-5 hover:text-white transition-colors cursor-pointer" />
                <ShieldCheck className="w-5 h-5 hover:text-white transition-colors cursor-pointer" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
              <FooterGroup title="Product" items={['Features', 'Pricing', 'Download']} />
              <FooterGroup title="Legal" items={['Privacy', 'Terms', 'Security']} />
              <FooterGroup title="Connect" items={['Support', 'Twitter', 'Instagram']} />
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-white/5 text-center text-xs">
            © 2026 VisionBill App. All rights reserved. Precise receipt extraction powered by Gemini 1.5 Flash.
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: any) => (
  <motion.div 
    whileHover={{ y: -10 }}
    className="glass p-10 rounded-[2.5rem] border-white/5"
  >
    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-8">
      {icon}
    </div>
    <h3 className="text-2xl font-bold font-outfit mb-4">{title}</h3>
    <p className="text-white/40 leading-relaxed text-sm">{description}</p>
  </motion.div>
);

const PricingItem = ({ text, active, pro }: any) => (
  <li className="flex items-center gap-3 text-sm">
    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${active ? (pro ? 'bg-white' : 'bg-primary') : 'bg-white/10'}`}>
      {active && <Plus className={`w-3 h-3 ${pro ? 'text-black' : 'text-white'}`} />}
    </div>
    <span className={active ? 'text-white' : 'text-white/20'}>{text}</span>
  </li>
);

const FooterGroup = ({ title, items }: any) => (
  <div>
    <h4 className="text-white font-bold text-sm mb-6 uppercase tracking-widest">{title}</h4>
    <ul className="space-y-4">
      {items.map((item: any) => (
        <li key={item} className="hover:text-white transition-colors cursor-pointer text-sm font-medium">{item}</li>
      ))}
    </ul>
  </div>
);

export default App;
