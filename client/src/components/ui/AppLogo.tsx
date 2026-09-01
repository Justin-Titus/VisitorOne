interface AppLogoProps {
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export default function AppLogo({
  className = 'w-9 h-9',
  showText = false,
  textClassName = 'text-base font-bold',
}: AppLogoProps) {
  return (
    <div className="flex items-center gap-2.5 inline-flex select-none">
      <div className={`relative flex-shrink-0 ${className}`}>
        <img
          src="/favicon.svg"
          alt="VisitorOne Logo"
          className="w-full h-full object-contain drop-shadow-md transition-transform hover:scale-105"
        />
      </div>
      {showText && (
        <span className={`tracking-tight text-slate-900 dark:text-white ${textClassName}`}>
          Visitor<span className="text-indigo-600 dark:text-indigo-400 font-extrabold">One</span>
        </span>
      )}
    </div>
  );
}
