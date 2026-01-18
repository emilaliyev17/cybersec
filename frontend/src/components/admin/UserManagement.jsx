import { useState, useEffect } from 'react';
import axios from 'axios';
import { apiUrl } from '../../config/api';
import { motion, AnimatePresence } from 'framer-motion';
import TrackSelector from './TrackSelector';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(apiUrl('/api/admin/users'));
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      setDetailsLoading(true);
      const response = await axios.get(apiUrl(`/api/admin/users/${userId}`));
      setUserDetails(response.data);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    fetchUserDetails(user.id);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(apiUrl(`/api/admin/users/${userId}/role`), { role: newRole });
      fetchUsers();
      if (selectedUser?.id === userId) {
        fetchUserDetails(userId);
      }
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleResetProgress = async (userId) => {
    if (!confirm('Are you sure you want to reset this user\'s progress? This cannot be undone.')) {
      return;
    }

    try {
      await axios.post(apiUrl(`/api/admin/users/${userId}/reset-progress`));
      fetchUsers();
      if (selectedUser?.id === userId) {
        fetchUserDetails(userId);
      }
    } catch (error) {
      console.error('Failed to reset progress:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(apiUrl(`/api/admin/users/${userId}`));
      fetchUsers();
      setSelectedUser(null);
      setUserDetails(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert(error.response?.data?.error || 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nano-purple"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* User List */}
      <div className="lg:col-span-9">
        <div className="glass-card">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Users ({users.length})</h2>
            <button
              onClick={fetchUsers}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Track</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => handleUserClick(user)}
                    className={`cursor-pointer transition-colors ${
                      selectedUser?.id === user.id ? 'bg-nano-purple/20' : 'hover:bg-white/5'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-nano-blue to-nano-purple flex items-center justify-center text-white font-bold">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-gray-500 text-sm">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                        user.role === 'manager' ? 'bg-nano-purple/20 text-nano-purple' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        user.track_name === 'FULL' ? 'bg-nano-blue/20 text-nano-blue' :
                        user.track_name === 'CONDENSED' ? 'bg-nano-purple/20 text-nano-purple' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {user.track_display_name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-800 rounded-full h-2">
                          <div
                            className="bg-nano-blue h-2 rounded-full"
                            style={{ width: `${user.total_modules > 0 ? (user.completed_modules / user.total_modules) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-400">
                          {user.completed_modules}/{user.total_modules}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.is_certified ? (
                        <span className="px-2 py-1 rounded-md text-xs font-medium bg-banano-green/20 text-banano-green">
                          Certified
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-md text-xs font-medium bg-banano-yellow/20 text-banano-yellow">
                          In Progress
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Details Panel */}
      <div className="lg:col-span-3">
        <AnimatePresence mode="wait">
          {selectedUser ? (
            <motion.div
              key={selectedUser.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-6 sticky top-28"
            >
              {detailsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nano-purple"></div>
                </div>
              ) : userDetails ? (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-nano-blue to-nano-purple flex items-center justify-center text-white text-2xl font-bold">
                      {userDetails.user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{userDetails.user.name}</h3>
                      <p className="text-gray-400">{userDetails.user.email}</p>
                    </div>
                  </div>

                  {/* Role Selector */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
                    <select
                      value={userDetails.user.role}
                      onChange={(e) => handleRoleChange(userDetails.user.id, e.target.value)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-nano-purple"
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {/* Track Selector */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Training Track</label>
                    <TrackSelector
                      userId={userDetails.user.id}
                      currentTrackId={selectedUser?.training_track_id}
                      onTrackChange={() => {
                        fetchUsers();
                        fetchUserDetails(userDetails.user.id);
                      }}
                    />
                  </div>

                  {/* Progress */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Module Progress</h4>
                    <div className="space-y-2">
                      {userDetails.progress.map((p) => (
                        <div key={p.module_id} className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            p.is_completed ? 'bg-banano-green' : 'bg-gray-700'
                          }`}>
                            {p.is_completed && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-sm ${p.is_completed ? 'text-white' : 'text-gray-500'}`}>
                            {p.module_title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quiz Attempts */}
                  {userDetails.quizAttempts.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Quiz Attempts</h4>
                      <div className="space-y-2">
                        {userDetails.quizAttempts.slice(0, 5).map((qa) => (
                          <div key={qa.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                            <span className="text-sm text-gray-400">
                              Attempt #{qa.attempt_number}
                            </span>
                            <span className={`text-sm font-bold ${qa.passed ? 'text-banano-green' : 'text-red-400'}`}>
                              {qa.score}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={() => handleResetProgress(userDetails.user.id)}
                      className="w-full py-2 px-4 rounded-xl bg-banano-yellow/20 text-banano-yellow hover:bg-banano-yellow/30 transition-colors text-sm font-medium"
                    >
                      Reset Progress
                    </button>
                    <button
                      onClick={() => handleDeleteUser(userDetails.user.id)}
                      className="w-full py-2 px-4 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium"
                    >
                      Delete User
                    </button>
                  </div>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-gray-500">Select a user to view details</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
