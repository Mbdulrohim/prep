'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, Plus, Save, Trash2, Eye, Download } from 'lucide-react';

interface RMQuestion {
  questionText: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
    E?: string;
  };
  correctAnswer: string;
  explanation?: string;
  category: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  references?: string;
  tags?: string[];
}

interface UploadStats {
  total: number;
  byDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export default function RMQuestionUpload() {
  const [questions, setQuestions] = useState<RMQuestion[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<'paper1' | 'paper2'>('paper1');
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'Maternal Health',
    'Neonatal Care',
    'Family Planning',
    'Labor and Delivery',
    'Postpartum Care',
    'High-Risk Pregnancy',
    'Community Health',
    'Professional Practice',
    'Emergency Obstetrics',
    'General'
  ];

  const addEmptyQuestion = () => {
    const newQuestion: RMQuestion = {
      questionText: '',
      options: { A: '', B: '', C: '', D: '', E: '' },
      correctAnswer: 'A',
      explanation: '',
      category: 'General',
      topic: '',
      difficulty: 'medium',
      references: '',
      tags: []
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updatedQuestions = [...questions];
    if (field.startsWith('options.')) {
      const optionKey = field.split('.')[1];
      updatedQuestions[index].options = {
        ...updatedQuestions[index].options,
        [optionKey]: value
      };
    } else {
      (updatedQuestions[index] as any)[field] = value;
    }
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file extension instead of MIME type for better compatibility
    if (!file.name.toLowerCase().endsWith('.docx')) {
      setMessage({ type: 'error', text: 'Please upload a DOCX file' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: 'success', text: 'Processing DOCX file...' });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('paper', selectedPaper);

      const response = await fetch('/api/admin/parse-rm-questions', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setQuestions([...questions, ...result.data.questions]);
        setMessage({ 
          type: 'success', 
          text: `Imported ${result.data.questions.length} questions from DOCX file` 
        });
      } else {
        setMessage({ type: 'error', text: result.error || 'Error parsing DOCX file' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error while processing file' });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadQuestions = async () => {
    if (questions.length === 0) {
      setMessage({ type: 'error', text: 'No questions to upload' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/rm-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions,
          paper: selectedPaper
        })
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setQuestions([]); // Clear questions after successful upload
        fetchUploadStats();
      } else {
        setMessage({ type: 'error', text: result.error || 'Upload failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error during upload' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUploadStats = async () => {
    try {
      const response = await fetch(`/api/admin/rm-questions?paper=${selectedPaper}&limit=0`);
      const result = await response.json();
      
      if (result.success) {
        setUploadStats(result.data.stats);
      }
    } catch (error) {
      console.error('Error fetching upload stats:', error);
    }
  };

  const clearDatabase = async () => {
    if (!confirm('Are you sure you want to clear the entire RM questions database? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/rm-questions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clear_all',
          paper: selectedPaper
        })
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `Successfully cleared all questions from ${selectedPaper}` 
        });
        setUploadStats(null);
        fetchUploadStats();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to clear database' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error while clearing database' });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const templateContent = `Sample Question Format for RM Exam Upload

IMPORTANT: Follow this exact format for successful parsing:

Question 1:
What is the normal range for adult heart rate?
A) 40-60 bpm
B) 60-100 bpm **
C) 100-120 bpm
D) 120-140 bpm

Explanation: The normal resting heart rate for adults is 60-100 beats per minute. This range can vary based on fitness level and other factors.

Question 2:
Which of the following is a sign of respiratory distress?
A) Normal breathing pattern
B) Use of accessory muscles **
C) Pink nail beds
D) Clear speech

Explanation: Use of accessory muscles indicates increased work of breathing and respiratory distress.

Question 3:
What is the recommended position for a woman during the second stage of labor?
A) Supine position
B) Left lateral position
C) Upright or squatting position **
D) Trendelenburg position
E) Prone position

Explanation: Upright or squatting positions use gravity to assist delivery and can reduce the duration of the second stage of labor.

FORMATTING RULES:
1. Each question starts with "Question [number]:"
2. Question text on the next line
3. Options labeled A), B), C), D), E) etc.
4. Mark correct answer with ** at the end
5. Optional explanation after options
6. Leave blank line between questions

IMPORTANT NOTES:
- Use ** to mark the correct answer
- Ensure consistent spacing
- Include explanations for better learning
- Save as .docx format
- Maximum recommended: 100 questions per file
- Categories and difficulty will be set to default (can be edited later)

Categories available: Maternal Health, Neonatal Care, Family Planning, Labor and Delivery, Postpartum Care, High-Risk Pregnancy, Community Health, Professional Practice, Emergency Obstetrics, General`;
    
    const blob = new Blob([templateContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rm-questions-docx-format-guide.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  React.useEffect(() => {
    fetchUploadStats();
  }, [selectedPaper]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">RM Question Upload</h2>
              <p className="text-gray-600">Upload questions for Registered Midwife examinations</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedPaper}
              onChange={(e) => setSelectedPaper(e.target.value as 'paper1' | 'paper2')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="paper1">Paper 1</option>
              <option value="paper2">Paper 2</option>
            </select>
            
            <button
              onClick={downloadTemplate}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <Download className="h-4 w-4" />
              <span>Template Guide</span>
            </button>
          </div>
        </div>

        {/* Upload Stats */}
        {uploadStats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{uploadStats.total}</div>
              <div className="text-sm text-blue-700">Total Questions</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{uploadStats.byDifficulty.easy}</div>
              <div className="text-sm text-green-700">Easy</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{uploadStats.byDifficulty.medium}</div>
              <div className="text-sm text-yellow-700">Medium</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{uploadStats.byDifficulty.hard}</div>
              <div className="text-sm text-red-700">Hard</div>
            </div>
          </div>
        )}

        {/* File Upload Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Upload DOCX file
              </button>
              <span className="text-gray-500"> or </span>
              <button
                onClick={addEmptyQuestion}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                add questions manually
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              DOCX should contain questions in the specified format. Download template guide for details.
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Questions List */}
        {questions.length > 0 && (
          <div className="space-y-6 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Questions ({questions.length})</h3>
              <button
                onClick={addEmptyQuestion}
                className="flex items-center space-x-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
              >
                <Plus className="h-4 w-4" />
                <span>Add Question</span>
              </button>
            </div>

            {/* Action Buttons - Moved to top for easy access */}
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-200">
              <div className="text-sm text-gray-600">
                Ready to upload? Review your questions and click upload when ready.
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={clearDatabase}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 border border-red-200 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clear Database</span>
                </button>
                <button
                  onClick={() => setQuestions([])}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 border border-gray-300"
                >
                  Clear All
                </button>
                <button
                  onClick={uploadQuestions}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{isLoading ? 'Uploading...' : 'Upload Questions'}</span>
                </button>
              </div>
            </div>

            {questions.map((question, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                  <button
                    onClick={() => removeQuestion(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question Text *
                    </label>
                    <textarea
                      value={question.questionText}
                      onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Enter the question..."
                    />
                  </div>

                  {/* Options */}
                  {['A', 'B', 'C', 'D', 'E'].map((option) => (
                    <div key={option}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Option {option} {option !== 'E' && '*'}
                      </label>
                      <input
                        type="text"
                        value={question.options[option as keyof typeof question.options] || ''}
                        onChange={(e) => updateQuestion(index, `options.${option}`, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder={`Option ${option}`}
                      />
                    </div>
                  ))}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Correct Answer *
                    </label>
                    <select
                      value={question.correctAnswer}
                      onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {['A', 'B', 'C', 'D', 'E'].map((option) => (
                        <option key={option} value={option}>Option {option}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={question.category}
                      onChange={(e) => updateQuestion(index, 'category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Topic
                    </label>
                    <input
                      type="text"
                      value={question.topic}
                      onChange={(e) => updateQuestion(index, 'topic', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Specific topic"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty *
                    </label>
                    <select
                      value={question.difficulty}
                      onChange={(e) => updateQuestion(index, 'difficulty', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Explanation
                    </label>
                    <textarea
                      value={question.explanation}
                      onChange={(e) => updateQuestion(index, 'explanation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Explain the correct answer..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
