import Link from 'next/link';
import { DocwizeLogo } from '@/components/DocwizeLogo';
import { Phone, Mail } from 'lucide-react';

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] py-10 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
        
        {/* Brand & Copyright */}
        <div className="flex flex-col items-center justify-center gap-3 text-center flex-1">
          <Link href="/" className="flex flex-col items-center gap-2">
            <DocwizeLogo className="w-10 h-10 text-gold-500" />
            <span className="font-black text-xl text-neutral-900 dark:text-white tracking-tight">Docwize</span>
          </Link>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed mt-1">
            Docwize 2026 all rights reserved copyright
          </p>
        </div>

        {/* Thin Vertical Separator */}
        <div className="hidden md:block w-px h-24 bg-neutral-200 dark:bg-neutral-800"></div>

        {/* Contact Info */}
        <div className="flex flex-col items-center justify-center gap-4 text-sm text-neutral-600 dark:text-neutral-400 font-medium flex-1">
          <a href="tel:026961010965" className="flex items-center gap-3 hover:text-gold-500 transition-colors" dir="ltr">
            <Phone className="w-4 h-4 text-gold-500" /> 
            <span>026-961010965</span>
          </a>
          <a href="mailto:info@docwize.site" className="flex items-center gap-3 hover:text-gold-500 transition-colors" dir="ltr">
            <Mail className="w-4 h-4 text-gold-500" /> 
            <span>info@docwize.site</span>
          </a>
        </div>

        {/* Thin Vertical Separator */}
        <div className="hidden md:block w-px h-24 bg-neutral-200 dark:bg-neutral-800"></div>

        {/* E-Namad Trust Seal */}
        <div className="flex items-center justify-center flex-1">
          <a 
            referrerPolicy="origin" 
            target="_blank" 
            href="https://trustseal.enamad.ir/?id=8875749&Code=koT1M4z83FsbO6OHC0LpTb7cmuxjX9FL"
            className="block transition-transform hover:scale-105"
          >
            <img 
              referrerPolicy="origin" 
              src="https://trustseal.enamad.ir/logo.aspx?id=8875749&Code=koT1M4z83FsbO6OHC0LpTb7cmuxjX9FL" 
              alt="E-Namad Trust Seal" 
              style={{ cursor: 'pointer', width: '90px', height: 'auto' }} 
            />
          </a>
        </div>

      </div>
    </footer>
  );
}
