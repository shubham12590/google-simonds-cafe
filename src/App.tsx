import React, { useState } from 'react';
import { DataProvider, useData } from './context/DataContext';
import { ToastProvider } from './components/Toast';
import { Layout } from './components/Layout';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './pages/Dashboard';
import { ProductPerformance } from './pages/ProductPerformance';
import { TimeAnalysis } from './pages/TimeAnalysis';
import { Comparison } from './pages/Comparison';
import { Prediction } from './pages/Prediction';
import { Locations } from './pages/Locations';

const AppContent: React.FC = () => {
  const { data, isLoading } = useData();
  const [activePage, setActivePage] = useState('dashboard');

  if (isLoading) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">Loading data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0 && activePage !== 'locations') {
    return (
      <div className="h-screen bg-slate-50">
        <FileUpload />
      </div>
    );
  }

  return (
    <Layout activePage={activePage} setActivePage={setActivePage}>
      {activePage === 'dashboard' && <Dashboard />}
      {activePage === 'product' && <ProductPerformance />}
      {activePage === 'time' && <TimeAnalysis />}
      {activePage === 'comparison' && <Comparison />}
      {activePage === 'prediction' && <Prediction />}
      {activePage === 'locations' && <Locations />}
    </Layout>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </ToastProvider>
  );
}

