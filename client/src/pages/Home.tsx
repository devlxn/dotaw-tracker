import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-semibold text-blue-600 mb-4 text-center">
          Dota 2 Tracker
        </h1>
        <div className="relative w-full h-[300px] rounded-lg overflow-hidden">
          <img
            src="https://wallpapercave.com/uwp/uwp4650294.jpeg"
            alt="Dota 2 Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center">
              <p className="text-lg mb-2 text-white">
                Explore matches, stats, and heroes
              </p>
              <button
                onClick={() => navigate("/search")}
                className="metro-button"
              >
                Launch Mission
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
