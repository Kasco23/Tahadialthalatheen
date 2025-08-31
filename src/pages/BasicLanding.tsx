import React from 'react';

/**
 * Basic Landing Page for Testing
 * Simple component to verify the app structure works
 */
export default function BasicLanding() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-4xl font-bold text-green-400">
          تحدي الثلاثين
        </h1>
        <p className="text-xl text-slate-300">
          مرحباً بك في تطبيق مسابقة كرة القدم
        </p>
        <div className="space-y-4">
          <div className="bg-slate-800 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">حالة التطبيق</h2>
            <div className="text-green-400">✅ التطبيق يعمل بنجاح!</div>
            <div className="text-sm text-slate-400 mt-2">
              تم إصلاح مشاكل التحميل والبناء
            </div>
          </div>
          <div className="flex space-x-4 justify-center">
            <button 
              onClick={() => window.location.href = '/create-session'}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors"
            >
              إنشاء جلسة
            </button>
            <button 
              onClick={() => window.location.href = '/join'}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg transition-colors"
            >
              انضمام
            </button>
          </div>
        </div>
        <div className="text-xs text-slate-500">
          Version: {import.meta.env.VITE_APP_VERSION || 'development'}
        </div>
      </div>
    </div>
  );
}