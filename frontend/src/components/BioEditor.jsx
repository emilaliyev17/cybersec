import { useState, useEffect } from 'react';
import axios from 'axios';
import { apiUrl } from '../config/api';
import { motion } from 'framer-motion';

export default function BioEditor({ onComplete, onClose }) {
  const [bio, setBio] = useState({
    bio_text: '',
    job_title: '',
    department: '',
    location: '',
    skills: [],
    linkedin_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    fetchBio();
  }, []);

  const fetchBio = async () => {
    try {
      const response = await axios.get(apiUrl('/api/bio'));
      if (response.data.bio) {
        setBio({
          ...response.data.bio,
          skills: response.data.bio.skills || []
        });
      }
    } catch (error) {
      console.error('Failed to fetch bio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(apiUrl('/api/bio'), bio);
      onComplete?.();
    } catch (error) {
      console.error('Failed to save bio:', error);
      alert('Failed to save bio');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !bio.skills.includes(newSkill.trim())) {
      setBio({ ...bio, skills: [...bio.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setBio({ ...bio, skills: bio.skills.filter(s => s !== skillToRemove) });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nano-purple"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-nano-purple to-pink-600 flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Update Your Bio</h2>
          <p className="text-gray-400 text-sm">Share information about yourself with your colleagues</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Bio Text */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            About Me <span className="text-red-400">*</span>
          </label>
          <textarea
            value={bio.bio_text || ''}
            onChange={(e) => setBio({ ...bio, bio_text: e.target.value })}
            rows={4}
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-nano-purple resize-none"
            placeholder="Tell us about yourself, your background, and interests..."
          />
        </div>

        {/* Job Title & Department */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Job Title</label>
            <input
              type="text"
              value={bio.job_title || ''}
              onChange={(e) => setBio({ ...bio, job_title: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-nano-purple"
              placeholder="e.g., Senior Software Engineer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Department</label>
            <input
              type="text"
              value={bio.department || ''}
              onChange={(e) => setBio({ ...bio, department: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-nano-purple"
              placeholder="e.g., Engineering"
            />
          </div>
        </div>

        {/* Location & LinkedIn */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
            <input
              type="text"
              value={bio.location || ''}
              onChange={(e) => setBio({ ...bio, location: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-nano-purple"
              placeholder="e.g., San Francisco, CA"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">LinkedIn Profile</label>
            <input
              type="url"
              value={bio.linkedin_url || ''}
              onChange={(e) => setBio({ ...bio, linkedin_url: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-nano-purple"
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Skills</label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-nano-purple"
              placeholder="Add a skill and press Enter"
            />
            <button
              type="button"
              onClick={addSkill}
              className="px-4 py-3 bg-nano-purple text-white rounded-xl hover:bg-nano-purple/80 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(bio.skills || []).map((skill) => (
              <motion.span
                key={skill}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-3 py-1.5 bg-nano-purple/20 text-nano-purple rounded-lg flex items-center gap-2 text-sm"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="hover:text-red-400 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.span>
            ))}
            {bio.skills?.length === 0 && (
              <span className="text-sm text-gray-500 italic">No skills added yet</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={saving || !bio.bio_text?.trim()}
            className="flex-1 py-3 bg-gradient-to-r from-nano-purple to-pink-600 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Bio
              </>
            )}
          </motion.button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-white/20 text-gray-400 rounded-xl hover:text-white hover:border-white/40 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
