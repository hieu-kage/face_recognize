import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const EYE_OPEN_THRESHOLD = 0.32;
const BLINK_THRESHOLD = 0.29;

const euclideanDistance = (p1, p2) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};
const getEyeAspectRatio = (eyePoints) => {
  const v1 = euclideanDistance(eyePoints[1], eyePoints[5]);
  const v2 = euclideanDistance(eyePoints[2], eyePoints[4]);
  const h = euclideanDistance(eyePoints[0], eyePoints[3]);
  const ear = (v1 + v2) / (2.0 * h);
  return ear;
};

function CheckinPage() {
  const [initializing, setInitializing] = useState(true);
  const [message, setMessage] = useState('Đang khởi tạo model AI...');

  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');

  const [livenessStatus, setLivenessStatus] = useState('IDLE');

  const isEyeOpenRef = useRef(false);
  const currentVectorRef = useRef(null);

  const webcamRef = useRef(null);
  const intervalRef = useRef(null);
  const livenessTimeoutRef = useRef(null);

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

  const getFaceVector = async () => {
    if (!webcamRef.current) return null;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return null;
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

  const handleEnroll = async () => {
    if (initializing || livenessStatus === 'CHECKING' || livenessStatus === 'SENDING') return;
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
        setMessage(`Đăng ký thành công cho: ${name}`);
        setName('');
        setStudentId('');
      } catch (error) {
        setMessage(error.response?.data?.detail || 'Lỗi khi đăng ký');
      }
    }
  };

  const handleSearch = async (vectorToSearch) => {
    if (!vectorToSearch) {
      setLivenessStatus('FAILED');
      setMessage('Lỗi: Không lấy được vector khuôn mặt.');
      return;
    }
    setLivenessStatus('SENDING');
    setMessage('Đã phát hiện chớp mắt! Đang gửi...');
    try {
      const response = await axios.post(`${API_URL}/api/search-face`, {
        vector: Array.from(vectorToSearch),
      });
      setMessage(`Chào mừng, ${response.data.name}!`);
      setLivenessStatus('SUCCESS');
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.detail || 'Lỗi khi tìm kiếm');
      setLivenessStatus('FAILED');
    }
  };

  const runFaceDetection = async () => {
    if (webcamRef.current && webcamRef.current.video.readyState === 4) {
      const video = webcamRef.current.video;
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        const landmarks = detection.landmarks;
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        const leftEAR = getEyeAspectRatio(leftEye);
        const rightEAR = getEyeAspectRatio(rightEye);
        const avgEAR = (leftEAR + rightEAR) / 2.0;

        currentVectorRef.current = detection.descriptor;
        console.log(avgEAR)

        if (avgEAR > EYE_OPEN_THRESHOLD) {
          isEyeOpenRef.current = true;
        }

        if (isEyeOpenRef.current === true && avgEAR < BLINK_THRESHOLD) {
          console.log('--- PHÁT HIỆN CHỚP MẮT! ---');
          clearTimeout(livenessTimeoutRef.current);
          setLivenessStatus('IDLE');
          handleSearch(currentVectorRef.current);
        }
      } else {
        // console.log('Không thấy mặt');
      }
    }
  };

  useEffect(() => {
    if (livenessStatus === 'CHECKING') {
      intervalRef.current = setInterval(runFaceDetection, 200);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => {
      clearInterval(intervalRef.current);
    };
  }, [livenessStatus]);

  const startLivenessCheck = () => {
    clearTimeout(livenessTimeoutRef.current);
    setMessage('Vui lòng chớp mắt...');
    isEyeOpenRef.current = false;
    currentVectorRef.current = null;

    livenessTimeoutRef.current = setTimeout(() => {
      console.log('--- 5 GIÂY TIMEOUT! ---');
      setLivenessStatus('FAILED');
      setMessage('Không phát hiện chớp mắt. Vui lòng thử lại.');
    }, 5000);

    setLivenessStatus('CHECKING');
  };

  const isChecking = livenessStatus === 'CHECKING' || livenessStatus === 'SENDING';

  return (
    <div className="App-header">
      <h1>Hệ thống Điểm danh Khuôn mặt</h1>
      <div className="message">{message}</div>
      <nav style={{ margin: '10px' }}>
        <Link to="/admin" style={{ color: '#61dafb' }}>
          Xem Dashboard Admin
        </Link>
      </nav>

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
        {/* Khu vực Đăng ký */}
        <div className="control-card enroll-card">
          <h2>Đăng ký Mới</h2>
          <input
            type="text"
            placeholder="Nhập MSSV"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            disabled={initializing || isChecking}
          />
          <input
            type="text"
            placeholder="Nhập Tên"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={initializing || isChecking}
          />
          <button onClick={handleEnroll} disabled={initializing || isChecking}>
            Đăng ký
          </button>
        </div>

        {/* Khu vực Điểm danh */}
        <div className="control-card checkin-card">
          <h2>Điểm danh</h2>
          <p>Nhìn vào camera và bấm nút</p>
          <button onClick={startLivenessCheck} disabled={initializing || isChecking}>
            {isChecking ? 'Đang dò...' : 'Bắt đầu Điểm danh'}
          </button>

          {isChecking && (
            <button onClick={() => {
              setLivenessStatus('IDLE');
              clearTimeout(livenessTimeoutRef.current);
              setMessage('Đã hủy.');
            }} style={{backgroundColor: '#f44336'}}>
              Hủy
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CheckinPage;