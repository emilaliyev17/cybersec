import { useState, useEffect } from 'react';
import axios from 'axios';
import { apiUrl } from '../../config/api';

export default function TrackSelector({ userId, currentTrackId, onTrackChange }) {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      const response = await axios.get(apiUrl('/api/tracks'));
      setTracks(response.data.tracks);
    } catch (error) {
      console.error('Failed to fetch tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = async (e) => {
    const newTrackId = e.target.value ? parseInt(e.target.value) : null;
    setSaving(true);
    try {
      await axios.put(apiUrl(`/api/admin/users/${userId}/track`), { trackId: newTrackId });
      onTrackChange?.(newTrackId);
    } catch (error) {
      console.error('Failed to update track:', error);
      alert('Failed to update track assignment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 animate-pulse">
        Loading tracks...
      </div>
    );
  }

  return (
    <div className="relative">
      <select
        value={currentTrackId || ''}
        onChange={handleChange}
        disabled={saving}
        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-nano-purple appearance-none cursor-pointer disabled:opacity-50"
      >
        <option value="">No Track Assigned</option>
        {tracks.map((track) => (
          <option key={track.id} value={track.id}>
            {track.display_name}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        {saving ? (
          <svg className="animate-spin h-4 w-4 text-nano-purple" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>
    </div>
  );
}
