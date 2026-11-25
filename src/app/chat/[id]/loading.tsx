export default function ChatLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-surface-canvas dark:bg-surface-canvasDark">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-brand-cobalt border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-neutral-500">در حال بارگذاری گفتگو...</p>
      </div>
    </div>
  );
}
