import { UploadZone } from '@/components/chat/UploadZone';
import { Sparkles } from 'lucide-react';

export default function NewChatPage() {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">
            یک PDF بارگذاری کنید
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            سند شما تحلیل می‌شود و می‌توانید درباره محتوای آن گفتگو کنید.
          </p>
        </div>

        <UploadZone />
      </div>
    </div>
  );
}
