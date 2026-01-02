import React, { useState, useRef, useEffect } from 'react';
import { Camera, Languages, X, Check, Volume2, Copy, Image as ImageIcon, Loader2 } from 'lucide-react';
import { translateText, translateImage } from '../services/geminiService';

const TranslateView: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [targetLang, setTargetLang] = useState('Traditional Chinese');
  const [result, setResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Handlers
  const handleTranslate = async () => {
    if (!inputText) return;
    setIsProcessing(true);
    const translated = await translateText(inputText, targetLang);
    setResult(translated);
    setIsProcessing(false);
  };

  const handleSpeak = (text: string) => {
      const utterance = new SpeechSynthesisUtterance(text);
      // Try to detect language code from text or default to target
      // This is a simplification; browser detection varies
      window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      alert("已複製！");
  };

  // Camera Logic
  const startCamera = async () => {
      setIsCameraOpen(true);
      setCapturedImage(null);
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          if (videoRef.current) {
              videoRef.current.srcObject = stream;
          }
      } catch (err) {
          console.error("Camera Error", err);
          alert("無法開啟相機，請確認權限");
          setIsCameraOpen(false);
      }
  };

  const stopCamera = () => {
      if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
      }
      setIsCameraOpen(false);
  };

  const captureImage = async () => {
      if (videoRef.current && canvasRef.current) {
          const context = canvasRef.current.getContext('2d');
          if (context) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
              context.drawImage(videoRef.current, 0, 0);
              
              const base64 = canvasRef.current.toDataURL('image/jpeg');
              setCapturedImage(base64);
              stopCamera();
              
              // Auto translate
              setIsProcessing(true);
              const translated = await translateImage(base64, targetLang);
              setResult(translated);
              setInputText("[圖片翻譯結果]");
              setIsProcessing(false);
          }
      }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 pb-20">
      
      {/* Camera Modal */}
      {isCameraOpen && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col">
              <div className="relative flex-1">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <button onClick={stopCamera} className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white">
                      <X className="w-6 h-6"/>
                  </button>
              </div>
              <div className="h-24 bg-black flex items-center justify-center gap-8">
                  <button onClick={captureImage} className="w-16 h-16 rounded-full border-4 border-white bg-white/20 active:scale-95 transition-transform" />
              </div>
              <canvas ref={canvasRef} className="hidden" />
          </div>
      )}

      {/* Main UI */}
      <div className="p-4 flex-1 overflow-y-auto">
          {/* Header Controls */}
          <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex gap-2 mb-4">
              <div className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-gray-50 rounded-xl font-bold text-gray-600">
                  <Languages className="w-4 h-4" /> 自動偵測
              </div>
              <div className="flex items-center text-gray-300">→</div>
              <select 
                  value={targetLang} 
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="flex-1 py-2 px-4 bg-indigo-50 text-indigo-700 rounded-xl font-bold outline-none appearance-none text-center"
              >
                  <option value="Traditional Chinese">繁體中文</option>
                  <option value="English">English</option>
                  <option value="Japanese">日本語</option>
                  <option value="Korean">한국어</option>
                  <option value="Thai">ภาษาไทย</option>
              </select>
          </div>

          {/* Input Area */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 mb-4 relative">
              {capturedImage && (
                  <div className="mb-4 relative rounded-xl overflow-hidden group">
                      <img src={capturedImage} alt="Captured" className="w-full h-48 object-cover" />
                      <button onClick={() => setCapturedImage(null)} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full">
                          <X className="w-4 h-4"/>
                      </button>
                  </div>
              )}
              
              <textarea 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="輸入文字或使用相機..."
                  className="w-full h-32 resize-none outline-none text-lg text-gray-800 placeholder:text-gray-300"
              />
              
              <div className="flex justify-between items-center mt-2 border-t border-gray-50 pt-3">
                  <button onClick={startCamera} className="text-gray-400 hover:text-indigo-600 transition-colors p-2 -ml-2">
                      <Camera className="w-6 h-6" />
                  </button>
                  <button 
                      onClick={handleTranslate}
                      disabled={isProcessing || !inputText}
                      className={`px-6 py-2 rounded-xl font-bold text-white flex items-center gap-2 transition-all ${
                          isProcessing || !inputText ? 'bg-gray-300' : 'bg-indigo-600 shadow-lg shadow-indigo-200 active:scale-95'
                      }`}
                  >
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin"/> : '翻譯'}
                  </button>
              </div>
          </div>

          {/* Result Area */}
          {result && (
              <div className="bg-indigo-600 rounded-3xl p-6 shadow-xl text-white relative animate-in slide-in-from-bottom duration-300">
                  <h3 className="text-indigo-200 text-xs font-bold uppercase mb-2">翻譯結果</h3>
                  <p className="text-xl font-medium leading-relaxed whitespace-pre-wrap">{result}</p>
                  
                  <div className="flex gap-3 mt-6 justify-end">
                      <button onClick={() => handleSpeak(result)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
                          <Volume2 className="w-5 h-5"/>
                      </button>
                      <button onClick={() => copyToClipboard(result)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
                          <Copy className="w-5 h-5"/>
                      </button>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default TranslateView;