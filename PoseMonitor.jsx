import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as tmPose from '@teachablemachine/pose';

const MODEL_URL = "https://teachablemachine.withgoogle.com/models/L_fgQFAWQ/";

export default function PoseMonitor({ isActive, onWarning }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("Đang khởi động AI...");
  const [isAlert, setIsAlert] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    let model, webcam, animationFrameId;
    let badPostureTimer = null;

    async function init() {
      const modelURL = MODEL_URL + "model.json";
      const metadataURL = MODEL_URL + "metadata.json";

      // Nạp model từ link Teachable Machine của bạn
      model = await tmPose.load(modelURL, metadataURL);

      const size = 160;
      const flip = true;
      webcam = new tmPose.Webcam(size, size, flip);
      await webcam.setup();
      await webcam.play();

      async function loop() {
        webcam.update();
        await predict();
        animationFrameId = window.requestAnimationFrame(loop);
      }
      animationFrameId = window.requestAnimationFrame(loop);
    }

    async function predict() {
      const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
      const prediction = await model.predict(posenetOutput);

      // Tìm nhãn có tỉ lệ cao nhất
      let bestPrediction = prediction[0];
      for (let i = 1; i < prediction.length; i++) {
        if (prediction[i].probability > bestPrediction.probability) {
          bestPrediction = prediction[i];
        }
      }

      // Vẽ khung xương lên canvas
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx && pose) {
        ctx.clearRect(0, 0, 160, 160);
        ctx.drawImage(webcam.canvas, 0, 0);
        tmPose.drawKeypoints(pose.keypoints, 0.5, ctx);
        tmPose.drawSkeleton(pose.keypoints, 0.5, ctx);
      }

      // Xử lý bộ lọc trễ 3 giây chống báo ảo
      const label = bestPrediction.className;
      const prob = bestPrediction.probability;

      if (prob > 0.75) {
        if (label === "Tu_the_chuan") {
          clearTimeout(badPostureTimer);
          badPostureTimer = null;
          setStatus("Tư thế chuẩn");
          setIsAlert(false);
        } else if (label === "Vang_mat") {
          setStatus("Vắng mặt");
          setIsAlert(true);
        } else {
          if (!badPostureTimer) {
            badPostureTimer = setTimeout(() => {
              setStatus(`Cảnh báo: ${label.replace('_', ' ')}`);
              setIsAlert(true);
              if (onWarning) onWarning(label);
            }, 3000);
          }
        }
      }
    }

    init();

    return () => {
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
      if (webcam) webcam.stop();
      clearTimeout(badPostureTimer);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      background: '#fff',
      padding: 10,
      borderRadius: 12,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      border: isAlert ? '2px solid #ef4444' : '2px solid #22c55e',
      zIndex: 9999,
      textAlign: 'center'
    }}>
      <canvas ref={canvasRef} width={160} height={160} style={{ borderRadius: 8 }} />
      <div style={{
        marginTop: 6,
        fontWeight: 'bold',
        fontSize: 13,
        color: isAlert ? '#ef4444' : '#16a34a'
      }}>
        {status}
      </div>
    </div>
  );
}