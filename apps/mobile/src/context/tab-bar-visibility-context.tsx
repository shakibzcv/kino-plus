import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface TabBarVisibilityContextType {
  isTabBarVisible: boolean;
  hideTabBar: () => void;
  showTabBar: () => void;
}

const TabBarVisibilityContext = createContext<TabBarVisibilityContextType | undefined>(undefined);

export function TabBarVisibilityProvider({ children }: { children: ReactNode }) {
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);

  const hideTabBar = useCallback(() => {
    setIsTabBarVisible(false);
  }, []);

  const showTabBar = useCallback(() => {
    setIsTabBarVisible(true);
  }, []);

  return (
    <TabBarVisibilityContext.Provider value={{ isTabBarVisible, hideTabBar, showTabBar }}>
      {children}
    </TabBarVisibilityContext.Provider>
  );
}

export function useTabBarVisibility() {
  const context = useContext(TabBarVisibilityContext);
  if (!context) {
    throw new Error('useTabBarVisibility must be used within TabBarVisibilityProvider');
  }
  return context;
}
