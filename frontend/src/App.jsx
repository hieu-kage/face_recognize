import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CheckinPage from './CheckinPage';
import AdminDashboard from './AdminDashboard';
import './App.css';



function App() {
  return (
    <Routes>
      <Route path="/" element={<CheckinPage />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
}

export default App;