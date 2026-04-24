import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '../services/api';
import { adminService } from '../services/adminService';
import { formatDate } from '../utils/format';

function RoleBadge({ role }) {
  const colorMap = {
    ADMIN: 'bg-purple-100 text-purple-700',
    CUSTOMER: 'bg-blue-100 text-blue-700',
  };
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${colorMap[role] ?? 'bg-slate-100 text-slate-600'}`}
    >
      {role}
    </span>
  );
}

function StatusBadge({ isDeleted }) {
  return isDeleted ? (
    <span className="inline-flex rounded-md bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
      Deactivated
    </span>
  ) : (
    <span className="inline-flex rounded-md bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
      Active
    </span>
  );
}

export default function AdminUsersPage() {
  const [pageData, setPageData] = useState(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  const loadUsers = (p) => {
    setLoading(true);
    setError('');
    adminService
      .getUsers({ page: p, size: 10 })
      .then((res) => setPageData(res?.data ?? res))
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers(page);
  }, [page]);

  const handleToggle = async (id) => {
    setTogglingId(id);
    try {
      await adminService.toggleUserActive(id);
      loadUsers(page);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  };

  const users = pageData?.items ?? [];
  const total = pageData?.total ?? 0;
  const size = pageData?.size ?? 10;
  const totalPages = Math.ceil(total / size) || 1;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Users</h1>
        <p className="mt-2 text-slate-500">Manage all registered users.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <span className="text-slate-500">Loading users...</span>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-medium text-slate-600">ID</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Username</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Role</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Created At</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-slate-400" colSpan={6}>
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-500">{user.id}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{user.username}</td>
                        <td className="px-4 py-3">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge isDeleted={user.is_deleted} />
                        </td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(user.created_at)}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            disabled={togglingId === user.id}
                            onClick={() => handleToggle(user.id)}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                              user.is_deleted
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                          >
                            {togglingId === user.id
                              ? 'Updating...'
                              : user.is_deleted
                              ? 'Activate'
                              : 'Deactivate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                className="btn-secondary"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">Page {page + 1}</span>
              <button
                type="button"
                className="btn-secondary"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
