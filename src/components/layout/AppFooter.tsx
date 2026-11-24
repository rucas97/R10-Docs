import Link from 'next/link';
import { DocwizeLogo } from '@/components/DocwizeLogo';
import { Phone, Mail } from 'lucide-react';

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-surface-cardDark py-10 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Brand & Copyright */}
        <div className="flex flex-col items-center md:items-start gap-3 text-center md:text-right">
          <Link href="/" className="flex items-center gap-2">
            <DocwizeLogo className="w-8 h-8 text-gold-500" />
            <span className="font-black text-lg text-neutral-900 dark:text-white">Docwize</span>
          </Link>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Docwize 2026 all rights reserved copy right
          </p>
        </div>

        {/* Contact Info */}
        <div className="flex flex-col items-center md:items-start gap-3 text-sm text-neutral-600 dark:text-neutral-400 font-medium">
          <a href="tel:026961010965" className="flex items-center gap-2 hover:text-gold-500 transition" dir="ltr">
            <Phone className="w-4 h-4 text-gold-500" /> 026961010965
          </a>
          <a href="mailto:info@docwize.site" className="flex items-center gap-2 hover:text-gold-500 transition" dir="ltr">
            <Mail className="w-4 h-4 text-gold-500" /> info@docwize.site
          </a>
        </div>

        {/* E-Namad Trust Seal */}
        <div className="flex flex-col items-center justify-center">
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
              style={{ cursor: 'pointer', width: '80px', height: 'auto' }} 
            />
          </a>
        </div>

      </div>
    </footer>
  );
}
