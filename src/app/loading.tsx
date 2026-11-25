export default function Loading() {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-neutral-500 animate-pulse">در حال بارگذاری...</p>
      </div>
    </div>
  );
}
