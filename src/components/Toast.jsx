import { FiCheckCircle, FiAlertCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi';

const TOAST_CONFIG = {
  success: { icon: FiCheckCircle, title: 'Success' },
  error: { icon: FiAlertCircle, title: 'Error' },
  warning: { icon: FiAlertTriangle, title: 'Warning' },
  info: { icon: FiInfo, title: 'Info' },
};

export default function Toast({ toast }) {
  if (!toast) return null;
  const config = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;
  const Icon = config.icon;

  return (
    <div className="toast-container">
      <div className={`toast toast-${toast.type}`}>
        <div className="toast-icon">
          <Icon />
        </div>
        <div className="toast-content">
          <div className="toast-title">{toast.title || config.title}</div>
          <div className="toast-message">{toast.message}</div>
        </div>
      </div>
    </div>
  );
}
