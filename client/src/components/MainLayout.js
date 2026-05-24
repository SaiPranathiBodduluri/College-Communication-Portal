import { useSidebar } from '../contexts/SidebarContext';

const MainLayout = ({ children }) => {
  const { sidebarExpanded } = useSidebar();
  
  return (
    <div 
      className="flex-1 transition-all duration-300 min-h-screen bg-gray-50"
      style={{ 
        marginLeft: sidebarExpanded ? '280px' : '70px'
      }}
    >
      {children}
    </div>
  );
};

export default MainLayout;