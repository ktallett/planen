import './UpdateNotification.css';

export default function UpdateNotification({ newVersion, onUpdate, onDismiss }) {
  return (
    <div className="update-notification">
      <div className="update-content">
        <div className="update-icon">🔄</div>
        <div className="update-message">
          <strong>New version available!</strong>
          <p>Version {newVersion} is ready to install.</p>
        </div>
        <div className="update-actions">
          <button onClick={onUpdate} className="btn-update">
            Update Now
          </button>
          <button onClick={onDismiss} className="btn-dismiss">
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
