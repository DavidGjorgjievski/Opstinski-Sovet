import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './styles/App.css';
import Home from './pages/Home';
import { HelmetProvider } from 'react-helmet-async';
import Login from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Logout from './pages/Logout';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword'; 
import ChangeImage from './pages/ChangeImage';
import AdminPanel from './pages/AdminPanel';
import AddUserForm from './pages/AddUserForm';
import Sessions from './pages/Sessions';
import AddSessionForm from './pages/AddSessionForm';
import Topics from './pages/Topics';
import Municipalities from './pages/Municipalities'
import AddTopicForm from './pages/AddTopicForm';
import TopicDetails from './pages/TopicDetails';
import Unauthorized from './pages/Unauthorized';
import AddMunicipalityForm from './pages/AddMunicipalityForm';
import TopicPresentation from './pages/TopicPresentation'
import NotFound from './pages/NotFound'
import Mandate from './pages/Mandate';
import AddFormMandate from './pages/AddFormMandate';
import ChangeEmail from './pages/ChangeEmail';
import AddBiographyForm from './pages/AddBiographyForm';
import MunicipalityMandate from './pages/MunicipalityMandate';
import AddMunicipalityMandateForm from './pages/AddMunicipalityMandateForm';
import HeadLinks from './components/HeadLinks';
import Amendments from './pages/Amendments';
import MunicipalityMandateUsers from './pages/MunicipalityMandateUsers'
import MunicipalityMandateUsersAddList from './pages/MunicipalityMandateUsersAddList'
import ForgotPassword from './pages/ForgotPassword'
import ResetPasswordPage from './pages/ResetPasswordPage';
import Monitoring from './pages/Monitoring';
import ProfileView from './pages/ProfileView'
import { SessionModalProvider } from './context/SessionModalContext';
import SessionExpiredModal from './components/SessionExpiredModal';
import './styles/Main.css';

import "./i18n"; 

function App() {
  return (
    <AuthProvider> 
      <SessionModalProvider>
      <HelmetProvider>
        <Router>
          <HeadLinks />
          <div className="App">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/logout" element={<Logout />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Protected routes */}
              <Route path="/" element={<ProtectedRoute element={<Home />} />} />
              <Route path="/profile" element={<ProtectedRoute element={<Profile />} allowedRoles={['ROLE_USER', 'ROLE_ADMIN', 'ROLE_SPECTATOR', 'ROLE_PRESENTER', 'ROLE_PRESIDENT', 'ROLE_MAYOR', 'ROLE_EDITOR']} />}/>
              <Route path="/profile/change-password-form" element={<ProtectedRoute element={<ChangePassword />} allowedRoles={['ROLE_USER', 'ROLE_ADMIN', 'ROLE_SPECTATOR', 'ROLE_PRESENTER', 'ROLE_PRESIDENT', 'ROLE_MAYOR', 'ROLE_EDITOR']}/>}/>
              <Route path="/profile/change-image-form" element={<ProtectedRoute element={<ChangeImage />} allowedRoles={['ROLE_USER', 'ROLE_ADMIN', 'ROLE_SPECTATOR', 'ROLE_PRESENTER', 'ROLE_PRESIDENT', 'ROLE_MAYOR', 'ROLE_EDITOR']}/>}/>
              <Route path="/profile/change-email-form" element={<ProtectedRoute element={<ChangeEmail />} allowedRoles={['ROLE_USER', 'ROLE_ADMIN', 'ROLE_SPECTATOR', 'ROLE_PRESENTER', 'ROLE_PRESIDENT', 'ROLE_MAYOR', 'ROLE_EDITOR']} />} />
              <Route path="/profile/add-biography" element={<ProtectedRoute element={<AddBiographyForm mode="add" />} allowedRoles={['ROLE_USER', 'ROLE_ADMIN', 'ROLE_SPECTATOR', 'ROLE_PRESENTER', 'ROLE_PRESIDENT', 'ROLE_MAYOR', 'ROLE_EDITOR']} />}/>
              <Route path="/profile/edit-biography" element={<ProtectedRoute element={<AddBiographyForm mode="edit" />} allowedRoles={['ROLE_USER', 'ROLE_ADMIN', 'ROLE_SPECTATOR', 'ROLE_PRESENTER', 'ROLE_PRESIDENT', 'ROLE_MAYOR', 'ROLE_EDITOR']} />}/>

              <Route 
              path="/mandate" 
              element={<ProtectedRoute element={<Mandate />} allowedRoles={['ROLE_ADMIN']} />} 
              />

              <Route 
                path="/mandate/add-form" 
                element={<ProtectedRoute element={<AddFormMandate />} allowedRoles={['ROLE_ADMIN']} />} 
              />

              <Route 
                path="/mandate/edit/:id" 
                element={<ProtectedRoute element={<AddFormMandate />} allowedRoles={['ROLE_ADMIN']} />} 
              />

              <Route
                path="/municipalities/:municipalityId/mandates"
                element={<ProtectedRoute element={<MunicipalityMandate />} />}
              />

              <Route
                path="/municipalities/:municipalityId/mandates/add-form"
                element={<ProtectedRoute element={<AddMunicipalityMandateForm />} allowedRoles={['ROLE_ADMIN']} />}
              />

               <Route
                path="/municipalities/:municipalityId/mandates/edit/:mandateId"
                element={<ProtectedRoute element={<AddMunicipalityMandateForm />} allowedRoles={['ROLE_ADMIN']} />}
              />

              <Route
                path="/municipalities/:municipalityId/mandates/users/:mandateId"
                element={ <ProtectedRoute element={<MunicipalityMandateUsers />} />}
              />

              <Route
                path="/profile-view/:username"
                element={<ProfileView />}
              />

               <Route
                path="/municipalities/:id/mandates/users/:mandateId/add-list"
                element={ <ProtectedRoute element={<MunicipalityMandateUsersAddList />} allowedRoles={['ROLE_ADMIN']} />}
              />

              <Route path="/municipalities" element={<ProtectedRoute element={<Municipalities />} />} />
             <Route 
                path="/municipalities/add-form" 
                element={<ProtectedRoute element={<AddMunicipalityForm />} allowedRoles={['ROLE_ADMIN']} />} 
            />
            <Route 
                path="/municipalities/edit/:municipalityId" 
                element={<ProtectedRoute element={<AddMunicipalityForm />} allowedRoles={['ROLE_ADMIN']} />} 
            />

              <Route path="municipalities/:municipalityId/sessions" element={<ProtectedRoute element={<Sessions />} />} />


              <Route 
                path="/municipalities/:municipalityId/sessions/add-form" 
                element={<ProtectedRoute element={<AddSessionForm />} allowedRoles={['ROLE_PRESIDENT', 'ROLE_ADMIN', 'ROLE_EDITOR']}  />} 
              />


              <Route 
                path="/municipalities/:municipalityId/sessions/edit/:id?" 
                element={<ProtectedRoute element={<AddSessionForm />} allowedRoles={['ROLE_PRESIDENT', 'ROLE_ADMIN', 'ROLE_EDITOR']}  />} 
              />

              <Route 
                path="/municipalities/:municipalityId/sessions/:id?/topics/add-form"
                element={<ProtectedRoute element={<AddTopicForm />} allowedRoles={['ROLE_PRESIDENT', 'ROLE_ADMIN', 'ROLE_EDITOR']} />} 
              />

               <Route 
                path="/municipalities/:municipalityId/sessions/:id?/topics/add-before/:idt"
                element={<ProtectedRoute element={<AddTopicForm />} allowedRoles={['ROLE_PRESIDENT', 'ROLE_ADMIN', 'ROLE_EDITOR']} />} 
              />

              <Route 
                path="/municipalities/:municipalityId/sessions/:id?/topics/add-after/:idt"
                element={<ProtectedRoute element={<AddTopicForm />} allowedRoles={['ROLE_PRESIDENT', 'ROLE_ADMIN', 'ROLE_EDITOR']} />} 
              />

              <Route 
                path="/municipalities/:municipalityId/sessions/:id?/topics/edit/:idt" 
                element={<ProtectedRoute element={<AddTopicForm />} allowedRoles={['ROLE_PRESIDENT', 'ROLE_ADMIN', 'ROLE_EDITOR']} />} 
              />

              <Route
                path="/municipalities/:municipalityId/sessions/:id?/topics/amendments/:topicId"
                element={<ProtectedRoute element={<Amendments />} />}
              />

              <Route path="/municipalities/:municipalityId/sessions/:id?/topics" element={<ProtectedRoute element={<Topics />} />} />

              <Route path="/municipalities/:municipalityId/sessions/:id?/topics-presentation" element={<ProtectedRoute element={<TopicPresentation />} />} />

              <Route path="/monitoring" element={<ProtectedRoute element={<Monitoring />} allowedRoles={['ROLE_ADMIN']} />} />

              <Route
                path="/admin-panel"
                element={<ProtectedRoute element={<AdminPanel />} allowedRoles={['ROLE_ADMIN']} />}
              />
              <Route
                path="/admin-panel/add-form"
                element={<ProtectedRoute element={<AddUserForm />} allowedRoles={['ROLE_ADMIN']} />}
              />
              <Route
                path="/admin-panel/edit/:username"
                element={<ProtectedRoute element={<AddUserForm />} allowedRoles={['ROLE_ADMIN']} />}
              />
             
              <Route path="/municipalities/:municipalityId/sessions/:id?/topics/details/:idt" element={<ProtectedRoute element={<TopicDetails />} />} />

              <Route path="*" element={<NotFound />} /> 
            </Routes>
            <SessionExpiredModal />
          </div>
        </Router>
      </HelmetProvider>
      </SessionModalProvider>
    </AuthProvider>
  );
}

export default App;
