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
import ProTeams from "./pages/ProTeams";
import HeroMatchups from "./pages/HeroMatchups";

// Интерфейс пользователя
interface User {
  steamId: string;
  displayName: string;
  avatar: string;
}

// Компонент защищенного маршрута
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("https://dotaw-tracker-production.up.railway.app/api/user", {
        withCredentials: true,
      })
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    axios
      .get("https://dotaw-tracker-production.up.railway.app/api/user", {
        withCredentials: true,
      })
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
      await axios.get(
        "https://dotaw-tracker-production.up.railway.app/auth/logout",
        {
          withCredentials: true,
        }
      );
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
              .get("https://dotaw-tracker-production.up.railway.app/api/user", {
                withCredentials: true,
              })
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
      {/* Вставка Яндекс.Метрики */}
      {location.pathname === "/" && (
        <>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function(m,e,t,r,i,k,a){
                  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                  m[i].l=1*new Date();
                  for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
                })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=104186228', 'ym');

                ym(104186228, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", accurateTrackBounce:true, trackLinks:true});
              `,
            }}
          />
          <noscript>
            <div>
              <img
                src="https://mc.yandex.ru/watch/104186228"
                style={{ position: "absolute", left: "-9999px" }}
                alt=""
              />
            </div>
          </noscript>
        </>
      )}

      <header className="bg-gray-100 dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-800 z-50">
        <nav className="max-w-7xl mx-auto flex justify-between items-center">
          <Link
            to="/"
            className="text-lg sm:text-xl font-semibold text-blue-600 hover:text-blue-800"
          >
            Dota 2 Tracker
          </Link>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="sm:hidden p-2 text-gray-900 dark:text-gray-100 focus:outline-none z-50"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </button>
          <div
            className={`${
              isMenuOpen ? "block" : "hidden"
            } sm:flex sm:items-center gap-2 w-full sm:w-auto ${
              isMenuOpen
                ? "absolute top-16 left-0 bg-gray-100 dark:bg-gray-900 w-full p-4 z-40"
                : ""
            }`}
          >
            <button
              onClick={() => {
                navigate("/search");
                setIsMenuOpen(false);
              }}
              className={`metro-nav-button w-full sm:w-auto mb-2 sm:mb-0 ${
                location.pathname === "/search" ? "active" : ""
              }`}
            >
              Search
            </button>
            <button
              onClick={() => {
                navigate("/profile");
                setIsMenuOpen(false);
              }}
              className={`metro-nav-button w-full sm:w-auto mb-2 sm:mb-0 ${
                location.pathname === "/profile" ? "active" : ""
              }`}
              disabled={!user}
            >
              Profile
            </button>
            <button
              onClick={() => {
                navigate("/matches");
                setIsMenuOpen(false);
              }}
              className={`metro-nav-button w-full sm:w-auto mb-2 sm:mb-0 ${
                location.pathname === "/matches" ? "active" : ""
              }`}
              disabled={!user}
            >
              Matches
            </button>
            <button
              onClick={() => {
                navigate("/heroes");
                setIsMenuOpen(false);
              }}
              className={`metro-nav-button w-full sm:w-auto mb-2 sm:mb-0 ${
                location.pathname === "/heroes" ? "active" : ""
              }`}
            >
              Heroes
            </button>
            <button
              onClick={() => {
                navigate("/pro-teams");
                setIsMenuOpen(false);
              }}
              className={`metro-nav-button w-full sm:w-auto mb-2 sm:mb-0 ${
                location.pathname === "/pro-teams" ? "active" : ""
              }`}
            >
              Pro Teams
            </button>
            <button
              onClick={() => {
                toggleTheme();
                setIsMenuOpen(false);
              }}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 mb-2 sm:mb-0"
              aria-label="Toggle theme"
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>
            {user ? (
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="metro-button bg-red-500 hover:bg-red-600 w-full sm:w-auto"
              >
                Logout
              </button>
            ) : (
              <a
                href="https://dotaw-tracker-production.up.railway.app/auth/steam"
                className="metro-button w-full sm:w-auto"
                onClick={() => setIsMenuOpen(false)}
              >
                Login with Steam
              </a>
            )}
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto p-4 flex-grow overflow-y-auto">
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
          <Route path="/pro-teams" element={<ProTeams />} />
          <Route path="/heroes/:heroId/matchups" element={<HeroMatchups />} />
        </Routes>
      </main>

      <footer className="metro-footer bg-gray-100 dark:bg-gray-900 p-4 border-t border-gray-200 dark:border-gray-800">
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
