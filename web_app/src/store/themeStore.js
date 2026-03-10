import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set, get) => ({
      isDarkMode: false,
      sidebarCollapsed: false,

      toggleDarkMode: () => {
        set((state) => ({ isDarkMode: !state.isDarkMode }));
      },

      setDarkMode: (value) => {
        set({ isDarkMode: value });
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      setSidebarCollapsed: (value) => {
        set({ sidebarCollapsed: value });
      },
    }),
    {
      name: 'cncms-theme',
    }
  )
);
