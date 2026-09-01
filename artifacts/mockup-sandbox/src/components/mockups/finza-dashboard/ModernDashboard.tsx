import './_group.css';
import './_modern.css';
import { Current } from './Current';

export function ModernDashboard() {
  return (
    <div className="modern-theme min-h-screen">
      <Current />
    </div>
  );
}