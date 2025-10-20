import React, { useEffect, useState } from 'react';
import { departmentsAPI } from '../../../services/api';
import { Icons } from '../../../components/Icons/Icons';

const DepartmentsSettings: React.FC = () => {
  const [departments, setDepartments] = useState<Array<{id:string; name:string}>>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const res = await departmentsAPI.list();
      const list = res.data?.data || res.data || [];
      setDepartments(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setError('Failed to load departments');
    }
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await departmentsAPI.create(name.trim());
      setName('');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to create department');
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this department?')) return;
    setLoading(true);
    try {
      await departmentsAPI.remove(id);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to delete department');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">New Department</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Sales"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <button
          type="button"
          onClick={add}
          disabled={loading || !name.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-blue-400"
        >
          Add
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      <div className="border rounded-lg divide-y">
        {departments.map((d) => (
          <div key={d.id} className="flex items-center justify-between px-4 py-3">
            <span className="text-gray-900">{d.name}</span>
            <button
              type="button"
              onClick={() => remove(d.id)}
              className="text-red-600 hover:text-red-800"
              title="Delete"
            >
              <Icons.Trash />
            </button>
          </div>
        ))}
        {departments.length === 0 && (
          <div className="px-4 py-6 text-gray-500 text-sm">No departments yet.</div>
        )}
      </div>
    </div>
  );
};

export default DepartmentsSettings;


