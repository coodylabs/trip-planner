import { useState } from 'react';
import axios from 'axios';
import './App.css';

function parseInline(text) {
  const parts = [];
  const regex = /\*\*\*([^*]+)\*\*\*|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let i = 0;
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push(<strong key={i++}><em>{m[1]}</em></strong>);
    else if (m[2]) parts.push(<strong key={i++}>{m[2]}</strong>);
    else parts.push(<em key={i++}>{m[3]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function sectionIcon(title) {
  const t = title.toLowerCase();
  if (t.includes('overview') || t.includes('summary')) return '🗺️';
  if (t.includes('day') || t.includes('plan') || t.includes('itinerary')) return '📅';
  if (t.includes('budget') || t.includes('cost') || t.includes('expense')) return '💰';
  if (t.includes('pack') || t.includes('bag')) return '🎒';
  if (t.includes('food') || t.includes('dining')) return '🍽️';
  if (t.includes('transport') || t.includes('getting')) return '🚌';
  if (t.includes('tip') || t.includes('advice') || t.includes('local')) return '💡';
  return '✦';
}

function renderMarkdown(text) {
  const lines = text.split('\n');
  const elements = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    if (line.startsWith('# ')) {
      elements.push(<h1 key={key++} className="md-h1">{parseInline(line.slice(2).trim())}</h1>);
      i++;
    } else if (line.startsWith('## ')) {
      const title = line.slice(3).trim();
      elements.push(
        <div key={key++} className="md-section-header">
          <span className="md-section-icon">{sectionIcon(title)}</span>
          <h2 className="md-h2">{parseInline(title)}</h2>
        </div>
      );
      i++;
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={key++} className="md-h3">{parseInline(line.slice(4).trim())}</h3>);
      i++;
    } else if (/^[-*] /.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(lines[i].slice(2).trim());
        i++;
      }
      elements.push(
        <ul key={key++} className="md-ul">
          {items.map((item, j) => (
            <li key={j} className="md-li">
              <span className="md-li-dot" aria-hidden="true" />
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, '').trim());
        i++;
      }
      elements.push(
        <ol key={key++} className="md-ol">
          {items.map((item, j) => (
            <li key={j} className="md-li">
              <span className="md-li-num">{j + 1}</span>
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ol>
      );
    } else {
      elements.push(<p key={key++} className="md-p">{parseInline(line.trim())}</p>);
      i++;
    }
  }

  return elements;
}

const TRAVEL_TYPES = ['Solo', 'Couple', 'Family', 'Group', 'Friends'];

const PREFERENCE_OPTIONS = [
  'Adventure', 'Culture', 'Food & Dining', 'Nature', 'Shopping',
  'Relaxation', 'History', 'Photography', 'Nightlife', 'Sports',
];

const initialForm = {
  name: '',
  email: '',
  source: '',
  destination: '',
  startDate: '',
  endDate: '',
  budget: '',
  travelers: '',
  travelType: '',
  preferences: [],
};

function App() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  const [tripData, setTripData] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const togglePreference = (pref) => {
    setForm((prev) => ({
      ...prev,
      preferences: prev.preferences.includes(pref)
        ? prev.preferences.filter((p) => p !== pref)
        : [...prev.preferences, pref],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setItinerary(null);
    setLoading(true);

    try {
            const apiBase = import.meta.env.VITE_API_URL || '';
      const { data } = await axios.post(`${apiBase}/api/trips`, {
        ...form,
        budget: Number(form.budget),
        travelers: Number(form.travelers),
      });
      setItinerary(data.itinerary);
      setTripData(data.trip);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="page">
      <header className="header">
        <div className="header-inner">
          <span className="header-icon">✈️</span>
          <h1>Trip Planner</h1>
          <p>Get a personalized itinerary in seconds</p>
        </div>
      </header>

      <main className="main">
        <form className="card form" onSubmit={handleSubmit} noValidate>
          <h2 className="section-title">Your Trip Details</h2>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Jane Doe"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="jane@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="source">Travelling From</label>
              <input
                id="source"
                name="source"
                type="text"
                placeholder="New York, USA"
                value={form.source}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="destination">Destination</label>
              <input
                id="destination"
                name="destination"
                type="text"
                placeholder="Paris, France"
                value={form.destination}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="startDate">Start Date</label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                min={today}
                value={form.startDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="endDate">End Date</label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                min={form.startDate || today}
                value={form.endDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="budget">Budget (USD)</label>
              <input
                id="budget"
                name="budget"
                type="number"
                placeholder="3000"
                min="0"
                value={form.budget}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="travelers">Number of Travelers</label>
              <input
                id="travelers"
                name="travelers"
                type="number"
                placeholder="2"
                min="1"
                value={form.travelers}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field field--full">
              <label htmlFor="travelType">Travel Type</label>
              <select
                id="travelType"
                name="travelType"
                value={form.travelType}
                onChange={handleChange}
                required
              >
                <option value="">Select a travel type</option>
                {TRAVEL_TYPES.map((t) => (
                  <option key={t} value={t.toLowerCase()}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label>Preferences <span className="label-hint">(select all that apply)</span></label>
            <div className="tags">
              {PREFERENCE_OPTIONS.map((pref) => (
                <button
                  key={pref}
                  type="button"
                  className={`tag${form.preferences.includes(pref) ? ' tag--active' : ''}`}
                  onClick={() => togglePreference(pref)}
                >
                  {pref}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="alert alert--error" role="alert">
              {error}
            </div>
          )}

          <button className="submit-btn" type="submit" disabled={loading}>
            {loading
              ? <><span className="spinner" aria-hidden="true" /> Planning your trip…</>
              : 'Generate Itinerary'}
          </button>
        </form>

        {loading && (
          <div className="loading-state" aria-live="polite">
            <span className="spinner spinner--lg" aria-hidden="true" />
            <p>Crafting your perfect itinerary, hang tight…</p>
          </div>
        )}

        {itinerary && !loading && (
          <section className="card itinerary" aria-label="Generated itinerary">
            <div className="itinerary-header">
              <div>
                <h2>Your Itinerary</h2>
                {tripData && (
                  <p className="itinerary-subtitle">
                    {tripData.source} → {tripData.destination}
                  </p>
                )}
              </div>
              <span className="badge">✨ AI Generated</span>
            </div>

            {tripData && (
              <div className="trip-meta">
                <div className="trip-meta-item">
                  <span className="trip-meta-label">Destination</span>
                  <span className="trip-meta-value">📍 {tripData.destination}</span>
                </div>
                <div className="trip-meta-item">
                  <span className="trip-meta-label">Dates</span>
                  <span className="trip-meta-value">
                    🗓 {new Date(tripData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' – '}
                    {new Date(tripData.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="trip-meta-item">
                  <span className="trip-meta-label">Budget</span>
                  <span className="trip-meta-value">💰 ${tripData.budget.toLocaleString()}</span>
                </div>
                <div className="trip-meta-item">
                  <span className="trip-meta-label">Travelers</span>
                  <span className="trip-meta-value">
                    👥 {tripData.travelers} {tripData.travelers === 1 ? 'person' : 'people'}
                  </span>
                </div>
                <div className="trip-meta-item">
                  <span className="trip-meta-label">Type</span>
                  <span className="trip-meta-value">
                    <span className="trip-type-badge">{tripData.travelType}</span>
                  </span>
                </div>
              </div>
            )}

            <div className="itinerary-body">
              {renderMarkdown(itinerary)}
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <p>Powered by Coodylabs · Built with React & Express</p>
      </footer>
    </div>
  );
}

export default App;
