import { useState, useEffect } from 'react';
import axios from 'axios';
import { apiUrl } from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserChecklists() {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [checklistDetails, setChecklistDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    fetchChecklists();
  }, []);

  const fetchChecklists = async () => {
    try {
      setLoading(true);
      const response = await axios.get(apiUrl('/api/v2/checklists/my'));
      setChecklists(response.data.checklists);

      // Auto-select first incomplete checklist
      const firstIncomplete = response.data.checklists.find(c => c.status !== 'completed');
      if (firstIncomplete) {
        handleChecklistSelect(firstIncomplete);
      }
    } catch (error) {
      console.error('Failed to fetch checklists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistSelect = async (checklist) => {
    setSelectedChecklist(checklist);
    try {
      setDetailsLoading(true);
      const response = await axios.get(apiUrl(`/api/v2/checklists/${checklist.id}`));
      setChecklistDetails(response.data);

      // Auto-expand first incomplete section
      const sections = response.data.sections || [];
      const firstIncomplete = sections.find(s =>
        s.items?.some(i => !i.is_completed)
      );
      if (firstIncomplete) {
        setExpandedSections({ [firstIncomplete.section_id]: true });
      }
    } catch (error) {
      console.error('Failed to fetch checklist details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleItemToggle = async (itemId, isCompleted) => {
    if (!selectedChecklist) return;

    try {
      const response = await axios.put(
        apiUrl(`/api/v2/checklists/${selectedChecklist.id}/items/${itemId}`),
        { is_completed: !isCompleted }
      );

      // Update local state
      setChecklistDetails(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          checklist: {
            ...prev.checklist,
            completed_items: response.data.progress.completed,
            completion_percentage: response.data.progress.percentage
          },
          sections: prev.sections.map(section => ({
            ...section,
            items: section.items?.map(item =>
              item.id === parseInt(itemId)
                ? { ...item, is_completed: !isCompleted, completed_at: !isCompleted ? new Date().toISOString() : null }
                : item
            )
          }))
        };
      });

      // Refresh checklists to update the summary
      if (response.data.checklist_status !== selectedChecklist.status) {
        fetchChecklists();
      }
    } catch (error) {
      console.error('Failed to toggle item:', error);
    }
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nano-purple"></div>
      </div>
    );
  }

  if (checklists.length === 0) {
    return null; // Don't render if no checklists assigned
  }

  // Calculate total progress across all checklists
  const totalItems = checklists.reduce((sum, c) => sum + parseInt(c.total_items || 0), 0);
  const completedItems = checklists.reduce((sum, c) => sum + parseInt(c.completed_items || 0), 0);
  const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Onboarding Checklists</h2>
          <p className="text-gray-400 text-sm">Complete your assigned checklists</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-3xl font-bold text-white">{overallProgress}%</p>
            <p className="text-xs text-gray-500">overall progress</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center relative">
            <svg className="w-full h-full absolute" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={overallProgress === 100 ? '#4CBF4B' : '#7C3AED'}
                strokeWidth="3"
                strokeDasharray={`${overallProgress}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <svg className="w-6 h-6 text-nano-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
        </div>
      </div>

      {/* Checklist Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Checklist List */}
        <div className="lg:col-span-4 space-y-3">
          {checklists.map((checklist) => (
            <motion.button
              key={checklist.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleChecklistSelect(checklist)}
              className={`w-full glass-card p-4 text-left transition-all ${
                selectedChecklist?.id === checklist.id
                  ? 'border-nano-purple/50 bg-nano-purple/10'
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-white text-sm">{checklist.checklist_name}</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  checklist.status === 'completed' ? 'bg-banano-green/20 text-banano-green' :
                  checklist.status === 'in_progress' ? 'bg-nano-blue/20 text-nano-blue' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {checklist.status.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      checklist.status === 'completed' ? 'bg-banano-green' : 'bg-nano-purple'
                    }`}
                    style={{ width: `${checklist.total_items > 0 ? (checklist.completed_items / checklist.total_items) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {checklist.completed_items}/{checklist.total_items}
                </span>
              </div>

              {checklist.due_date && (
                <p className={`text-xs ${
                  new Date(checklist.due_date) < new Date() && checklist.status !== 'completed'
                    ? 'text-red-400'
                    : 'text-gray-500'
                }`}>
                  Due: {new Date(checklist.due_date).toLocaleDateString()}
                </p>
              )}
            </motion.button>
          ))}
        </div>

        {/* Checklist Details */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {detailsLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card p-8 flex items-center justify-center h-96"
              >
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-nano-purple"></div>
              </motion.div>
            ) : checklistDetails ? (
              <motion.div
                key={selectedChecklist?.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card overflow-hidden"
              >
                {/* Checklist Header */}
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">{checklistDetails.checklist.checklist_name}</h3>
                      <p className="text-gray-400 text-sm mt-1">{checklistDetails.checklist.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-bold text-nano-purple">{checklistDetails.checklist.completion_percentage}%</p>
                      <p className="text-xs text-gray-500">{checklistDetails.checklist.completed_items} of {checklistDetails.checklist.total_items} items</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 w-full bg-gray-800 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${checklistDetails.checklist.completion_percentage}%` }}
                      transition={{ duration: 0.5 }}
                      className={`h-2 rounded-full ${
                        checklistDetails.checklist.completion_percentage === 100 ? 'bg-banano-green' : 'bg-nano-purple'
                      }`}
                    />
                  </div>
                </div>

                {/* Sections */}
                <div className="max-h-[60vh] overflow-y-auto">
                  {checklistDetails.sections?.map((section) => {
                    const sectionItems = section.items || [];
                    const sectionCompleted = sectionItems.filter(i => i.is_completed).length;
                    const sectionTotal = sectionItems.length;
                    const isExpanded = expandedSections[section.section_id];

                    return (
                      <div key={section.section_id} className="border-b border-white/5 last:border-0">
                        <button
                          onClick={() => toggleSection(section.section_id)}
                          className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              sectionCompleted === sectionTotal
                                ? 'bg-banano-green/20 text-banano-green'
                                : 'bg-white/10 text-gray-400'
                            }`}>
                              {sectionCompleted === sectionTotal ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <span className="text-xs font-bold">{sectionCompleted}/{sectionTotal}</span>
                              )}
                            </div>
                            <span className="font-medium text-white">{section.section_title}</span>
                          </div>
                          <svg
                            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 pb-4 space-y-2">
                                {sectionItems.map((item) => {
                                  // Group by subsection
                                  const showSubsection = item.subsection &&
                                    sectionItems.indexOf(item) === sectionItems.findIndex(i => i.subsection === item.subsection);

                                  return (
                                    <div key={item.id}>
                                      {showSubsection && (
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mt-4 mb-2 font-medium">
                                          {item.subsection}
                                        </p>
                                      )}
                                      <motion.button
                                        whileHover={{ scale: 1.005 }}
                                        whileTap={{ scale: 0.995 }}
                                        onClick={() => handleItemToggle(item.id, item.is_completed)}
                                        className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all ${
                                          item.is_completed
                                            ? 'bg-banano-green/10 hover:bg-banano-green/15'
                                            : 'bg-white/5 hover:bg-white/10'
                                        }`}
                                      >
                                        <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                                          item.is_completed
                                            ? 'bg-banano-green border-banano-green'
                                            : 'border-gray-600 hover:border-nano-purple'
                                        }`}>
                                          {item.is_completed && (
                                            <motion.svg
                                              initial={{ scale: 0 }}
                                              animate={{ scale: 1 }}
                                              className="w-3.5 h-3.5 text-white"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </motion.svg>
                                          )}
                                        </div>
                                        <div className="flex-1">
                                          <p className={`text-sm ${
                                            item.is_completed ? 'text-gray-400 line-through' : 'text-white'
                                          }`}>
                                            {item.title}
                                          </p>
                                          {item.description && (
                                            <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                                          )}
                                          {item.is_mandatory && !item.is_completed && (
                                            <span className="text-xs text-red-400 mt-1 inline-block">Required</span>
                                          )}
                                          {item.auto_complete_trigger && (
                                            <span className="text-xs text-nano-purple mt-1 inline-block">
                                              Auto-completes on: {item.auto_complete_trigger.replace('_', ' ')}
                                            </span>
                                          )}
                                        </div>
                                      </motion.button>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>

                {/* Completion Message */}
                {checklistDetails.checklist.completion_percentage === 100 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-banano-green/10 border-t border-banano-green/20"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-banano-green/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-banano-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-banano-green">Checklist Complete!</p>
                        <p className="text-sm text-gray-400">Great job completing all items in this checklist.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-8 text-center h-96 flex flex-col items-center justify-center"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-500">Select a checklist to view items</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
