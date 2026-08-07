export default function Loader({ size = 'md', text = 'Loading...' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <div className={`${sizeClasses[size]} border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin`} />
      {text && <p className="text-xs font-medium text-slate-500 dark:text-slate-400 font-mono tracking-wide">{text}</p>}
    </div>
  );
}
