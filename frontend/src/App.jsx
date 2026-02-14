import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'


import DoctorScreen from './pages/DoctorScreen';
import PatientScreen from './pages/PatientScreen';
import AdmistratorScreen from './pages/Admistrator';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';



function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <Router>
        <Routes>
          <Route path="/doctor" element={<DoctorScreen />} />
          <Route path="/patient" element={<PatientScreen />} />
          <Route path="/administrator" element={<AdmistratorScreen />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
