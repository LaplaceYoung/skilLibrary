import React from 'react';
import { useSkillStore } from '../store';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export const ToastProvider: React.FC = () => {
    const { toasts, removeToast } = useSkillStore();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
            {toasts.map((toast) => (
                <div key={toast.id} className={cn(
                    "flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border animate-in slide-in-from-right-8 fade-in duration-300 pointer-events-auto",
                    toast.type === 'success' ? 'bg-green-500 border-green-400/50 text-white shadow-green-500/20' :
                        toast.type === 'error' ? 'bg-red-500 border-red-400/50 text-white shadow-red-500/20' :
                            'bg-brand border-brand/50 text-white shadow-brand/20'
                )}>
                    {toast.type === 'success' && <CheckCircle className="w-5 h-5 shrink-0" />}
                    {toast.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
                    {toast.type === 'info' && <Info className="w-5 h-5 shrink-0" />}

                    <p className="text-sm leading-6 font-bold pr-6">{toast.message}</p>

                    <button onClick={() => removeToast(toast.id)} className="absolute right-4 opacity-70 hover:opacity-100 transition-opacity">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
};
