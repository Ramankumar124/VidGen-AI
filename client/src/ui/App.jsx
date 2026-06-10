import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import AnalyzeStep1 from './pages/Analyze/AnalyzeStep1'
import AnalyzeStep2 from './pages/Analyze/AnalyzeStep2'
import AnalyzeStep3 from './pages/Analyze/AnalyzeStep3'
import AnalyzeStep4 from './pages/Analyze/AnalyzeStep4'
import AnalyzeSave from './pages/Analyze/AnalyzeSave'
import ProjectsPage from './pages/Projects/ProjectsPage'
import ProjectDetail from './pages/Projects/ProjectDetail'
import InventoryPage from './pages/Inventory/InventoryPage'
import ProtectedRoute from './components/shared/ProtectedRoute'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected */}
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />

        {/* Analysis flow */}
        <Route path="/analyze" element={
          <ProtectedRoute><AnalyzeStep1 /></ProtectedRoute>
        } />
        <Route path="/analyze/processing" element={
          <ProtectedRoute><AnalyzeStep2 /></ProtectedRoute>
        } />
        <Route path="/analyze/products" element={
          <ProtectedRoute><AnalyzeStep3 /></ProtectedRoute>
        } />
        <Route path="/analyze/script" element={
          <ProtectedRoute><AnalyzeStep4 /></ProtectedRoute>
        } />
        <Route path="/analyze/save" element={
          <ProtectedRoute><AnalyzeSave /></ProtectedRoute>
        } />

        {/* Projects */}
        <Route path="/projects" element={
          <ProtectedRoute><ProjectsPage /></ProtectedRoute>
        } />
        <Route path="/projects/:runId" element={
          <ProtectedRoute><ProjectDetail /></ProtectedRoute>
        } />

        {/* Product Inventory */}
        <Route path="/inventory" element={
          <ProtectedRoute><InventoryPage /></ProtectedRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
