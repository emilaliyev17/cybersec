import { useState, useEffect } from 'react';
import axios from 'axios';
import { apiUrl } from '../../config/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function TrackManagement() {
  const [tracks, setTracks] = useState([]);
  const [allModules, setAllModules] = useState([]);
  const [userCounts, setUserCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTrackData();
  }, []);

  const fetchTrackData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(apiUrl('/api/tracks/admin/all'));
      setTracks(response.data.tracks);
      setAllModules(response.data.allModules);
      setUserCounts(response.data.userCounts);
    } catch (error) {
      console.error('Failed to fetch track data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isModuleInTrack = (track, moduleId) => {
    return track.modules.some(m => m.module_id === moduleId);
  };

  const handleToggleModule = async (trackId, moduleId, currentlyInTrack) => {
    setSaving(true);
    try {
      if (currentlyInTrack) {
        await axios.delete(apiUrl(`/api/tracks/${trackId}/modules/${moduleId}`));
      } else {
        await axios.post(apiUrl(`/api/tracks/${trackId}/modules`), { moduleId });
      }
      await fetchTrackData();
    } catch (error) {
      console.error('Failed to toggle module:', error);
      alert('Failed to update track');
    } finally {
      setSaving(false);
    }
  };

  const handleReorderModules = async (trackId, moduleId, direction) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    const moduleIndex = track.modules.findIndex(m => m.module_id === moduleId);
    if (moduleIndex === -1) return;

    const newIndex = direction === 'up' ? moduleIndex - 1 : moduleIndex + 1;
    if (newIndex < 0 || newIndex >= track.modules.length) return;

    // Create new order array
    const newModules = [...track.modules];
    const [movedModule] = newModules.splice(moduleIndex, 1);
    newModules.splice(newIndex, 0, movedModule);

    // Generate new display orders
    const moduleOrders = newModules.map((m, idx) => ({
      moduleId: m.module_id,
      displayOrder: idx + 1
    }));

    setSaving(true);
    try {
      await axios.put(apiUrl(`/api/tracks/${trackId}/modules/reorder`), { moduleOrders });
      await fetchTrackData();
    } catch (error) {
      console.error('Failed to reorder modules:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nano-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Track Management</h2>
          <p className="text-gray-400 mt-1">Configure which modules appear in each training track</p>
        </div>
        {saving && (
          <span className="text-nano-blue flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Saving...
          </span>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tracks.map((track) => (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{track.display_name}</h3>
                <p className="text-sm text-gray-400">{track.modules.length} modules</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-nano-blue">
                  {userCounts[track.id] || 0}
                </span>
                <p className="text-xs text-gray-500">users</p>
              </div>
            </div>
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 border-dashed border-gray-600"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-400">Unassigned</h3>
              <p className="text-sm text-gray-500">No track assigned</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-400">
                {userCounts['unassigned'] || userCounts[null] || 0}
              </span>
              <p className="text-xs text-gray-500">users</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Track Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tracks.map((track) => (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card overflow-hidden"
          >
            {/* Track Header */}
            <div className={`p-4 ${track.name === 'FULL' ? 'bg-nano-blue/20' : 'bg-nano-purple/20'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  track.name === 'FULL' ? 'bg-nano-blue' : 'bg-nano-purple'
                }`}>
                  {track.name === 'FULL' ? (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{track.display_name}</h3>
                  <p className="text-sm text-gray-400">
                    {track.name === 'FULL' ? 'New Employees' : 'Existing Employees'}
                  </p>
                </div>
              </div>
            </div>

            {/* Module List */}
            <div className="p-4 space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                Modules in this track ({track.modules.length})
              </p>

              {/* All available modules */}
              {allModules.map((module) => {
                const inTrack = isModuleInTrack(track, module.id);
                const trackModule = track.modules.find(m => m.module_id === module.id);
                const moduleIndex = trackModule ? track.modules.indexOf(trackModule) : -1;

                return (
                  <motion.div
                    key={module.id}
                    layout
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      inTrack
                        ? 'bg-white/5 border-white/20'
                        : 'bg-gray-900/50 border-gray-700/50 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggleModule(track.id, module.id, inTrack)}
                        disabled={saving}
                        className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                          inTrack
                            ? track.name === 'FULL' ? 'bg-nano-blue' : 'bg-nano-purple'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        {inTrack && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>

                      {/* Module Info */}
                      <div>
                        <p className={`font-medium ${inTrack ? 'text-white' : 'text-gray-500'}`}>
                          {module.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {Math.round((module.required_time_seconds || 0) / 60)} min
                          {!module.is_active && ' • Inactive'}
                        </p>
                      </div>
                    </div>

                    {/* Reorder buttons (only for modules in track) */}
                    {inTrack && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleReorderModules(track.id, module.id, 'up')}
                          disabled={saving || moduleIndex === 0}
                          className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleReorderModules(track.id, module.id, 'down')}
                          disabled={saving || moduleIndex === track.modules.length - 1}
                          className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Track Description */}
            <div className="px-4 pb-4">
              <p className="text-xs text-gray-500 italic">{track.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Help Text */}
      <div className="glass-card p-4 border-dashed border-gray-600">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-white mb-1">How Track Management Works</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• <strong>FULL Track:</strong> Assigned to new employees. Includes all modules and the 20-step onboarding checklist.</li>
              <li>• <strong>CONDENSED Track:</strong> Assigned to existing employees. Includes only essential refresher modules and bio update.</li>
              <li>• Use checkboxes to add/remove modules from each track</li>
              <li>• Use arrows to reorder modules within a track</li>
              <li>• Changes are saved automatically</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
