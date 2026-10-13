import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Activity, Download, MapPin, RefreshCw, AlertTriangle } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position === null ? null : <Marker position={position}></Marker>;
}

export default function App() {
  const [position, setPosition] = useState([20.5937, 78.9629]); // Default to India center or pick any
  const [startYear, setStartYear] = useState(1990);
  const [endYear, setEndYear] = useState(2020);
  const [hazardType, setHazardType] = useState('heatwave');
  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState(null);
  const [error, setError] = useState(null);

  const handleFetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/analyze?lat=${position[0]}&lon=${position[1]}&start_year=${startYear}&end_year=${endYear}&hazard_type=${hazardType}`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || 'Failed to fetch data');
      setApiData(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!apiData) return;
    let csvContent = "data:text/csv;charset=utf-8,Year,Frequency\n";
    apiData.years.forEach((yr, idx) => {
      csvContent += `${yr},${apiData.frequencies[idx]}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "climate_hazard_trends.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = apiData ? {
    labels: apiData.years,
    datasets: [
      {
        label: `Heatwave Frequency (Events/Year)`,
        data: apiData.frequencies,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        tension: 0.2,
      }
    ],
  } : null;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <header className="bg-slate-800 border-b border-slate-700 py-4 px-6 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <Activity className="text-red-500 w-8 h-8" />
          <h1 className="text-xl font-bold tracking-wide">Climate Hazard Trend Analyzer</h1>
        </div>
        <span className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full border border-red-500/30">Dygnify Ventures Case Study</span>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Controls & Map */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-red-400" /> Select Region</h2>
            <p className="text-xs text-slate-400">Click anywhere on the map to target coordinates or use defaults.</p>
            
            <div className="h-64 w-full rounded-lg overflow-hidden border border-slate-700 z-0">
              <MapContainer center={position} zoom={5} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarker position={position} setPosition={setPosition} />
              </MapContainer>
            </div>
            <div className="text-xs text-slate-400">Selected Lat: {position[0].toFixed(4)}, Lon: {position[1].toFixed(4)}</div>

            <div className="space-y-3 pt-2">
              <label className="block text-sm font-medium">Hazard Type</label>
              <select 
                value={hazardType} 
                onChange={(e) => setHazardType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm"
              >
                <option value="heatwave">Heatwave (Default)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">Start Year</label>
                <input type="number" value={startYear} onChange={(e) => setStartYear(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium">End Year</label>
                <input type="number" value={endYear} onChange={(e) => setEndYear(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm" />
              </div>
            </div>

            <button 
              onClick={handleFetchData}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-500 transition text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
              {loading ? 'Analyzing Climate Data...' : 'Run Analysis'}
            </button>
          </div>
        </div>

        {/* Right Panel: Visualization & Insights */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="bg-red-900/40 border border-red-500 p-4 rounded-xl flex items-center gap-3 text-red-200">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!apiData && !loading && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center text-slate-400 space-y-3">
              <Activity className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-lg font-medium">No analysis generated yet.</p>
              <p className="text-sm">Select a location on the map and click "Run Analysis" to compute historical trends.</p>
            </div>
          )}

          {apiData && (
            <>
              {/* Summary Insight Card */}
              <div className="bg-gradient-to-r from-red-950/60 to-slate-800 border border-red-500/40 p-5 rounded-xl shadow-lg space-y-2">
                <h3 className="text-xs uppercase tracking-wider text-red-400 font-bold">Key Insight Summary</h3>
                <p className="text-lg font-medium">{apiData.summary_insight}</p>
                <div className="text-xs text-slate-400 pt-1">
                  Baseline 95th Percentile Threshold Temperature: <span className="text-slate-200 font-semibold">{apiData.threshold_95th_temp_c}°C</span>
                </div>
              </div>

              {/* Chart Card */}
              <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Frequency Trend Over Time ({startYear} - {endYear})</h3>
                  <button onClick={downloadCSV} className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition">
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                </div>
                <div className="h-80 w-full">
                  <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}