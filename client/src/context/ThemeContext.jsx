import { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('vpms-theme');
    return saved || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.add('theme-transition');
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('vpms-theme', theme);

    const timer = setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 300);

    return () => clearTimeout(timer);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
