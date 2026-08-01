import React from 'react';

export default function Spinner({ fullscreen = false, message = "Loading..." }) {
  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-white/30 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="text-white font-medium bg-slate-800/90 px-4 py-1.5 rounded-full shadow-md text-sm">
          {message}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-2 w-full h-full min-h-[200px]">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      <span className="text-sm font-medium text-slate-500">{message}</span>
    </div>
  );
}