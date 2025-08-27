import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  Navigate,
  useLocation,
} from "react-router-dom";
import axios from "axios";
import Profile from "./pages/Profile";
import Matches from "./pages/Matches";
import Search from "./pages/Search";
import Heroes from "./pages/Heroes";
import MatchDetails from "./pages/MatchDetails";
import ProTeams from "./pages/ProTeams"; // Импортируем новый компонент

interface User {
  steamId: string;
  displayName: string;
  avatar: string;
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/user", { withCredentials: true })
      .then((res) => {
        setUser(res.data || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching user:", err);
        setUser(null);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return user ? children : <Navigate to="/" replace />;
}

function MainApp() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/user", { withCredentials: true })
      .then((res) => {
        setUser(res.data || null);
        setError(null);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Error fetching user:", message);
        setError(`Failed to fetch user: ${message}`);
        setUser(null);
      });

    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.body.classList.toggle("dark", savedTheme === "dark");
  }, []);

  const handleLogout = async () => {
    try {
      await axios.get("http://localhost:5000/auth/logout", {
        withCredentials: true,
      });
      setUser(null);
      navigate("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Logout error:", message);
      setError(`Failed to logout: ${message}`);
      setUser(null);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.body.classList.toggle("dark", newTheme === "dark");
  };

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-xl text-red-500">{error}</h1>
        <button
          onClick={() => {
            setError(null);
            axios
              .get("http://localhost:5000/api/user", { withCredentials: true })
              .then((res) => setUser(res.data || null))
              .catch((err) => setError(err.message));
          }}
          className="metro-button mt-2"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-100 dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-800">
        <nav className="max-w-7xl mx-auto flex justify-between items-center">
          <Link
            to="/"
            className="text-lg font-semibold text-blue-600 hover:text-blue-800"
          >
            Dota 2 Tracker
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/search")}
              className={`metro-nav-button ${
                location.pathname === "/search" ? "active" : ""
              }`}
            >
              Search
            </button>
            <button
              onClick={() => navigate("/profile")}
              className={`metro-nav-button ${
                location.pathname === "/profile" ? "active" : ""
              }`}
              disabled={!user}
            >
              Profile
            </button>
            <button
              onClick={() => navigate("/matches")}
              className={`metro-nav-button ${
                location.pathname === "/matches" ? "active" : ""
              }`}
              disabled={!user}
            >
              Matches
            </button>
            <button
              onClick={() => navigate("/heroes")}
              className={`metro-nav-button ${
                location.pathname === "/heroes" ? "active" : ""
              }`}
            >
              Heroes
            </button>
            <button
              onClick={() => navigate("/pro-teams")} // Добавлена кнопка для ProTeams
              className={`metro-nav-button ${
                location.pathname === "/pro-teams" ? "active" : ""
              }`}
            >
              Pro Teams
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
              aria-label="Toggle theme"
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>
            {user ? (
              <button
                onClick={handleLogout}
                className="metro-button bg-red-500 hover:bg-red-600"
              >
                Logout
              </button>
            ) : (
              <a
                href="http://localhost:5000/auth/steam"
                className="metro-button"
              >
                Login with Steam
              </a>
            )}
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto p-4 flex-grow">
        <Routes>
          <Route
            path="/"
            element={
              <div className="text-center">
                <div className="relative">
                  <img
                    src="https://wallpapercave.com/uwp/uwp4650294.jpeg"
                    alt="Dota 2 Background"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div>
                      <h1 className="text-2xl font-semibold text-white">
                        Welcome to Dota 2 Tracker
                      </h1>
                      <p className="text-md text-gray-200 mt-1">
                        Track your matches, analyze stats, and explore heroes!
                      </p>
                      <button
                        onClick={() => navigate("/search")}
                        className="metro-button mt-2 inline-block"
                      >
                        Start Searching
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/matches"
            element={
              <ProtectedRoute>
                <Matches />
              </ProtectedRoute>
            }
          />
          <Route path="/search" element={<Search />} />
          <Route path="/heroes" element={<Heroes />} />
          <Route path="/match/:matchId" element={<MatchDetails />} />
          <Route path="/pro-teams" element={<ProTeams />} />{" "}
          {/* Новый маршрут */}
        </Routes>
      </main>

      <footer className="metro-footer">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm">
            © 2025 Dota 2 Tracker. All rights reserved. Powered by{" "}
            <a href="https://x.ai" target="_blank" rel="noopener noreferrer">
              xAI
            </a>
            .
          </p>
          <div className="mt-2">
            <a href="/about" className="mr-4">
              About
            </a>
            <a href="/contact" className="mr-4">
              Contact
            </a>
            <a href="/privacy" className="mr-4">
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <MainApp />
    </BrowserRouter>
  );
}

export default App;
