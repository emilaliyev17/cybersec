import { useState, useEffect } from 'react';
import axios from 'axios';
import { apiUrl } from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function OnboardingChecklist() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [checklistRes, summaryRes] = await Promise.all([
        axios.get(apiUrl('/api/checklist/by-category')),
        axios.get(apiUrl('/api/checklist/summary'))
      ]);
      setCategories(checklistRes.data.categories);
      setSummary(summaryRes.data.summary);

      // Auto-expand first incomplete category
      const firstIncomplete = checklistRes.data.categories.find(c => c.completed < c.total);
      if (firstIncomplete) {
        setExpandedCategory(firstIncomplete.category);
      }
    } catch (error) {
      console.error('Failed to fetch checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (itemId, currentStatus) => {
    try {
      await axios.put(apiUrl(`/api/checklist/${itemId}`), { is_completed: !currentStatus });
      await fetchData();
    } catch (error) {
      console.error('Failed to update checklist item:', error);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6 mb-8">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nano-blue"></div>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="glass-card p-6 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-nano-blue to-nano-purple flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Onboarding Checklist</h2>
            <p className="text-gray-400 text-sm">Complete all tasks to finish your onboarding</p>
          </div>
        </div>
        {summary && (
          <div className="text-right">
            <div className="text-3xl font-bold bg-gradient-to-r from-nano-blue to-nano-purple bg-clip-text text-transparent">
              {summary.completion_percentage}%
            </div>
            <p className="text-gray-500 text-sm">
              {summary.completed_items} of {summary.total_items} complete
            </p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {summary && (
        <div className="w-full bg-gray-800 rounded-full h-2 mb-6">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${summary.completion_percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="bg-gradient-to-r from-nano-blue to-nano-purple h-2 rounded-full"
          />
        </div>
      )}

      {/* Categories */}
      <div className="space-y-3">
        {categories.map((category) => {
          const isExpanded = expandedCategory === category.category;
          const isComplete = category.completed === category.total;

          return (
            <div key={category.category} className="border border-white/10 rounded-xl overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category.category)}
                className={`w-full p-4 flex items-center justify-between transition-colors ${
                  isComplete ? 'bg-banano-green/10' : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isComplete ? 'bg-banano-green' : 'bg-gray-700'
                  }`}>
                    {isComplete ? (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-white text-sm font-medium">{category.completed}</span>
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className={`font-medium ${isComplete ? 'text-banano-green' : 'text-white'}`}>
                      {category.category}
                    </h3>
                    <p className="text-xs text-gray-500">{category.completed} of {category.total} completed</p>
                  </div>
                </div>
                <motion.svg
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </button>

              {/* Items */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-2 space-y-1 bg-black/20">
                      {category.items.map((item) => (
                        <motion.div
                          key={item.id}
                          whileHover={{ x: 4 }}
                          onClick={() => handleToggle(item.id, item.is_completed)}
                          className={`p-3 rounded-lg cursor-pointer flex items-start gap-3 transition-colors ${
                            item.is_completed
                              ? 'bg-banano-green/10'
                              : 'hover:bg-white/5'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
                            item.is_completed ? 'bg-banano-green' : 'bg-gray-700'
                          }`}>
                            {item.is_completed && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm ${item.is_completed ? 'text-banano-green line-through' : 'text-white'}`}>
                              {item.title}
                            </p>
                            {item.description && (
                              <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
