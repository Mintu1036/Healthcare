import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import RoleSelect from './pages/Auth/RoleSelect'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'

import DoctorScreen from './pages/DoctorScreen'
import PatientScreen from './pages/PatientScreen'
import AdmistratorScreen from './pages/Admistrator'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleSelect />} />
        <Route path="/login/:role" element={<Login />} />
        <Route path="/register/:role" element={<Register />} />

        <Route path="/doctor" element={<DoctorScreen />} />
        <Route path="/patient" element={<PatientScreen />} />
        <Route path="/administrator" element={<AdmistratorScreen />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
