// src/App.jsx
import React, { useState } from 'react';
import LandingPage from './components/LandingPage.jsx';
import InstructionsPage from './components/InstructionsPage.jsx';
import HeightInputPage from './components/HeightInputPage.jsx';
import CameraPage from './components/CameraPage.jsx';
import ResultsPage from './components/ResultsPage.jsx'; // <-- Import ResultsPage
import Footer from './components/Footer.jsx';
// Ensure index.css with layout styles is imported in main.jsx or here

function App() {
  // State to track the current view/page
  const [currentView, setCurrentView] = useState('LANDING');
  // State to hold data passed between views (e.g., results)
  const [viewData, setViewData] = useState(null);

  // Updated navigation function to accept data
  const navigateTo = (view, data = null) => {
    console.log(`Navigating to ${view} with data:`, data);
    setViewData(data); // Store data for the next view
    setCurrentView(view); // Change the view
  };

  // Determine which component to render based on state
  let content;
  if (currentView === 'LANDING') {
    content = <LandingPage onNavigate={navigateTo} />;
  } else if (currentView === 'INSTRUCTIONS') {
    content = <InstructionsPage onNavigate={navigateTo} />;
  } else if (currentView === 'HEIGHT_INPUT') {
    content = <HeightInputPage onNavigate={navigateTo} />;
  } else if (currentView === 'CAMERA') {
    content = <CameraPage onNavigate={navigateTo} />;
  } else if (currentView === 'RESULTS') { // <-- Add RESULTS view
    // Pass navigateTo and the stored results data
    content = <ResultsPage onNavigate={navigateTo} results={viewData} />;
  } else {
    // Fallback for unknown views
    content = <div>Unknown View: {currentView}</div>;
    // Optionally navigate back to landing after a delay on unknown view
    // setTimeout(() => navigateTo('LANDING'), 3000);
  }

  return (
    // Main app container for layout (styles in index.css)
    <div className="app-container">
      {/* Main content area */}
      <main className="main-content">
        {content}
      </main>

      {/* Footer component */}
      <Footer />
    </div>
  );
}

export default App;
