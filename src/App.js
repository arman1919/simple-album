import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import AdminAlbum from './components/AdminAlbum';
import PublicAlbum from './components/PublicAlbum';
import NotFound from './components/NotFound';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin/:albumId" element={<AdminAlbum />} />
          <Route path="/album/:albumId" element={<PublicAlbum />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
