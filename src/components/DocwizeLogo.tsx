import Image from 'next/image';

export function DocwizeLogo({ className = 'w-8 h-8' }: { className?: string }) {
  // Using the new icon image you uploaded
  return (
    <div className={`relative ${className}`}>
      <Image src="/logo-icon.png" alt="Docwize" fill className="object-contain" />
    </div>
  );
}
