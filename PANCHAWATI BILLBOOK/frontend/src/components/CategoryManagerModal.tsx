import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuthStore } from '../store/useAuthStore';
import { X, Trash2, Plus } from 'lucide-react';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChanged: () => void;
}

export default function CategoryManagerModal({ isOpen, onClose, onCategoriesChanged }: CategoryManagerModalProps) {
  const token = useAuthStore(state => state.token);
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await api.get('/inventory/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setError('');
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    setLoading(true);
    setError('');
    try {
      await api.post('/inventory/categories', {
        name: newCategoryName.trim(),
        description: ''
      });
      setNewCategoryName('');
      await fetchCategories();
      onCategoriesChanged();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    
    setLoading(true);
    setError('');
    try {
      await api.delete(`/inventory/categories/${id}`);
      setCategories(categories.filter(c => c.id !== id));
      onCategoriesChanged();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 sm:p-0 font-sans">
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-zinc-900 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-zinc-800 shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Manage Categories</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">{error}</div>}
          
          <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
            <input
              type="text"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              placeholder="New Category Name"
              className="flex-1 rounded-lg border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
            <button 
              type="submit" 
              disabled={loading || !newCategoryName.trim()}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" /> Add
            </button>
          </form>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Existing Categories</h4>
            {categories.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No categories found.</p>
            ) : (
              categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{cat.name}</span>
                  <button 
                    onClick={() => handleDeleteCategory(cat.id)}
                    disabled={loading}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
