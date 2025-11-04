import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080';

function AdminDashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/logs`);
      setLogs(response.data.logs);
      setError('');
    } catch (err) {
      setError('Không thể tải nhật ký. Vui lòng thử lại.');
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="AdminDashboard">
      <h1>Bảng điều khiển Admin</h1>
      <Link to="/">Quay về trang Điểm danh</Link>
      <button onClick={fetchLogs} disabled={loading} style={{ marginLeft: '20px' }}>
        {loading ? 'Đang tải...' : 'Tải lại'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table style={{ width: '80%', margin: '20px auto', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #61dafb' }}>
            <th style={{ padding: '10px' }}>Tên</th>
            <th style={{ padding: '10px' }}>MSSV</th>
            <th style={{ padding: '10px' }}>Thời gian Điểm danh</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.created_at} style={{ borderBottom: '1px solid #555' }}>
              {/* API trả về { users: { name: '...' } } */}
              <td style={{ padding: '8px' }}>{log.users ? log.users.name : 'N/A'}</td>
              <td style={{ padding: '8px' }}>{log.users ? log.users.student_id : 'N/A'}</td>
              {/* Chuyển đổi Timestamp cho dễ đọc */}
              <td style={{ padding: '8px' }}>
                {new Date(log.created_at).toLocaleString('vi-VN')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminDashboard;