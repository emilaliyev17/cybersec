import { useState, useEffect } from 'react';
import axios from 'axios';
import { apiUrl } from '../../config/api';
import { motion } from 'framer-motion';

export default function OnboardingProgressWidget() {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, overviewRes] = await Promise.all([
        axios.get(apiUrl('/api/v2/checklists/admin/stats')),
        axios.get(apiUrl('/api/v2/checklists/admin/overview'))
      ]);
      setStats(statsRes.data);

      // Get users with incomplete checklists, overdue first
      const checklists = overviewRes.data.checklists || [];
      const incomplete = checklists
        .filter(c => c.status !== 'completed')
        .sort((a, b) => {
          if (a.is_overdue && !b.is_overdue) return -1;
          if (!a.is_overdue && b.is_overdue) return 1;
          return b.completion_percentage - a.completion_percentage;
        })
        .slice(0, 5);
      setRecentActivity(incomplete);
    } catch (error) {
      console.error('Failed to fetch checklist stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nano-purple"></div>
        </div>
      </motion.div>
    );
  }

  if (!stats?.stats?.total_assigned) {
    return null; // Don't show widget if no checklists assigned
  }

  const completionRate = stats.stats.total_assigned > 0
    ? Math.round((stats.stats.completed / stats.stats.total_assigned) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="glass-card p-6 mt-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-nano-purple/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-nano-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Onboarding Progress</h3>
            <p className="text-xs text-gray-400">Assigned checklists overview</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {stats.stats.overdue > 0 && (
            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm font-bold flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {stats.stats.overdue} overdue
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{stats.stats.total_assigned}</p>
          <p className="text-xs text-gray-500">Assigned</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-nano-blue">{stats.stats.in_progress}</p>
          <p className="text-xs text-gray-500">In Progress</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-banano-green">{stats.stats.completed}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-nano-purple">{completionRate}%</p>
          <p className="text-xs text-gray-500">Completion</p>
        </div>
      </div>

      {/* By Template Breakdown */}
      {stats.by_template && stats.by_template.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-400 mb-3">By Template</h4>
          <div className="space-y-2">
            {stats.by_template.filter(t => t.assigned > 0).map((template) => (
              <div key={template.template_id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                <span className="text-sm text-white">{template.name}</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">{template.completed}/{template.assigned}</span>
                    <div className="w-16 bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-nano-purple h-1.5 rounded-full"
                        style={{ width: `${template.assigned > 0 ? (template.completed / template.assigned) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  {template.overdue > 0 && (
                    <span className="text-xs text-red-400">{template.overdue} late</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users with Incomplete Checklists */}
      {recentActivity.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-3">Users with Incomplete Checklists</h4>
          <div className="space-y-2">
            {recentActivity.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  item.is_overdue ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nano-blue to-nano-purple flex items-center justify-center text-white text-xs font-bold">
                    {item.user_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-white">{item.user_name}</p>
                    <p className="text-xs text-gray-500">{item.checklist_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`text-sm font-bold ${item.is_overdue ? 'text-red-400' : 'text-white'}`}>
                      {item.completion_percentage}%
                    </p>
                    <p className="text-xs text-gray-500">{item.completed_items}/{item.total_items}</p>
                  </div>
                  {item.is_overdue && (
                    <span className="text-xs text-red-400">Overdue</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
