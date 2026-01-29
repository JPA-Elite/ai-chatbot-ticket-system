import { motion } from 'framer-motion';

interface ModalProps {
    open: boolean;
    title: string;
    children: React.ReactNode;
    onClose: () => void;
    size?: 'sm' | 'md' | 'xl';
}

const sizeClasses: Record<'sm' | 'md' | 'xl', string> = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    xl: 'max-w-5xl',
};

const Modal: React.FC<ModalProps> = ({
    open,
    title,
    children,
    onClose,
    size = 'md',
}) => {
    if (!open) return null;

    return (
        // BACKDROP
        <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={onClose}
        >
            {/* MODAL CARD */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className={`bg-white rounded-lg w-full p-6 ${sizeClasses[size]}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>

                {children}
            </motion.div>
        </div>
    );
};

export default Modal;
