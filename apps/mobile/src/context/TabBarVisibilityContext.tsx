import { createContext, useContext, useState, useCallback, type PropsWithChildren } from 'react';

interface TabBarVisibilityContextValue {
  visible: boolean;
  setVisible: (v: boolean) => void;
}

const TabBarVisibilityContext = createContext<TabBarVisibilityContextValue>({
  visible: true,
  setVisible: () => {},
});

export function TabBarVisibilityProvider({ children }: PropsWithChildren) {
  const [visible, setVisible] = useState(true);
  return (
    <TabBarVisibilityContext.Provider value={{ visible, setVisible }}>
      {children}
    </TabBarVisibilityContext.Provider>
  );
}

export function useTabBarVisibility() {
  return useContext(TabBarVisibilityContext);
}
