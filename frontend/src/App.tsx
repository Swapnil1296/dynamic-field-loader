import { Route, Routes, Link } from 'react-router-dom';
import { MakePayment } from './pages/MakePayment';
import './App.css';

function App() {
  return (
    <div className="app">
      <nav className="app-nav">
        <Link to="/" className="nav-brand">
          Field Loader
        </Link>
        <span className="nav-tag">Dynamic Forms Demo</span>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<MakePayment />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
