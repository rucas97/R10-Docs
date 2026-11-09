import { UploadZone } from '@/components/chat/UploadZone';
import { DocwizeLogo } from '@/components/DocwizeLogo';

export default function NewChatPage() {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center bg-surface-lightMuted dark:bg-surface-dark">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-neutral-100 dark:bg-surface-aiBubbleDark shadow-sm border border-neutral-200 dark:border-neutral-800 mb-6">
            <DocwizeLogo className="w-10 h-10 text-gold-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white mb-3">
            یک PDF بارگذاری کنید
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            سند شما تحلیل می‌شود و می‌توانید درباره محتوای آن گفتگو کنید.
          </p>
        </div>

        <UploadZone />
      </div>
    </div>
  );
}
