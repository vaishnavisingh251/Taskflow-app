import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import api from '../api/axios';

export default function Layout({ children, title, actions }) {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data)).catch(() => {});
  }, []);

  return (
    <div className="layout">
      <Sidebar projects={projects} />
      <div className="main">
        <div className="topbar">
          <span className="topbar-title">{title}</span>
          {actions}
        </div>
        <div className="page">{children}</div>
      </div>
    </div>
  );
}
