import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

export default function QuizResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, passed, failed

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/quiz/results');
      setResults(response.data.results);
    } catch (error) {
      console.error('Failed to fetch results:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter(r => {
    if (filter === 'passed') return r.passed;
    if (filter === 'failed') return !r.passed;
    return true;
  });

  const stats = {
    total: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    avgScore: results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + parseFloat(r.score), 0) / results.length)
      : 0,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nano-purple"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <p className="text-3xl font-bold text-white">{stats.total}</p>
          <p className="text-sm text-gray-400">Total Attempts</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <p className="text-3xl font-bold text-banano-green">{stats.passed}</p>
          <p className="text-sm text-gray-400">Passed</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4"
        >
          <p className="text-3xl font-bold text-red-400">{stats.failed}</p>
          <p className="text-sm text-gray-400">Failed</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-4"
        >
          <p className="text-3xl font-bold text-nano-blue">{stats.avgScore}%</p>
          <p className="text-sm text-gray-400">Average Score</p>
        </motion.div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-nano-purple text-white'
              : 'bg-white/5 text-gray-400 hover:text-white'
          }`}
        >
          All ({stats.total})
        </button>
        <button
          onClick={() => setFilter('passed')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            filter === 'passed'
              ? 'bg-banano-green text-white'
              : 'bg-white/5 text-gray-400 hover:text-white'
          }`}
        >
          Passed ({stats.passed})
        </button>
        <button
          onClick={() => setFilter('failed')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            filter === 'failed'
              ? 'bg-red-500 text-white'
              : 'bg-white/5 text-gray-400 hover:text-white'
          }`}
        >
          Failed ({stats.failed})
        </button>
      </div>

      {/* Results Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Questions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Attempt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredResults.map((result, index) => (
                <motion.tr
                  key={result.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="hover:bg-white/5"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nano-blue to-nano-purple flex items-center justify-center text-white text-sm font-bold">
                        {result.user_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{result.user_name}</p>
                        <p className="text-gray-500 text-xs">{result.user_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-lg font-bold ${
                      parseFloat(result.score) >= 80 ? 'text-banano-green' :
                      parseFloat(result.score) >= 60 ? 'text-banano-yellow' :
                      'text-red-400'
                    }`}>
                      {Math.round(parseFloat(result.score))}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-300">
                      {result.correct_answers}/{result.total_questions}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {result.passed ? (
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-banano-green/20 text-banano-green">
                        Passed
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-red-500/20 text-red-400">
                        Failed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-400 text-sm">#{result.attempt_number}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-400 text-sm">
                      {result.time_taken_seconds
                        ? `${Math.floor(result.time_taken_seconds / 60)}:${(result.time_taken_seconds % 60).toString().padStart(2, '0')}`
                        : '-'
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-400 text-sm">
                      {new Date(result.attempt_date).toLocaleDateString()}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredResults.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500">No quiz results found</p>
          </div>
        )}
      </div>
    </div>
  );
}
