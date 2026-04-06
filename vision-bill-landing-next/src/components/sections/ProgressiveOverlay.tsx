"use client";

import React from "react";
import { ArrowRight, Smartphone, Share2, Play } from "lucide-react";

export default function ProgressiveOverlay() {
  return (
    <div id="main-section" className="relative z-10 w-full">
      
      {/* Sequence 1: The Hook (0% - 20%) */}
      <section className="h-screen flex flex-col items-center justify-center text-center px-6">
        <div className="max-w-4xl">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-6">
                Urban Intelligence Stage
            </span>
            <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight tracking-tight text-[#0A0A0A]">
                Tired of the <br />
                <span className="text-primary italic">2-Foot Paper Trails?</span>
            </h1>
            <p className="text-xl md:text-2xl text-black/50 leading-relaxed font-medium max-w-2xl mx-auto">
                The D-Mart receipt ends here. VisionBill digitizes everything you buy, before you even unpack your bags.
            </p>
        </div>
      </section>

      {/* Sequence 2: The Transform (20% - 40%) */}
      <section className="h-screen flex flex-col items-center justify-center text-center px-6">
        <div className="max-w-4xl">
            <h2 className="text-5xl md:text-7xl font-black mb-8 leading-tight text-[#0A0A0A]">
                AI Vision for <br />
                <span className="text-primary">Retail Mess.</span>
            </h2>
            <p className="text-xl md:text-2xl text-black/50 leading-relaxed max-w-2xl mx-auto">
                We see past the shorthand. <br />
                <span className="text-black font-bold">ORG_TMT_1KG</span> becomes <span className="text-primary font-bold line-through">Organic Tomatoes</span>.
            </p>
        </div>
      </section>

      {/* Sequence 3: The Advantage (40% - 60%) */}
      <section className="h-screen flex flex-col items-center justify-center text-center px-6">
        <div className="max-w-4xl">
            <h2 className="text-5xl md:text-7xl font-black mb-8 leading-tight text-[#0A0A0A]">
                Unbagging Companion. <br />
                <span className="text-primary">Digital Pantry.</span>
            </h2>
            <p className="text-xl md:text-2xl text-black/50 leading-relaxed max-w-2xl mx-auto">
                Track price hikes automatically. Verify purchases instantly. Build a digital inventory of everything in your house.
            </p>
            <div className="mt-12 flex justify-center gap-6">
                 <div className="flex items-center gap-4 px-6 py-4 rounded-3xl glass backdrop-blur-3xl shadow-xl">
                    <div className="w-4 h-4 rounded-full bg-success animate-pulse" />
                    <span className="text-success font-black uppercase tracking-widest text-sm">Savings Identified: ₹2,105</span>
                 </div>
            </div>
        </div>
      </section>

      {/* Sequence 4: Social Loop (60% - 80%) */}
      <section className="h-screen flex flex-col items-center justify-center text-center px-6">
        <div className="max-w-4xl">
            <h2 className="text-5xl md:text-7xl font-black mb-8 leading-tight text-[#0A0A0A]">
                Frictionless Splitting. <br />
                <span className="text-primary">PhonePe Style.</span>
            </h2>
            <p className="text-xl md:text-2xl text-black/50 leading-relaxed max-w-2xl mx-auto">
                Itemized allocation. WhatsApp Deep Links. Split sharing so fast, it feels like magic.
            </p>
            <button className="mt-12 bg-[#25D366] text-white px-8 py-4 rounded-full font-black flex items-center gap-4 hover:scale-105 transition-transform">
                <Share2 className="w-6 h-6" />
                Share with Flatmates
            </button>
        </div>
      </section>

      {/* Sequence 5: CTA (80% - 100%) */}
      <section className="h-[120vh] flex flex-col items-center justify-center text-center px-6">
        <div className="max-w-4xl z-10">
            <h2 className="text-6xl md:text-9xl font-black mb-12 leading-tight tracking-[calc(-0.04em)] text-[#0A0A0A]">
                Ready for <br />
                Retail <span className="text-primary">Intelligence?</span>
            </h2>
            
            <div className="flex flex-wrap justify-center gap-8 mb-20">
                 <button className="h-20 w-64 bg-black text-white rounded-3xl flex items-center px-8 hover:bg-[#111] transition-all group active:scale-95">
                    <Smartphone className="w-8 h-8 mr-6 text-primary group-hover:rotate-12 transition-transform" />
                    <div className="text-left">
                       <p className="text-[10px] uppercase font-black opacity-40 mb-1">Available on</p>
                       <p className="text-xl font-bold">App Store</p>
                    </div>
                 </button>

                 <button className="h-20 w-64 bg-black text-white rounded-3xl flex items-center px-8 hover:bg-[#111] transition-all group active:scale-95">
                    <Play className="w-8 h-8 mr-6 text-primary group-hover:rotate-12 transition-transform" />
                    <div className="text-left">
                       <p className="text-[10px] uppercase font-black opacity-40 mb-1">Get it on</p>
                       <p className="text-xl font-bold">Google Play</p>
                    </div>
                 </button>
            </div>
            
            <a href="/" className="inline-flex items-center gap-4 text-black/40 hover:text-primary transition-all uppercase font-black text-xs tracking-[0.4em]">
                Explore Enterprise Solutions
                <ArrowRight className="w-6 h-6" />
            </a>
        </div>

        {/* Floating AI Glow Hub (Visual context for the App Icon) */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
             <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full animate-pulse" />
        </div>
      </section>
      
    </div>
  );
}
