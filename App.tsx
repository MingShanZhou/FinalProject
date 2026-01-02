import React from 'react';
import { Plane, Hammer } from 'lucide-react';



const App: React.FC = () => {
  return (
    <div className="h-screen w-full bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-teal-100">
        <div className="flex justify-center mb-6">
          <div className="bg-teal-100 p-4 rounded-full relative">
             <Plane className="w-10 h-10 text-teal-600" />
             <div className="absolute -bottom-1 -right-1 bg-orange-100 p-1.5 rounded-full">
                <Hammer className="w-4 h-4 text-orange-500" />
             </div>
          </div>
        </div>
        
        <h1 className="text-3xl font-black text-gray-800 mb-2">TravelGenie Pro</h1>
        <p className="text-teal-600 font-bold text-sm tracking-widest uppercase mb-6">Project Initialization</p>
        
        <div className="space-y-4 text-left bg-gray-50 p-4 rounded-xl border border-gray-200">
          <h3 className="font-bold text-gray-700 border-b border-gray-200 pb-2 mb-2">🚧 開發進度看板</h3>
          
          <div className="flex items-center gap-3 opacity-50">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span className="text-sm text-gray-500">AI Service (Gemini)</span>
          </div>
          
          <div className="flex items-center gap-3 opacity-50">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span className="text-sm text-gray-500">UI Components (Views)</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
            <span className="text-sm font-bold text-gray-800">Project Base (Ready)</span>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          系統基底已建立。請各組員開始開發並上傳至對應分支。
        </p>
      </div>
    </div>
  );
};

export default App;