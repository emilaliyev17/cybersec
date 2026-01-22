import { useState, useEffect } from 'react';
import axios from 'axios';
import { apiUrl } from '../../config/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChecklistManagement() {
  const [activeView, setActiveView] = useState('overview');
  const [stats, setStats] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [checklistDetails, setChecklistDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    user_ids: [],
    template_id: '',
    due_date: '',
    period_label: ''
  });

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    template_id: '',
    overdue: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeView === 'progress') {
      fetchChecklists();
    }
  }, [filters, activeView]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, templatesRes, usersRes] = await Promise.all([
        axios.get(apiUrl('/api/v2/checklists/admin/stats')),
        axios.get(apiUrl('/api/v2/checklists/admin/templates')),
        axios.get(apiUrl('/api/admin/users'))
      ]);
      setStats(statsRes.data);
      setTemplates(templatesRes.data.templates);
      setUsers(usersRes.data.users);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChecklists = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.template_id) params.append('template_id', filters.template_id);
      if (filters.overdue) params.append('overdue', 'true');

      const response = await axios.get(apiUrl(`/api/v2/checklists/admin/overview?${params.toString()}`));
      setChecklists(response.data.checklists);
    } catch (error) {
      console.error('Failed to fetch checklists:', error);
    }
  };

  const fetchChecklistDetails = async (checklistId) => {
    try {
      setDetailsLoading(true);
      const response = await axios.get(apiUrl(`/api/v2/checklists/${checklistId}`));
      setChecklistDetails(response.data);
    } catch (error) {
      console.error('Failed to fetch checklist details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleChecklistClick = (checklist) => {
    setSelectedChecklist(checklist);
    fetchChecklistDetails(checklist.id);
  };

  const handleAssign = async () => {
    if (!assignForm.user_ids.length || !assignForm.template_id) {
      alert('Please select users and a checklist template');
      return;
    }

    try {
      await axios.post(apiUrl('/api/v2/checklists/admin/assign'), assignForm);
      setShowAssignModal(false);
      setAssignForm({ user_ids: [], template_id: '', due_date: '', period_label: '' });
      fetchData();
      fetchChecklists();
    } catch (error) {
      console.error('Failed to assign checklist:', error);
      alert(error.response?.data?.error || 'Failed to assign checklist');
    }
  };

  const handleItemToggle = async (checklistId, itemId, isCompleted) => {
    try {
      await axios.put(apiUrl(`/api/v2/checklists/admin/items/${checklistId}/${itemId}`), {
        is_completed: !isCompleted
      });
      fetchChecklistDetails(checklistId);
      fetchChecklists();
      fetchData();
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  };

  const handleDeleteChecklist = async (checklistId) => {
    if (!confirm('Are you sure you want to remove this checklist assignment?')) {
      return;
    }

    try {
      await axios.delete(apiUrl(`/api/v2/checklists/admin/${checklistId}`));
      setSelectedChecklist(null);
      setChecklistDetails(null);
      fetchChecklists();
      fetchData();
    } catch (error) {
      console.error('Failed to delete checklist:', error);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.template_id) params.append('template_id', filters.template_id);

      const response = await axios.get(apiUrl(`/api/v2/checklists/admin/export?${params.toString()}`), {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'checklist-progress.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  const views = [
    { id: 'overview', label: 'Overview' },
    { id: 'templates', label: 'Templates' },
    { id: 'progress', label: 'All Progress' },
    { id: 'assign', label: 'Assign' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nano-purple"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Sub-navigation */}
      <div className="glass-card p-2 flex gap-2 mb-6 overflow-x-auto">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
              activeView === view.id
                ? 'bg-nano-purple text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>

      {/* Views */}
      {activeView === 'overview' && (
        <OverviewView stats={stats} templates={templates} />
      )}
      {activeView === 'templates' && (
        <TemplatesView templates={templates} />
      )}
      {activeView === 'progress' && (
        <ProgressView
          checklists={checklists}
          templates={templates}
          filters={filters}
          setFilters={setFilters}
          selectedChecklist={selectedChecklist}
          checklistDetails={checklistDetails}
          detailsLoading={detailsLoading}
          onChecklistClick={handleChecklistClick}
          onItemToggle={handleItemToggle}
          onDelete={handleDeleteChecklist}
          onExport={handleExport}
        />
      )}
      {activeView === 'assign' && (
        <AssignView
          users={users}
          templates={templates}
          assignForm={assignForm}
          setAssignForm={setAssignForm}
          onAssign={handleAssign}
        />
      )}
    </div>
  );
}

// Overview View
function OverviewView({ stats, templates }) {
  const statCards = [
    { label: 'Total Assigned', value: stats?.stats?.total_assigned || 0, color: 'nano-blue' },
    { label: 'In Progress', value: stats?.stats?.in_progress || 0, color: 'banano-yellow' },
    { label: 'Completed', value: stats?.stats?.completed || 0, color: 'banano-green' },
    { label: 'Overdue', value: stats?.stats?.overdue || 0, color: 'red-500' }
  ];

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-6"
          >
            <p className="text-4xl font-bold text-white mb-1">{stat.value}</p>
            <p className={`text-sm text-${stat.color}`}>{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* By Template Breakdown */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-white mb-4">Progress by Template</h3>
        <div className="space-y-4">
          {stats?.by_template?.map((template) => (
            <div key={template.template_id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div>
                <p className="text-white font-medium">{template.name}</p>
                <p className="text-sm text-gray-400">{template.assigned} assigned</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-banano-green font-bold">{template.completed}</p>
                  <p className="text-xs text-gray-500">completed</p>
                </div>
                {template.overdue > 0 && (
                  <div className="text-right">
                    <p className="text-red-400 font-bold">{template.overdue}</p>
                    <p className="text-xs text-gray-500">overdue</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// Templates View
function TemplatesView({ templates }) {
  const [expandedTemplate, setExpandedTemplate] = useState(null);

  return (
    <div className="space-y-4">
      {templates.map((template) => (
        <motion.div
          key={template.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden"
        >
          <button
            onClick={() => setExpandedTemplate(expandedTemplate === template.id ? null : template.id)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                template.template_id === 'ft-onboarding' ? 'bg-nano-blue/20' :
                template.template_id === 'contractor-onboarding' ? 'bg-nano-purple/20' :
                template.template_id === 'periodic-compliance' ? 'bg-banano-yellow/20' :
                'bg-banano-green/20'
              }`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-white font-bold">{template.name}</p>
                <p className="text-sm text-gray-400">{template.audience} | {template.trigger_event}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-white font-bold">{template.sections?.length || 0}</p>
                <p className="text-xs text-gray-500">sections</p>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${expandedTemplate === template.id ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          <AnimatePresence>
            {expandedTemplate === template.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-white/10"
              >
                <div className="p-6 space-y-4">
                  {template.sections?.map((section) => (
                    <div key={section.id} className="bg-white/5 rounded-xl p-4">
                      <h4 className="text-white font-medium mb-3">{section.title}</h4>
                      <div className="space-y-2">
                        {section.items?.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 text-sm"
                          >
                            <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center ${
                              item.is_mandatory ? 'bg-red-500/20' : 'bg-gray-700'
                            }`}>
                              {item.is_mandatory && (
                                <span className="text-red-400 text-xs">!</span>
                              )}
                            </div>
                            <div>
                              <p className="text-gray-300">{item.title}</p>
                              {item.subsection && (
                                <p className="text-xs text-gray-500">{item.subsection}</p>
                              )}
                              {item.auto_complete_trigger && (
                                <span className="text-xs text-nano-purple">Auto: {item.auto_complete_trigger}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}

// Progress View
function ProgressView({
  checklists,
  templates,
  filters,
  setFilters,
  selectedChecklist,
  checklistDetails,
  detailsLoading,
  onChecklistClick,
  onItemToggle,
  onDelete,
  onExport
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Checklist List */}
      <div className="lg:col-span-8">
        <div className="glass-card">
          {/* Filters */}
          <div className="px-6 py-4 border-b border-white/10 flex flex-wrap items-center gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-nano-purple"
            >
              <option value="">All Statuses</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={filters.template_id}
              onChange={(e) => setFilters({ ...filters, template_id: e.target.value })}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-nano-purple"
            >
              <option value="">All Templates</option>
              {templates.map((t) => (
                <option key={t.template_id} value={t.template_id}>{t.name}</option>
              ))}
            </select>

            <label className="flex items-center gap-2 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={filters.overdue}
                onChange={(e) => setFilters({ ...filters, overdue: e.target.checked })}
                className="rounded border-white/20 bg-white/5 text-nano-purple focus:ring-nano-purple"
              />
              Overdue Only
            </label>

            <button
              onClick={onExport}
              className="ml-auto px-4 py-2 bg-nano-purple/20 text-nano-purple rounded-xl text-sm font-medium hover:bg-nano-purple/30 transition-colors"
            >
              Export CSV
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Checklist</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {checklists.map((checklist) => (
                  <tr
                    key={checklist.id}
                    onClick={() => onChecklistClick(checklist)}
                    className={`cursor-pointer transition-colors ${
                      selectedChecklist?.id === checklist.id ? 'bg-nano-purple/20' : 'hover:bg-white/5'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nano-blue to-nano-purple flex items-center justify-center text-white text-sm font-bold">
                          {checklist.user_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{checklist.user_name}</p>
                          <p className="text-gray-500 text-xs">{checklist.user_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-white text-sm">{checklist.checklist_name}</p>
                      {checklist.target_user_name && (
                        <p className="text-xs text-nano-purple">
                          For: {checklist.target_user_name}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-800 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              checklist.completion_percentage === 100 ? 'bg-banano-green' :
                              checklist.completion_percentage > 0 ? 'bg-nano-blue' :
                              'bg-gray-600'
                            }`}
                            style={{ width: `${checklist.completion_percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-400">
                          {checklist.completed_items}/{checklist.total_items}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        checklist.status === 'completed' ? 'bg-banano-green/20 text-banano-green' :
                        checklist.status === 'in_progress' ? 'bg-nano-blue/20 text-nano-blue' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {checklist.status.replace('_', ' ')}
                      </span>
                      {checklist.is_overdue && (
                        <span className="ml-2 px-2 py-1 rounded-md text-xs font-medium bg-red-500/20 text-red-400">
                          Overdue
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {checklist.due_date ? new Date(checklist.due_date).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
                {checklists.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No checklists found matching filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Details Panel */}
      <div className="lg:col-span-4">
        <AnimatePresence mode="wait">
          {selectedChecklist ? (
            <motion.div
              key={selectedChecklist.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-6 sticky top-28 max-h-[80vh] overflow-y-auto"
            >
              {detailsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nano-purple"></div>
                </div>
              ) : checklistDetails ? (
                <>
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-white">{checklistDetails.checklist.checklist_name}</h3>
                    <p className="text-gray-400">{selectedChecklist.user_name}</p>
                    {selectedChecklist.target_user_name && (
                      <p className="text-sm text-nano-purple mt-1">
                        Pre-onboarding for: {selectedChecklist.target_user_name}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-nano-purple h-2 rounded-full"
                          style={{ width: `${checklistDetails.checklist.completion_percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-400">{checklistDetails.checklist.completion_percentage}%</span>
                    </div>
                  </div>

                  {/* Sections */}
                  <div className="space-y-4 mb-6">
                    {checklistDetails.sections?.map((section) => (
                      <div key={section.section_id} className="bg-white/5 rounded-xl p-4">
                        <h4 className="text-white font-medium mb-3 text-sm">{section.section_title}</h4>
                        <div className="space-y-2">
                          {section.items?.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => onItemToggle(selectedChecklist.id, item.id, item.is_completed)}
                              className="w-full flex items-start gap-3 text-left hover:bg-white/5 p-2 rounded-lg transition-colors"
                            >
                              <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center ${
                                item.is_completed ? 'bg-banano-green' : 'bg-gray-700'
                              }`}>
                                {item.is_completed && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <p className={`text-sm ${item.is_completed ? 'text-gray-400 line-through' : 'text-gray-300'}`}>
                                  {item.title}
                                </p>
                                {item.completed_by && (
                                  <p className="text-xs text-gray-500">by {item.completed_by}</p>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => onDelete(selectedChecklist.id)}
                    className="w-full py-2 px-4 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium"
                  >
                    Remove Assignment
                  </button>
                </>
              ) : null}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500">Select a checklist to view details</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Assign View
function AssignView({ users, templates, assignForm, setAssignForm, onAssign }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleUser = (userId) => {
    const current = assignForm.user_ids;
    const newIds = current.includes(userId)
      ? current.filter(id => id !== userId)
      : [...current, userId];
    setAssignForm({ ...assignForm, user_ids: newIds });
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredUsers.map(u => u.id);
    setAssignForm({ ...assignForm, user_ids: filteredIds });
  };

  const clearSelection = () => {
    setAssignForm({ ...assignForm, user_ids: [] });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* User Selection */}
      <div className="lg:col-span-8">
        <div className="glass-card">
          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Select Users</h3>
              <div className="flex gap-2">
                <button
                  onClick={selectAllFiltered}
                  className="px-3 py-1 text-sm text-nano-purple hover:bg-nano-purple/20 rounded-lg transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  className="px-3 py-1 text-sm text-gray-400 hover:bg-white/10 rounded-lg transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-nano-purple"
            />
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => toggleUser(user.id)}
                className={`w-full px-6 py-3 flex items-center gap-4 hover:bg-white/5 transition-colors ${
                  assignForm.user_ids.includes(user.id) ? 'bg-nano-purple/10' : ''
                }`}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                  assignForm.user_ids.includes(user.id)
                    ? 'bg-nano-purple border-nano-purple'
                    : 'border-white/20'
                }`}>
                  {assignForm.user_ids.includes(user.id) && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nano-blue to-nano-purple flex items-center justify-center text-white text-sm font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-white font-medium text-sm">{user.name}</p>
                  <p className="text-gray-500 text-xs">{user.email}</p>
                </div>
                <span className={`ml-auto px-2 py-1 rounded text-xs ${
                  user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                  user.role === 'manager' ? 'bg-nano-purple/20 text-nano-purple' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {user.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Assignment Form */}
      <div className="lg:col-span-4">
        <div className="glass-card p-6 sticky top-28">
          <h3 className="text-lg font-bold text-white mb-6">Assignment Details</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Selected Users ({assignForm.user_ids.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {assignForm.user_ids.slice(0, 5).map(id => {
                  const user = users.find(u => u.id === id);
                  return user ? (
                    <span key={id} className="px-2 py-1 bg-nano-purple/20 text-nano-purple rounded text-xs">
                      {user.name}
                    </span>
                  ) : null;
                })}
                {assignForm.user_ids.length > 5 && (
                  <span className="px-2 py-1 bg-white/10 text-gray-400 rounded text-xs">
                    +{assignForm.user_ids.length - 5} more
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Checklist Template *</label>
              <select
                value={assignForm.template_id}
                onChange={(e) => setAssignForm({ ...assignForm, template_id: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-nano-purple"
              >
                <option value="">Select template...</option>
                {templates.map((t) => (
                  <option key={t.template_id} value={t.template_id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Due Date (Optional)</label>
              <input
                type="date"
                value={assignForm.due_date}
                onChange={(e) => setAssignForm({ ...assignForm, due_date: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-nano-purple"
              />
            </div>

            {templates.find(t => t.template_id === assignForm.template_id)?.is_recurring && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Period Label (Required for recurring)</label>
                <input
                  type="text"
                  placeholder="e.g., Q1 2026, 2026 Annual"
                  value={assignForm.period_label}
                  onChange={(e) => setAssignForm({ ...assignForm, period_label: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-nano-purple"
                />
              </div>
            )}

            <button
              onClick={onAssign}
              disabled={!assignForm.user_ids.length || !assignForm.template_id}
              className="w-full py-3 px-4 rounded-xl bg-nano-purple text-white font-medium hover:bg-nano-purple/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Assign Checklist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
