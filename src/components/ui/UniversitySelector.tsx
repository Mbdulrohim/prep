// src/components/ui/UniversitySelector.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { universityManager, University } from '@/lib/universities';
import { useAuth } from '@/context/AuthContext';
import { ChevronDown, Plus, Search, MapPin, Users } from 'lucide-react';

interface UniversitySelectorProps {
  value?: string;
  onChange: (university: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function UniversitySelector({ 
  value = '', 
  onChange, 
  placeholder = "Select your university...",
  required = false,
  className = ''
}: UniversitySelectorProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newUniversityName, setNewUniversityName] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize universities database
    universityManager.initializeUniversities();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowAddNew(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchUniversities(searchTerm);
    } else {
      setUniversities([]);
    }
  }, [searchTerm]);

  const searchUniversities = async (term: string) => {
    setLoading(true);
    try {
      const results = await universityManager.searchUniversities(term);
      setUniversities(results);
      setShowAddNew(results.length === 0 && term.length >= 3);
    } catch (error) {
      console.error('Error searching universities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(true);
  };

  const handleUniversitySelect = (university: University) => {
    setSearchTerm(university.name);
    onChange(university.name);
    setIsOpen(false);
    setShowAddNew(false);
    
    // Update student count
    universityManager.updateUniversityStudentCount(university.name);
  };

  const handleAddNewUniversity = async () => {
    if (!newUniversityName.trim() || !user?.uid) return;
    
    setAddingNew(true);
    try {
      const newUni = await universityManager.addNewUniversity(newUniversityName.trim(), user.uid);
      if (newUni) {
        setSearchTerm(newUni.name);
        onChange(newUni.name);
        setIsOpen(false);
        setShowAddNew(false);
        setNewUniversityName('');
      }
    } catch (error) {
      console.error('Error adding university:', error);
    } finally {
      setAddingNew(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && universities.length > 0) {
      e.preventDefault();
      handleUniversitySelect(universities[0]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setShowAddNew(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          ) : (
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {universities.length > 0 ? (
            <div className="py-1">
              {universities.map((university) => (
                <button
                  key={university.id}
                  onClick={() => handleUniversitySelect(university)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {university.name}
                        {university.shortName && (
                          <span className="ml-2 text-sm text-gray-500">({university.shortName})</span>
                        )}
                      </div>
                      {university.location && (
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <MapPin className="h-3 w-3 mr-1" />
                          {university.location}
                          <span className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded text-xs capitalize">
                            {university.type}
                          </span>
                          {university.studentCount > 0 && (
                            <span className="ml-2 flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {university.studentCount}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {university.verified && (
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Verified
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : searchTerm.length >= 2 && !loading ? (
            <div className="py-3 px-4 text-gray-500 text-sm">
              No universities found for "{searchTerm}"
            </div>
          ) : null}

          {showAddNew && searchTerm.length >= 3 && (
            <div className="border-t border-gray-200 p-3">
              <div className="text-sm text-gray-600 mb-2">
                Can't find your university?
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newUniversityName}
                  onChange={(e) => setNewUniversityName(e.target.value)}
                  placeholder="Enter university name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleAddNewUniversity}
                  disabled={!newUniversityName.trim() || addingNew}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                >
                  {addingNew ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                New universities will be reviewed by our team
              </div>
            </div>
          )}

          {searchTerm.length < 2 && (
            <div className="py-3 px-4 text-gray-500 text-sm flex items-center">
              <Search className="h-4 w-4 mr-2" />
              Type at least 2 characters to search
            </div>
          )}
        </div>
      )}
    </div>
  );
}
