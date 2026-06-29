import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ProjectsList from './pages/ProjectsList';
import ProjectDetail from './pages/ProjectDetail';
import DailyLogs from './pages/DailyLogs';
import PostGenerator from './pages/PostGenerator';
import SavedPosts from './pages/SavedPosts';

function App() {
  return (
    <Router>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<ProjectsList />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/logs" element={<DailyLogs />} />
            <Route path="/generate" element={<PostGenerator />} />
            <Route path="/posts" element={<SavedPosts />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
