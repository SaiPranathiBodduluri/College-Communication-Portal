import { createContext, useContext, useState } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const expandSidebar = () => setSidebarExpanded(true);
  const collapseSidebar = () => setSidebarExpanded(false);
  const toggleSidebar = () => setSidebarExpanded(!sidebarExpanded);

  return (
    <SidebarContext.Provider value={{
      sidebarExpanded,
      expandSidebar,
      collapseSidebar,
      toggleSidebar,
      // Keep old names for compatibility
      sidebarOpen: sidebarExpanded,
      openSidebar: expandSidebar,
      closeSidebar: collapseSidebar
    }}>
      {children}
    </SidebarContext.Provider>
  );
};