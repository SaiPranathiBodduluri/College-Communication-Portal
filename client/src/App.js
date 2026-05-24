
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { SidebarProvider } from './contexts/SidebarContext';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalSidebar from './components/GlobalSidebar';
import MainLayout from './components/MainLayout';

// Pages
import HomePage from './pages/HomePage';
import StudentLoginPage from './pages/StudentLoginPage';
import FacultyLoginPage from './pages/FacultyLoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import Dashboard from './pages/Dashboard';
import NoticesPage from './pages/NoticesPage';
import CreateNoticePage from './pages/CreateNoticePage';
import NoticeDetailPage from './pages/NoticeDetailPage';
import MyCreatedNoticesPage from './pages/MyCreatedNoticesPage';
import NoticeAnalyticsPage from './pages/NoticeAnalyticsPage';
import CommentsPage from './pages/CommentsPage';
import CommentDetailsPage from './pages/CommentDetailsPage';
import ResponsesPage from './pages/ResponsesPage';
import ResponseDetailsPage from './pages/ResponseDetailsPage';
import ProfilePage from './pages/ProfilePage';
import SendMessagePage from './pages/SendMessagePage';
import DataManagementPage from './pages/DataManagementPage';
import NotificationsPage from './pages/NotificationsPage';
import MessageDetailPage from './pages/MessageDetailPage';
import UsersListPage from './pages/UsersListPage';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <SidebarProvider>
          <Router>
          <div className="App">
            <Routes>
              {/* Public routes without sidebar */}
              <Route path="/" element={<HomePage />} />
              <Route path="/student-login" element={<StudentLoginPage />} />
              <Route path="/faculty-login" element={<FacultyLoginPage />} />
              <Route path="/admin-login" element={<AdminLoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              
              {/* Protected routes with sidebar layout */}
              <Route path="/dashboard" element={
                <div className="flex">
                  <GlobalSidebar />
                  <MainLayout>
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  </MainLayout>
                </div>
              } />
              
              <Route path="/notices" element={
                <div className="flex">
                  <GlobalSidebar />
                  <MainLayout>
                    <ProtectedRoute>
                      <NoticesPage />
                    </ProtectedRoute>
                  </MainLayout>
                </div>
              } />
              
              <Route path="/notices/create" element={
                <div className="flex">
                  <GlobalSidebar />
                  <MainLayout>
                    <ProtectedRoute roles={['admin', 'faculty']}>
                      <CreateNoticePage />
                    </ProtectedRoute>
                  </MainLayout>
                </div>
              } />
              
              <Route path="/notices/:id" element={
                <div className="flex">
                  <GlobalSidebar />
                  <MainLayout>
                    <ProtectedRoute>
                      <NoticeDetailPage />
                    </ProtectedRoute>
                  </MainLayout>
                </div>
              } />
              
              <Route path="/notifications" element={
                <div className="flex">
                  <GlobalSidebar />
                  <MainLayout>
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  </MainLayout>
                </div>
              } />
              
              <Route path="/messages/:id" element={
                <div className="flex">
                  <GlobalSidebar />
                  <MainLayout>
                    <ProtectedRoute>
                      <MessageDetailPage />
                    </ProtectedRoute>
                  </MainLayout>
                </div>
              } />
              
              <Route path="/profile" element={
                <div className="flex">
                  <GlobalSidebar />
                  <MainLayout>
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  </MainLayout>
                </div>
              } />
              
              <Route path="/send-message" element={
                <div className="flex">
                  <GlobalSidebar />
                  <MainLayout>
                    <ProtectedRoute>
                      <SendMessagePage />
                    </ProtectedRoute>
                  </MainLayout>
                </div>
              } />
              
              <Route path="/data-management" element={
                <div className="flex">
                  <GlobalSidebar />
                  <MainLayout>
                    <ProtectedRoute roles={['admin']}>
                      <DataManagementPage />
                    </ProtectedRoute>
                  </MainLayout>
                </div>
              } />
              
              <Route path="/users" element={
                <div className="flex">
                  <GlobalSidebar />
                  <MainLayout>
                    <ProtectedRoute roles={['admin']}>
                      <UsersListPage />
                    </ProtectedRoute>
                  </MainLayout>
                </div>
              } />
              
              <Route path="/my-created-notices" element={
                <div className="flex">
                  <GlobalSidebar />
                  <MainLayout>
                    <ProtectedRoute roles={['admin', 'faculty']}>
                      <MyCreatedNoticesPage />
                    </ProtectedRoute>
                  </MainLayout>
                </div>
              } />
              
              <Route path="/notice-analytics/:id" element={
                <div className="flex">
                  <GlobalSidebar />
                  <MainLayout>
                    <ProtectedRoute roles={['admin', 'faculty']}>
                      <NoticeAnalyticsPage />
                    </ProtectedRoute>
                  </MainLayout>
                </div>
              } />
              
              <Route path="/comments" element={
                <div className="flex">
                  <GlobalSidebar />
                  <MainLayout>
                    <ProtectedRoute roles={['admin', 'faculty']}>
                      <CommentsPage />
                    </ProtectedRoute>
                  </MainLayout>
                </div>
              } />
              
              <Route path="/comment-details/:id" element={
                <div className="flex">
                  <GlobalSidebar />
                  <MainLayout>
                    <ProtectedRoute roles={['admin', 'faculty']}>
                      <CommentDetailsPage />
                    </ProtectedRoute>
                  </MainLayout>
                </div>
              } />
              
              <Route path="/responses" element={
                <div className="flex">
                  <GlobalSidebar />
                  <MainLayout>
                    <ProtectedRoute roles={['admin', 'faculty']}>
                      <ResponsesPage />
                    </ProtectedRoute>
                  </MainLayout>
                </div>
              } />
              
              <Route path="/response-details/:id" element={
                <div className="flex">
                  <GlobalSidebar />
                  <MainLayout>
                    <ProtectedRoute roles={['admin', 'faculty']}>
                      <ResponseDetailsPage />
                    </ProtectedRoute>
                  </MainLayout>
                </div>
              } />
              
            </Routes>
            
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </div>
          </Router>
        </SidebarProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;