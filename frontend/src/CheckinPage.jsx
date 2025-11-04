import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080';

function CheckinPage() {
  const [initializing, setInitializing] = useState(true);
  const [message, setMessage] = useState('Đang khởi tạo model AI...');

  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');

  const webcamRef = useRef(null);

  // --- 1. TẢI MODEL AI KHI APP KHỞI ĐỘNG ---
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      setInitializing(true);
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setMessage('Sẵn sàng điểm danh!');
        setInitializing(false);
      } catch (e) {
        console.error("Lỗi tải model:", e);
        setMessage('Lỗi khi tải model AI. Vui lòng F5.');
      }
    };
    loadModels();
  }, []);

  // --- 2. HÀM LẤY VECTOR TỪ KHUÔN MẶT ---
  const getFaceVector = async () => {
    if (!webcamRef.current) {
      setMessage('Webcam không sẵn sàng');
      return null;
    }
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setMessage('Không thể chụp ảnh');
      return null;
    }
    const img = await faceapi.fetchImage(imageSrc);
    const detection = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      setMessage('Không tìm thấy khuôn mặt!');
      return null;
    }
    return detection.descriptor;
  };

  // --- 3. HÀM XỬ LÝ ĐĂNG KÝ (ENROLL) ---
  const handleEnroll = async () => {
    if (initializing) return;
    if (!name || !studentId) {
      setMessage('Vui lòng nhập Tên và MSSV');
      return;
    }
    setMessage('Đang xử lý...');
    const vector = await getFaceVector();
    if (vector) {
      try {
        const response = await axios.post(`${API_URL}/api/enroll`, {
          studentId: studentId,
          name: name,
          vector: Array.from(vector),
        });
        console.log("Enroll response:", response.data);
        setMessage(`Đăng ký thành công cho: ${name}`);
        setName('');
        setStudentId('');
      } catch (error) {
        console.error(error);
        setMessage(error.response?.data?.detail || 'Lỗi khi đăng ký');
      }
    }
  };

  // --- 4. HÀM XỬ LÝ ĐIỂM DANH (SEARCH) ---
  const handleSearch = async () => {
    if (initializing) return;
    setMessage('Đang tìm kiếm...');
    const vector = await getFaceVector();
    if (vector) {
      try {
        const response = await axios.post(`${API_URL}/api/search-face`, {
          vector: Array.from(vector),
        });
        const foundName = response.data.name;
        setMessage(`Chào mừng, ${foundName}!`);
      } catch (error) {
        console.error(error);
        setMessage(error.response?.data?.detail || 'Lỗi khi tìm kiếm');
      }
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
          <Link to="/admin" style={{ color: '#61dafb', fontSize: '1.2rem' }}>
            Xem Trang Admin
          </Link>
        </div>

        <h1>Hệ thống Điểm danh Khuôn mặt</h1>
        <div className="message">{message}</div>

        <div className="webcam-container">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={720}
            height={480}
            videoConstraints={{ width: 720, height: 480, facingMode: 'user' }}
          />
        </div>

        <div className="controls-container">
          <div className="control-card enroll-card">
            <h2>Đăng ký Mới</h2>
            <input
              type="text"
              placeholder="Nhập MSSV"
              value={studentId}
              onChange={(e) => setStudentId(e.trg.value)}
              disabled={initializing}
            />
            <input
              type="text"
              placeholder="Nhập Tên"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={initializing}
            />
            <button onClick={handleEnroll} disabled={initializing}>
              {initializing ? 'Đang tải...' : 'Đăng ký'}
            </button>
          </div>

          <div className="control-card checkin-card">
            <h2>Điểm danh</h2>
            <p>Nhìn vào camera và bấm nút</p>
            <button onClick={handleSearch} disabled={initializing}>
              {initializing ? 'Đang tải...' : 'Điểm danh'}
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}

export default CheckinPage;