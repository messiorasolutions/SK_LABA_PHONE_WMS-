export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-8 shadow-xl text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-emerald-400">
          SK LABA PHONE WMS
        </h1>
        <p className="text-slate-300">
          Warehouse Management System frontend initialized successfully.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Vite + React + Tailwind Ready
        </div>
      </div>
    </div>
  )
}
