import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCosmosStore } from '../store/cosmosStore';
import { Info, CheckCircle, AlertCircle, X } from 'lucide-react';

export const Toast = () => {
  const { toasts, removeToast } = useCosmosStore();

  return (
    <div className="fixed bottom-24 left-6 z-[60] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem = ({ toast, onRemove }: { toast: any; onRemove: (id: string) => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const icons = {
    info: <Info className="text-blue-400" size={18} />,
    success: <CheckCircle className="text-green-400" size={18} />,
    warning: <AlertCircle className="text-yellow-400" size={18} />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.9 }}
      className="glass px-4 py-3 rounded-xl border border-white/10 flex items-center gap-3 shadow-2xl pointer-events-auto min-w-[240px]"
    >
      {icons[toast.type as keyof typeof icons]}
      <span className="text-sm text-gray-200 font-medium">{toast.message}</span>
      <button 
        onClick={() => onRemove(toast.id)}
        className="ml-auto text-gray-500 hover:text-white transition-colors"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
};
