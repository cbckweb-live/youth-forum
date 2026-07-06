import React from 'react';

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-md space-y-8">
        {"Are you ready? "}
        <div>
          <span className="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-full tracking-wider uppercase">
            Something Big is Coming
          </span>
        </div>

        {}
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            CBCK Youth Forum
          </h1>
          <p className="text-base text-slate-400 max-w-sm mx-auto">
            An exciting new platform for youth engagement. Stay tuned!
          </p>
        </div>

        {/* Event Details */}
        <div className="border-t border-slate-900 pt-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Official Launch Event</p>
          <p className="text-xl font-bold text-slate-200 mt-2">On 26 July 2026</p>
        </div>
      </div>
    </div>
  );
}