import React from 'react';
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import DashboardPage from './components/DashboardPage';
import ControlPage from './components/ControlPage';
import HistoryPage from './components/HistoryPage';
import ChatbotPage from './components/ChatbotPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Switch>
        {/* Redirect root to the requested auth/login path */}
        <Route exact path="/">
          <Redirect to="/auth/login" />
        </Route>
        
        {/* Auth routes */}
        <Route path="/auth/login" component={LoginPage} />
        <Route path="/auth/register" component={RegisterPage} />
        
        {/* Main App Routes */}
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/control" component={ControlPage} />
        <Route path="/history" component={HistoryPage} />
        <Route path="/chatbot" component={ChatbotPage} />
        
        {/* Fallback for other routes */}
        <Route path="*">
          <div className="flex items-center justify-center h-screen text-gray-500">Page not found</div>
        </Route>
      </Switch>
    </BrowserRouter>
  );
};

export default App;