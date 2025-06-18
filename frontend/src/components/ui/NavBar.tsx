import { Link } from 'react-router-dom';

export default function NavBar() {
  return (
    <nav className="flex gap-4 p-4 bg-white shadow-md rounded-md text-black mb-6">
      <Link to="/" className="hover:underline">Cleaner</Link> {/* 👈 ici */}
      <Link to="/dashboard" className="hover:underline">Dashboard</Link>
      <Link to="/rulelibrary" className="hover:underline">RuleLibrary</Link>
      <Link to="/login" className="hover:underline">Login</Link>
    </nav>
  );
}
