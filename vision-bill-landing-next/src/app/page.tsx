import VisionBillImmersiveScene from "@/components/VisionBillImmersiveScene";
import ProgressiveOverlay from "@/components/sections/ProgressiveOverlay";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      {/* Fixed 3D Perspective Stage */}
      <VisionBillImmersiveScene />

      {/* Scrolling Text Layer */}
      <div className="relative">
         <ProgressiveOverlay />
      </div>

      {/* Global Brand Navigation Overlay */}
      <nav className="fixed top-0 left-0 right-0 p-8 flex justify-between items-center z-50 pointer-events-none">
         <div className="flex items-center gap-4 pointer-events-auto cursor-pointer">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-black/5">
                <img src="/logo.png" alt="VisionBill" className="w-8 h-8 object-contain" />
            </div>
            <span className="text-2xl font-black tracking-tight text-[#0A0A0A]">Vision<span className="text-primary italic">Bill</span></span>
         </div>
         
         <div className="hidden md:flex gap-10 text-[10px] uppercase font-black tracking-[0.2em] pointer-events-auto">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#intelligence" className="hover:text-primary transition-colors">Intelligence</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
            <button className="bg-primary text-white px-6 py-2.5 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-all">Download App</button>
         </div>
      </nav>

      {/* Sticky Bottom Progress indicator */}
      <div className="fixed bottom-0 left-0 right-0 p-12 flex justify-end pointer-events-none z-50">
          <div className="flex items-center gap-6">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-black/20">The Indian Retail Revolution</span>
              <div className="w-20 h-[1px] bg-black/10" />
          </div>
      </div>
    </main>
  );
}

