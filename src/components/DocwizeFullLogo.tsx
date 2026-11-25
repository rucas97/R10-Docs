import Image from 'next/image';

export function DocwizeFullLogo({ className = 'h-8 w-auto' }: { className?: string }) {
  // Using the full logo with text
  return (
    <div className={`relative ${className}`}>
      <Image src="/logo-full.png" alt="Docwize" fill className="object-contain" />
    </div>
  );
}
