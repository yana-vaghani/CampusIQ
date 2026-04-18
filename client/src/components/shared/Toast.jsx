import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertTriangle, XCircle, X, Info } from 'lucide-react';

let addToast = () => {};

export function useToast() {
  return { toast: (msg, type = 'success') => addToast(msg, type) };
}

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  const icons = {
    success: <CheckCircle size={18} className="text-[#354F52]" />,
    error: <XCircle size={18} className="text-[#A4161A]" />,
    warning: <AlertTriangle size={18} className="text-[#FFC300]" />,
    info: <Info size={18} className="text-[#415A77]" />,
  };

  const borderColors = {
    success: 'border-l-[#354F52]',
    error: 'border-l-[#A4161A]',
    warning: 'border-l-[#FFC300]',
    info: 'border-l-[#415A77]',
  };

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-xl border border-gray-100 border-l-4 ${borderColors[t.type]} min-w-[300px] max-w-[400px] animate-slide-in`}
        >
          {icons[t.type]}
          <p className="text-sm text-gray-700 flex-1">{t.message}</p>
          <button onClick={() => removeToast(t.id)} className="text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
