import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports';
import '@aws-amplify/ui-react/styles.css';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Planner from './pages/Planner';
import Analytics from './pages/Analytics';
import AuthWrapper from './components/AuthWrapper';
import Navbar from './components/Navbar';

Amplify.configure(awsExports);

function App() {
  return (
    <BrowserRouter>
      <AuthWrapper>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </AuthWrapper>
    </BrowserRouter>
  );
}

export default App;
