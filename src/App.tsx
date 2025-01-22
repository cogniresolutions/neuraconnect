import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import Index from './pages/Index';
import PersonalDeployment from './pages/PersonalDeployment';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/deploy" element={<PersonalDeployment />} />
      </Routes>
    </Router>
  );
}

export default App;
