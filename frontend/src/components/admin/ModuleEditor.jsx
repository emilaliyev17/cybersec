import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

export default function ModuleEditor() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingModule, setEditingModule] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/modules');
      setModules(response.data.modules);
    } catch (error) {
      console.error('Failed to fetch modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveModule = async (moduleData) => {
    try {
      if (moduleData.id) {
        await axios.put(`/api/admin/modules/${moduleData.id}`, moduleData);
      } else {
        await axios.post('/api/admin/modules', moduleData);
      }
      fetchModules();
      setEditingModule(null);
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to save module:', error);
      alert('Failed to save module');
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!confirm('Are you sure you want to delete this module? This cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/api/admin/modules/${moduleId}`);
      fetchModules();
    } catch (error) {
      console.error('Failed to delete module:', error);
      alert('Failed to delete module');
    }
  };

  const handleToggleActive = async (module) => {
    try {
      await axios.put(`/api/admin/modules/${module.id}`, {
        is_active: !module.is_active
      });
      fetchModules();
    } catch (error) {
      console.error('Failed to toggle module:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nano-purple"></div>
      </div>
    );
  }

  if (editingModule || isCreating) {
    return (
      <ModuleForm
        module={editingModule}
        onSave={handleSaveModule}
        onCancel={() => {
          setEditingModule(null);
          setIsCreating(false);
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Training Modules</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="btn-neon-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Module
        </button>
      </div>

      <div className="space-y-4">
        {modules.map((module, index) => (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`glass-card p-6 ${!module.is_active ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 rounded-md text-xs font-medium bg-nano-purple/20 text-nano-purple">
                    Order: {module.module_order}
                  </span>
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                    module.content_json?.type === 'video'
                      ? 'bg-nano-blue/20 text-nano-blue'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {module.content_json?.type === 'video' ? 'Video' : 'Interactive'}
                  </span>
                  {!module.is_active && (
                    <span className="px-2 py-1 rounded-md text-xs font-medium bg-red-500/20 text-red-400">
                      Inactive
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{module.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{module.description}</p>

                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {Math.round(module.required_time_seconds / 60)} min
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {module.completions || 0} completions
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {module.total_starts || 0} starts
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleToggleActive(module)}
                  className={`p-2 rounded-lg transition-colors ${
                    module.is_active
                      ? 'bg-banano-green/20 text-banano-green hover:bg-banano-green/30'
                      : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                  }`}
                  title={module.is_active ? 'Deactivate' : 'Activate'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {module.is_active ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    )}
                  </svg>
                </button>
                <button
                  onClick={() => setEditingModule(module)}
                  className="p-2 rounded-lg bg-nano-blue/20 text-nano-blue hover:bg-nano-blue/30 transition-colors"
                  title="Edit"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteModule(module.id)}
                  className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  title="Delete"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Module Form Component
function ModuleForm({ module, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: module?.title || '',
    description: module?.description || '',
    module_order: module?.module_order || 1,
    required_time_seconds: module?.required_time_seconds || 300,
    content_json: module?.content_json || { type: 'interactive', sections: [], key_takeaways: [] },
  });

  const [activeContentTab, setActiveContentTab] = useState('basic');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: module?.id,
    });
  };

  const isVideoModule = formData.content_json?.type === 'video';

  const addVideo = () => {
    setFormData(prev => ({
      ...prev,
      content_json: {
        ...prev.content_json,
        videos: [...(prev.content_json.videos || []), { title: '', description: '', url: '' }]
      }
    }));
  };

  const updateVideo = (index, field, value) => {
    setFormData(prev => {
      const videos = [...(prev.content_json.videos || [])];
      videos[index] = { ...videos[index], [field]: value };
      return {
        ...prev,
        content_json: { ...prev.content_json, videos }
      };
    });
  };

  const removeVideo = (index) => {
    setFormData(prev => ({
      ...prev,
      content_json: {
        ...prev.content_json,
        videos: prev.content_json.videos.filter((_, i) => i !== index)
      }
    }));
  };

  const addSection = () => {
    setFormData(prev => ({
      ...prev,
      content_json: {
        ...prev.content_json,
        sections: [...(prev.content_json.sections || []), { id: `section_${Date.now()}`, title: '', content: '' }]
      }
    }));
  };

  const updateSection = (index, field, value) => {
    setFormData(prev => {
      const sections = [...(prev.content_json.sections || [])];
      sections[index] = { ...sections[index], [field]: value };
      return {
        ...prev,
        content_json: { ...prev.content_json, sections }
      };
    });
  };

  const removeSection = (index) => {
    setFormData(prev => ({
      ...prev,
      content_json: {
        ...prev.content_json,
        sections: prev.content_json.sections.filter((_, i) => i !== index)
      }
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">
          {module ? 'Edit Module' : 'Create Module'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="glass-card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-neon"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Module Order</label>
            <input
              type="number"
              value={formData.module_order}
              onChange={(e) => setFormData({ ...formData, module_order: parseInt(e.target.value) })}
              className="input-neon"
              min="1"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-neon min-h-[100px]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Module Type</label>
            <select
              value={formData.content_json?.type || 'interactive'}
              onChange={(e) => setFormData({
                ...formData,
                content_json: {
                  ...formData.content_json,
                  type: e.target.value,
                  videos: e.target.value === 'video' ? [] : undefined,
                  sections: e.target.value === 'interactive' ? [] : undefined,
                }
              })}
              className="input-neon"
            >
              <option value="interactive">Interactive (Text)</option>
              <option value="video">Video</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Required Time (seconds)</label>
            <input
              type="number"
              value={formData.required_time_seconds}
              onChange={(e) => setFormData({ ...formData, required_time_seconds: parseInt(e.target.value) })}
              className="input-neon"
              min="60"
              required
            />
          </div>
        </div>
      </div>

      {/* Content Editor */}
      <div className="glass-card p-6 mb-6">
        <h3 className="text-lg font-bold text-white mb-4">
          {isVideoModule ? 'Videos' : 'Sections'}
        </h3>

        {isVideoModule ? (
          <div className="space-y-4">
            {(formData.content_json.videos || []).map((video, index) => (
              <div key={index} className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-nano-blue">Video {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeVideo(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Video title"
                    value={video.title}
                    onChange={(e) => updateVideo(index, 'title', e.target.value)}
                    className="input-neon"
                  />
                  <input
                    type="url"
                    placeholder="Video URL (e.g., https://storage.googleapis.com/...)"
                    value={video.url}
                    onChange={(e) => updateVideo(index, 'url', e.target.value)}
                    className="input-neon"
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={video.description}
                    onChange={(e) => updateVideo(index, 'description', e.target.value)}
                    className="input-neon min-h-[60px]"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addVideo}
              className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-gray-400 hover:text-white hover:border-nano-blue transition-colors"
            >
              + Add Video
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {(formData.content_json.sections || []).map((section, index) => (
              <div key={index} className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-nano-blue">Section {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeSection(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Section title"
                    value={section.title}
                    onChange={(e) => updateSection(index, 'title', e.target.value)}
                    className="input-neon"
                  />
                  <textarea
                    placeholder="Section content"
                    value={section.content}
                    onChange={(e) => updateSection(index, 'content', e.target.value)}
                    className="input-neon min-h-[100px]"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addSection}
              className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-gray-400 hover:text-white hover:border-nano-blue transition-colors"
            >
              + Add Section
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn-neon-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-neon-primary"
        >
          {module ? 'Save Changes' : 'Create Module'}
        </button>
      </div>
    </form>
  );
}
