import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import Index from './pages/Index';
import PersonalDeployment from './pages/PersonalDeployment';
import Tools from './pages/Tools';
import Documentation from './pages/Documentation';
import VideoCall from './pages/VideoCall';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/deploy" element={<PersonalDeployment />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/docs" element={<Documentation />} />
        <Route path="/video-call/:personaId" element={<VideoCall />} />
      </Routes>
    </Router>
  );
}

export default App;