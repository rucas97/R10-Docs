export function DocwizeLogo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6C4 4.89543 4.89543 4 6 4H8V20H6C4.89543 20 4 19.1046 4 18V6Z" fill="currentColor"/>
      <path d="M10 4C10 2.89543 10.8954 2 12 2H14V22H12C10.8954 22 10 21.1046 10 20V4Z" fill="currentColor"/>
      <path d="M16 2C16 0.895431 16.8954 0 18 0H20C21.1046 0 22 0.895431 22 2V22C22 23.1046 21.1046 24 20 24H18C16.8954 24 16 23.1046 16 22V2Z" fill="currentColor"/>
    </svg>
  );
}
