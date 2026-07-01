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
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6" style={{ marginLeft: '280px' }}>
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
