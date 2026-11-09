import { UploadZone } from '@/components/chat/UploadZone';
import { DocwizeLogo } from '@/components/DocwizeLogo';

export default function NewChatPage() {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8 flex flex-col items-center">
          <DocwizeLogo className="w-16 h-16 text-gold-500 mb-4" />
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
