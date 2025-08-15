import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import CalendarPage from './pages/CalendarPage'
import InsightsPage from './pages/InsightsPage'
import LandingPage from './pages/LandingPage'
import { EmotionProvider } from './context/EmotionContext'
import { LanguageProvider } from './context/LanguageContext'

function App() {
  return (
    <LanguageProvider>
      <EmotionProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="insights" element={<InsightsPage />} />
          </Route>
        </Routes>
      </EmotionProvider>
    </LanguageProvider>
  )
}

export default App