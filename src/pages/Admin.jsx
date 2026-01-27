import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { CSVLink } from 'react-csv';

function isAdmin(email) {
  return email && email.endsWith('@aimalyze.com');
}

export default function Admin() {
  const { user, isLoaded } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState({ user: '', ip: '', verdict: '', date: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoaded && user && isAdmin(user.primaryEmailAddress?.emailAddress)) {
      fetchLogs();
    }
  }, [isLoaded, user]);

  const fetchLogs = async () => {
    setLoading(true);
    let url = '/.netlify/functions/admin-usage-logs';
    const params = [];
    if (filter.user) params.push(`user_id=${encodeURIComponent(filter.user)}`);
    if (filter.ip) params.push(`ip_address=${encodeURIComponent(filter.ip)}`);
    if (filter.verdict) params.push(`verdict=${encodeURIComponent(filter.verdict)}`);
    if (filter.date) params.push(`date=${encodeURIComponent(filter.date)}`);
    if (params.length) url += '?' + params.join('&');
    const res = await fetch(url);
    const data = await res.json();
    setLogs(data.logs || []);
    setLoading(false);
  };

  if (!isLoaded) return <div>Loading...</div>;
  if (!user || !isAdmin(user.primaryEmailAddress?.emailAddress)) {
    return <div className="p-8 text-red-500 font-bold">Access denied. Admins only.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Usage Logs Admin</h1>
      <div className="mb-4 flex gap-4 flex-wrap">
        <input placeholder="User ID" value={filter.user} onChange={e => setFilter(f => ({ ...f, user: e.target.value }))} className="border p-2 rounded" />
        <input placeholder="IP Address" value={filter.ip} onChange={e => setFilter(f => ({ ...f, ip: e.target.value }))} className="border p-2 rounded" />
        <input placeholder="Verdict" value={filter.verdict} onChange={e => setFilter(f => ({ ...f, verdict: e.target.value }))} className="border p-2 rounded" />
        <input type="date" value={filter.date} onChange={e => setFilter(f => ({ ...f, date: e.target.value }))} className="border p-2 rounded" />
        <button onClick={fetchLogs} className="bg-neon-cyan text-white px-4 py-2 rounded">Filter</button>
        <CSVLink data={logs} filename="usage_logs.csv" className="bg-neon-pink text-white px-4 py-2 rounded">Export CSV</CSVLink>
        <button onClick={() => navigator.clipboard.writeText(JSON.stringify(logs, null, 2))} className="bg-neon-purple text-white px-4 py-2 rounded">Copy JSON</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border px-2 py-1">Timestamp</th>
              <th className="border px-2 py-1">User ID</th>
              <th className="border px-2 py-1">IP</th>
              <th className="border px-2 py-1">Type</th>
              <th className="border px-2 py-1">Success</th>
              <th className="border px-2 py-1">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td className="border px-2 py-1">{log.timestamp}</td>
                <td className="border px-2 py-1">{log.user_id}</td>
                <td className="border px-2 py-1">{log.ip_address}</td>
                <td className="border px-2 py-1">{log.video_type}</td>
                <td className="border px-2 py-1">{log.success ? '✅' : '❌'}</td>
                <td className="border px-2 py-1">{log.verdict}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loading && <div className="mt-4">Loading...</div>}
    </div>
  );
}
