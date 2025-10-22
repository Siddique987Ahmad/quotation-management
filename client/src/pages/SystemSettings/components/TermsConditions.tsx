import React, { useEffect, useState } from 'react';
import { termsAPI, handleApiError } from '../../../services/api';

type Term = {
  id: string;
  label: string;
  value: string;
  highlight: boolean;
  active: boolean;
  sortOrder: number;
};

const TermsConditions: React.FC = () => {
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Term>>({ label: '', value: '', highlight: false, active: true });
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchTerms = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await termsAPI.list();
      setTerms(res.data.data || []);
    } catch (e) {
      setError(handleApiError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!form.label || !form.value) return;
      if (editingId) {
        await termsAPI.update(editingId, { label: form.label, value: form.value, highlight: !!form.highlight, active: form.active !== false });
      } else {
        await termsAPI.create({ label: form.label, value: form.value, highlight: !!form.highlight, active: form.active !== false });
      }
      setForm({ label: '', value: '', highlight: false, active: true });
      setEditingId(null);
      await fetchTerms();
    } catch (e) {
      setError(handleApiError(e));
    }
  };

  const onDelete = async (id: string) => {
    if (!window.confirm('Delete this term?')) return;
    try {
      await termsAPI.delete(id);
      await fetchTerms();
    } catch (e) {
      setError(handleApiError(e));
    }
  };

  const move = async (fromIdx: number, toIdx: number) => {
    const copy = [...terms];
    const [moved] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, moved);
    // recompute sortOrder starting at 1
    const order = copy.map((t, i) => ({ id: t.id, sortOrder: i + 1 }));
    setTerms(copy);
    try {
      await termsAPI.reorder(order);
    } catch (e) {
      setError(handleApiError(e));
      await fetchTerms();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Terms & Conditions</h2>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
          <input value={form.label || ''} onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))} className="w-full px-3 py-2 border rounded" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
          <textarea value={form.value || ''} onChange={(e) => setForm(f => ({ ...f, value: e.target.value }))} className="w-full px-3 py-2 border rounded" rows={3} />
        </div>
        <div className="flex items-center space-x-4">
          <label className="inline-flex items-center space-x-2">
            <input type="checkbox" checked={!!form.highlight} onChange={(e) => setForm(f => ({ ...f, highlight: e.target.checked }))} />
            <span className="text-sm">Highlight</span>
          </label>
          <label className="inline-flex items-center space-x-2">
            <input type="checkbox" checked={form.active !== false} onChange={(e) => setForm(f => ({ ...f, active: e.target.checked }))} />
            <span className="text-sm">Active</span>
          </label>
        </div>
        <div className="md:col-span-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            {editingId ? 'Update Term' : 'Add Term'}
          </button>
          {editingId && (
            <button type="button" className="ml-2 px-4 py-2 bg-gray-200 rounded" onClick={() => { setEditingId(null); setForm({ label: '', value: '', highlight: false, active: true }); }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Order</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Label</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Value</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Highlight</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Active</th>
              <th className="px-3 py-2 text-right text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {terms.map((t, idx) => (
              <tr key={t.id} className="border-t">
                <td className="px-3 py-2 text-sm whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <button type="button" className="px-2 py-1 border rounded text-xs" disabled={idx === 0} onClick={() => move(idx, idx - 1)}>▲</button>
                    <button type="button" className="px-2 py-1 border rounded text-xs" disabled={idx === terms.length - 1} onClick={() => move(idx, idx + 1)}>▼</button>
                  </div>
                </td>
                <td className="px-3 py-2 text-sm font-medium">{t.label}</td>
                <td className="px-3 py-2 text-sm" style={{ maxWidth: 420 }}>{t.value}</td>
                <td className="px-3 py-2 text-sm">{t.highlight ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2 text-sm">{t.active ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2 text-sm text-right whitespace-nowrap">
                  <button className="px-3 py-1 border rounded mr-2" onClick={() => { setEditingId(t.id); setForm({ label: t.label, value: t.value, highlight: t.highlight, active: t.active }); }}>Edit</button>
                  <button className="px-3 py-1 border rounded text-red-600" onClick={() => onDelete(t.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {terms.length === 0 && !loading && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-sm text-gray-500">No terms yet. Add your first one above.</td></tr>
            )}
            {loading && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-sm text-gray-500">Loading…</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TermsConditions;


