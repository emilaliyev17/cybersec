import { useState, useEffect } from 'react';
import axios from 'axios';
import { apiUrl } from '../../config/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function QuestionEditor() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    'all',
    'Phishing & Email Security',
    'Password Security & Authentication',
    'Social Engineering & Pretexting',
    'Malware & Ransomware',
    'Data Protection & Privacy',
    'Physical Security & Clean Desk',
    'Remote Work Security',
    'Mobile Device Security',
    'AI-Powered Threats',
    'Insider Threats'
  ];

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(apiUrl('/api/admin/quiz/questions'));
      setQuestions(response.data.questions);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestion = async (questionData) => {
    try {
      if (questionData.id) {
        await axios.put(apiUrl(`/api/admin/quiz/questions/${questionData.id}`), questionData);
      } else {
        await axios.post(apiUrl('/api/admin/quiz/questions'), questionData);
      }
      fetchQuestions();
      setEditingQuestion(null);
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to save question:', error);
      alert('Failed to save question');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await axios.delete(apiUrl(`/api/admin/quiz/questions/${questionId}`));
      fetchQuestions();
    } catch (error) {
      console.error('Failed to delete question:', error);
      alert('Failed to delete question');
    }
  };

  const handleToggleActive = async (question) => {
    try {
      await axios.put(apiUrl(`/api/admin/quiz/questions/${question.id}`), {
        is_active: !question.is_active
      });
      fetchQuestions();
    } catch (error) {
      console.error('Failed to toggle question:', error);
    }
  };

  const filteredQuestions = questions.filter(q => {
    const matchesCategory = filter === 'all' || q.category === filter;
    const matchesSearch = q.question_text.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (category) => {
    const colors = {
      'Phishing & Email Security': 'bg-red-500/20 text-red-400',
      'Password Security & Authentication': 'bg-blue-500/20 text-blue-400',
      'Social Engineering & Pretexting': 'bg-yellow-500/20 text-yellow-400',
      'Malware & Ransomware': 'bg-purple-500/20 text-purple-400',
      'Data Protection & Privacy': 'bg-green-500/20 text-green-400',
      'Physical Security & Clean Desk': 'bg-orange-500/20 text-orange-400',
      'Remote Work Security': 'bg-cyan-500/20 text-cyan-400',
      'Mobile Device Security': 'bg-pink-500/20 text-pink-400',
      'AI-Powered Threats': 'bg-indigo-500/20 text-indigo-400',
      'Insider Threats': 'bg-gray-500/20 text-gray-400',
    };
    return colors[category] || 'bg-gray-500/20 text-gray-400';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'easy': 'bg-banano-green/20 text-banano-green',
      'medium': 'bg-banano-yellow/20 text-banano-yellow',
      'hard': 'bg-red-500/20 text-red-400',
    };
    return colors[difficulty] || 'bg-gray-500/20 text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nano-purple"></div>
      </div>
    );
  }

  if (editingQuestion || isCreating) {
    return (
      <QuestionForm
        question={editingQuestion}
        categories={categories.filter(c => c !== 'all')}
        onSave={handleSaveQuestion}
        onCancel={() => {
          setEditingQuestion(null);
          setIsCreating(false);
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Quiz Questions</h2>
          <p className="text-gray-400 text-sm mt-1">
            {filteredQuestions.length} of {questions.length} questions
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="btn-neon-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Question
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field w-full"
            />
          </div>
          <div className="md:w-64">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-field w-full"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {filteredQuestions.map((question, index) => (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
            className={`glass-card p-4 ${!question.is_active ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(question.category)}`}>
                    {question.category || 'Uncategorized'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                    {question.difficulty}
                  </span>
                  {!question.is_active && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-white text-sm line-clamp-2">{question.question_text}</p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleToggleActive(question)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    question.is_active
                      ? 'bg-banano-green/20 text-banano-green hover:bg-banano-green/30'
                      : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                  }`}
                  title={question.is_active ? 'Deactivate' : 'Activate'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {question.is_active ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    )}
                  </svg>
                </button>
                <button
                  onClick={() => setEditingQuestion(question)}
                  className="p-1.5 rounded-lg bg-nano-blue/20 text-nano-blue hover:bg-nano-blue/30 transition-colors"
                  title="Edit"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteQuestion(question.id)}
                  className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {filteredQuestions.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No questions found matching your criteria
          </div>
        )}
      </div>
    </div>
  );
}

// Question Form Component
function QuestionForm({ question, categories, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    question_text: question?.question_text || '',
    options_json: question?.options_json || ['', '', '', ''],
    correct_answer_index: question?.correct_answer_index || 0,
    explanation: question?.explanation || '',
    difficulty: question?.difficulty || 'medium',
    category: question?.category || categories[0],
    is_active: question?.is_active ?? true,
  });

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options_json];
    newOptions[index] = value;
    setFormData({ ...formData, options_json: newOptions });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.question_text.trim()) {
      alert('Question text is required');
      return;
    }

    if (formData.options_json.some(opt => !opt.trim())) {
      alert('All 4 answer options are required');
      return;
    }

    onSave({
      ...formData,
      id: question?.id,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">
          {question ? 'Edit Question' : 'Add New Question'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-card p-6 space-y-4">
          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Question Text *
            </label>
            <textarea
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              className="input-field w-full h-24"
              placeholder="Enter the question..."
              required
            />
          </div>

          {/* Category & Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-field w-full"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Difficulty *
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="input-field w-full"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Answer Options */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Answer Options * (select the correct one)
            </label>
            <div className="space-y-3">
              {formData.options_json.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="correct_answer"
                    checked={formData.correct_answer_index === index}
                    onChange={() => setFormData({ ...formData, correct_answer_index: index })}
                    className="w-4 h-4 text-banano-green bg-dark-800 border-dark-600 focus:ring-banano-green"
                  />
                  <span className="text-gray-400 w-6">{String.fromCharCode(65 + index)})</span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="input-field flex-1"
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    required
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Explanation (shown after answering)
            </label>
            <textarea
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              className="input-field w-full h-20"
              placeholder="Explain why the correct answer is correct..."
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-banano-green bg-dark-800 border-dark-600 rounded focus:ring-banano-green"
            />
            <label htmlFor="is_active" className="text-sm text-gray-300">
              Active (include in quizzes)
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 rounded-lg border border-dark-600 text-gray-300 hover:bg-dark-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-neon-primary"
          >
            {question ? 'Save Changes' : 'Create Question'}
          </button>
        </div>
      </form>
    </div>
  );
}
