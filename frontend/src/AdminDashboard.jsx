import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';


const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function AdminDashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  const fetchLogs = async () => {
    setLoading(true);
    try {

      let { data, error } = await supabase
        .from('attendance_logs')
        .select(`
          created_at,
          users ( name, student_id )
        `)
        .order('created_at', { ascending: false })
        .limit(50); // Giới hạn

      if (error) throw error;

      setLogs(data);
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


  useEffect(() => {


    const handleNewLog = (payload) => {
      console.log('Realtime log received!', payload);

      fetchLogs();


    };


    const subscription = supabase
      .channel('public:attendance_logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance_logs'
        },
        handleNewLog
      )
      .subscribe();

    console.log('Đã kết nối Realtime...');

    return () => {
      supabase.removeChannel(subscription);
      console.log('Đã ngắt kết nối Realtime.');
    };
  }, []);


  return (
    <div className="AdminDashboard">
      <h1>Bảng điều khiển Admin</h1>
      <Link to="/">Quay về trang Điểm danh</Link>
      <button onClick={fetchLogs} disabled={loading} style={{ marginLeft: '20px' }}>
        {loading ? 'Đang tải...' : 'Tải lại (thủ công)'}
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
          {logs && logs.map((log) => (
            <tr key={log.created_at} style={{ borderBottom: '1px solid #555' }}>
              {/* Cấu trúc data giờ là: log.users.name */}
              <td style={{ padding: '8px' }}>{log.users ? log.users.name : 'N/A'}</td>
              <td style={{ padding: '8px' }}>{log.users ? log.users.student_id : 'N/A'}</td>
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