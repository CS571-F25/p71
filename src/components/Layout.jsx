import { Outlet } from 'react-router';
import AppNavbar from './AppNavbar'; 

export default function Layout() {
  return (
    // min-vh-100 ensures the app always fills the height of the screen
    // d-flex flex-column allows the footer to stick to the bottom
    <div className="min-vh-100 d-flex flex-column bg-dark text-white">
      
      <AppNavbar />
      
      {/* Main content grows to fill available space */}
      <main className="flex-grow-1">
        <Outlet />
      </main>
      
      {/* Simple Inline Footer */}
      <footer className="py-4 mt-auto border-top border-secondary text-center">
        <small className="text-muted">
          &copy; {new Date().getFullYear()} Currency Analyst Dashboard. Data provided by Abstract API.
        </small>
      </footer>
      
    </div>
  );
}