import { useState, useEffect, useRef } from 'react';
import { chartDB } from './lib/db';
import GanttChart from './components/GanttChart';
import TaskEditor from './components/TaskEditor';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './App.css';

export default function App() {
  const [currentChart, setCurrentChart] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [showTaskEditor, setShowTaskEditor] = useState(false);
  const [viewMode, setViewMode] = useState('Day');
  const [isLocked, setIsLocked] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const ganttRef = useRef(null);

  // Load the first chart or create a default one
  useEffect(() => {
    const loadChart = async () => {
      const charts = await chartDB.getAll();
      if (charts && charts.length > 0) {
        setCurrentChart(charts[0]);
      } else {
        // Create a default chart with sample data
        const newChart = await chartDB.create({
          title: 'My First Project',
          timeRange: {
            start: '2025-10-01',
            end: '2025-12-31',
          },
          tasks: [
            {
              id: '1',
              name: 'Project Planning',
              start: '2025-10-01',
              end: '2025-10-15',
              color: '#3b82f6',
              subtasks: [
                {
                  id: '1-1',
                  name: 'Requirements Gathering',
                  start: '2025-10-01',
                  end: '2025-10-07',
                  color: '#60a5fa',
                },
              ],
            },
            {
              id: '2',
              name: 'Development',
              start: '2025-10-16',
              end: '2025-11-30',
              color: '#10b981',
            },
          ],
        });
        setCurrentChart(newChart);
      }
    };
    loadChart();
  }, [refreshTrigger]);

  const handleSaveTask = async (taskData) => {
    if (!currentChart) return;

    let updatedTasks;
    if (editingTask) {
      // Update existing task
      updatedTasks = currentChart.tasks.map((t) =>
        t.id === taskData.id ? taskData : t
      );
    } else {
      // Add new task
      updatedTasks = [...currentChart.tasks, taskData];
    }

    const updated = await chartDB.update(currentChart.id, {
      tasks: updatedTasks,
    });
    setCurrentChart(updated);
    setShowTaskEditor(false);
    setEditingTask(null);
  };

  const handleDeleteTask = async (taskId) => {
    if (!currentChart) return;

    const updatedTasks = currentChart.tasks.filter((t) => t.id !== taskId);
    const updated = await chartDB.update(currentChart.id, {
      tasks: updatedTasks,
    });
    setCurrentChart(updated);
    setShowTaskEditor(false);
    setEditingTask(null);
  };

  const handleEditTask = (taskId) => {
    if (isLocked) return; // Prevent editing when locked
    const task = currentChart.tasks.find((t) => t.id === taskId);
    if (task) {
      setEditingTask(task);
      setShowTaskEditor(true);
    }
  };

  const handleUpdateTitle = async (newTitle) => {
    if (!currentChart || !newTitle.trim()) return;
    const updated = await chartDB.update(currentChart.id, { title: newTitle });
    setCurrentChart(updated);
    setIsEditingTitle(false);
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedData = JSON.parse(text);

      // Validate the data has required fields
      if (!importedData.title || !importedData.tasks) {
        alert('Invalid JSON file format');
        return;
      }

      // Import as a new chart
      const newChart = await chartDB.create(importedData);
      setCurrentChart(newChart);
      alert('Chart imported successfully!');
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import file. Please check the file format.');
    }

    // Reset the file input
    event.target.value = '';
  };

  const handleNewChart = async () => {
    if (!currentChart) return;

    // Check if current chart is already empty
    if (currentChart.tasks.length === 0) {
      alert('Current chart is already empty. No need to create a new one.');
      return;
    }

    // First export current chart as JSON
    const confirmNew = window.confirm(
      'This will save your current chart as JSON and start a new chart. Continue?'
    );

    if (!confirmNew) return;

    // Auto-export current chart
    const json = await chartDB.export(currentChart.id);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentChart.title}_backup.json`;
    a.click();
    URL.revokeObjectURL(url);

    // Small delay to ensure download starts
    await new Promise(resolve => setTimeout(resolve, 100));

    // Delete old chart from localStorage
    await chartDB.delete(currentChart.id);

    // Create new empty chart
    const newChart = await chartDB.create({
      title: 'New Project',
      timeRange: {
        start: new Date().toISOString().split('T')[0],
        end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      tasks: [],
    });

    // Force update the state and unlock
    setCurrentChart(null); // Clear first to force re-render
    await new Promise(resolve => setTimeout(resolve, 50));
    setCurrentChart(newChart);
    setShowTaskEditor(false);
    setEditingTask(null);
    setIsLocked(false);
  };

  const handleExport = async (format) => {
    if (!currentChart) return;

    if (format === 'json') {
      const json = await chartDB.export(currentChart.id);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentChart.title}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'svg') {
      if (!ganttRef.current) return;

      try {
        // Hide elements that shouldn't be exported
        const noExportElements = ganttRef.current.querySelectorAll('.no-export');
        noExportElements.forEach(el => el.style.display = 'none');

        // Get the SVG element from the Gantt chart
        const svgElement = ganttRef.current.querySelector('svg');
        if (!svgElement) {
          alert('No chart to export');
          return;
        }

        // Clone the SVG to avoid modifying the original
        const svgClone = svgElement.cloneNode(true);

        // Add the project title as text at the top
        const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        titleText.setAttribute('x', '50%');
        titleText.setAttribute('y', '30');
        titleText.setAttribute('text-anchor', 'middle');
        titleText.setAttribute('font-size', '24');
        titleText.setAttribute('font-weight', '600');
        titleText.setAttribute('fill', '#1e293b');
        titleText.textContent = currentChart.title;
        svgClone.insertBefore(titleText, svgClone.firstChild);

        // Adjust SVG height to accommodate title
        const currentHeight = parseInt(svgClone.getAttribute('height')) || 600;
        svgClone.setAttribute('height', currentHeight + 60);

        // Shift the gantt content down
        const ganttGroup = svgClone.querySelector('.gantt');
        if (ganttGroup) {
          ganttGroup.setAttribute('transform', 'translate(0, 50)');
        }

        // Serialize the SVG
        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(svgClone);

        // Add XML declaration and namespace
        svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;

        // Create blob and download
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentChart.title}.svg`;
        a.click();
        URL.revokeObjectURL(url);

        // Restore hidden elements
        noExportElements.forEach(el => el.style.display = '');
      } catch (error) {
        console.error('SVG export failed:', error);
        alert('SVG export failed. Please try again.');
      }
    } else if (format === 'png' || format === 'pdf') {
      if (!ganttRef.current) return;

      try {
        // Hide elements that shouldn't be exported
        const noExportElements = ganttRef.current.querySelectorAll('.no-export');
        noExportElements.forEach(el => el.style.display = 'none');

        const canvas = await html2canvas(ganttRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
        });

        // Restore hidden elements
        noExportElements.forEach(el => el.style.display = '');

        if (format === 'png') {
          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${currentChart.title}.png`;
            a.click();
            URL.revokeObjectURL(url);
          });
        } else if (format === 'pdf') {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({
            orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height],
          });
          pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
          pdf.save(`${currentChart.title}.pdf`);
        }
      } catch (error) {
        console.error('Export failed:', error);
        alert('Export failed. Please try again.');
      }
    }
  };

  if (!currentChart) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      {showHelp && (
        <div className="help-modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="help-header">
              <h2>Planen Help</h2>
              <button className="help-close" onClick={() => setShowHelp(false)}>×</button>
            </div>
            <div className="help-content">
              <section>
                <h3>🔒 Lock/Unlock</h3>
                <p>Click the lock button to unlock editing. When locked, you can't add, edit, or delete tasks.</p>
              </section>

              <section>
                <h3>📝 Project Title</h3>
                <p>Click the project title (when unlocked) to rename it. The title appears in exports.</p>
              </section>

              <section>
                <h3>➕ Adding Tasks</h3>
                <p>Click "Add Task" to create a new task. New tasks automatically start after the last task ends.</p>
              </section>

              <section>
                <h3>✏️ Editing Tasks</h3>
                <p>Unlock the chart, then click any task bar to edit its name, dates, color, and subtasks.</p>
              </section>

              <section>
                <h3>📋 Subtasks</h3>
                <p>Add up to unlimited subtasks per task. Each subtask can have its own dates, color, and description. First subtask starts at task start; subsequent ones start after the previous ends.</p>
              </section>

              <section>
                <h3>🎨 Colors</h3>
                <p>Click the color picker to change task/subtask colors. Text automatically adjusts for readability.</p>
              </section>

              <section>
                <h3>👁️ View Modes</h3>
                <p>Use the "View" dropdown to change time scale: Quarter Day, Half Day, Day, Week, or Month.</p>
              </section>

              <section>
                <h3>💾 Saving</h3>
                <p>All changes are automatically saved to your browser's local storage. Your data persists even after closing the browser.</p>
              </section>

              <section>
                <h3>📤 Export</h3>
                <p>Export your chart as PNG, PDF, SVG (vector), or JSON (data backup).</p>
              </section>

              <section>
                <h3>📥 Import</h3>
                <p>Click "Import JSON" to load a previously exported chart and continue editing.</p>
              </section>

              <section>
                <h3>🆕 New Chart</h3>
                <p>Click "New Chart" to start a fresh chart. Your current chart will be automatically saved as JSON before starting new.</p>
              </section>

              <footer className="help-footer">
                Created by <a href="https://github.com/ktallett" target="_blank" rel="noopener noreferrer">@ktallett</a> • Licensed under GPL 3.0
              </footer>
            </div>
          </div>
        </div>
      )}

      <header className="app-header">
        <div className="header-left">
          <h1>Planen</h1>
        </div>
        <div className="header-actions">
          <label className="view-mode-label">
            View:
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="view-mode-select"
            >
              <option value="Quarter Day">Quarter Day</option>
              <option value="Half Day">Half Day</option>
              <option value="Day">Day</option>
              <option value="Week">Week</option>
              <option value="Month">Month</option>
            </select>
          </label>
          <button className="help-button" onClick={() => setShowHelp(true)} title="Help">
            ?
          </button>
          <button
            onClick={() => setIsLocked(!isLocked)}
            className={isLocked ? 'btn-lock locked' : 'btn-lock unlocked'}
          >
            {isLocked ? '🔒 Locked' : '🔓 Unlocked'}
          </button>
          <button
            onClick={handleNewChart}
            className="btn-secondary"
            title="Start new chart (saves current as JSON)"
          >
            New Chart
          </button>
          <button
            onClick={() => {
              setEditingTask(null);
              setShowTaskEditor(true);
            }}
            className="btn-primary"
            disabled={isLocked}
          >
            Add Task
          </button>
          <div className="export-dropdown">
            <button
              className="btn-secondary"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Import/Export ▼
            </button>
            {showExportMenu && (
              <div className="export-menu">
                <label className="import-menu-item">
                  Import JSON
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      handleImport(e);
                      setShowExportMenu(false);
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
                <div className="menu-divider"></div>
                <button onClick={() => { handleExport('png'); setShowExportMenu(false); }}>Export PNG</button>
                <button onClick={() => { handleExport('pdf'); setShowExportMenu(false); }}>Export PDF</button>
                <button onClick={() => { handleExport('svg'); setShowExportMenu(false); }}>Export SVG</button>
                <button onClick={() => { handleExport('json'); setShowExportMenu(false); }}>Export JSON</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        {showTaskEditor ? (
          <TaskEditor
            task={editingTask}
            existingTasks={currentChart.tasks}
            onSave={handleSaveTask}
            onCancel={() => {
              setShowTaskEditor(false);
              setEditingTask(null);
            }}
            onDelete={handleDeleteTask}
          />
        ) : (
          <div ref={ganttRef}>
            <div className="project-title-section">
              {isEditingTitle ? (
                <input
                  type="text"
                  className="project-title-input"
                  defaultValue={currentChart.title}
                  autoFocus
                  onBlur={(e) => handleUpdateTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdateTitle(e.target.value);
                    } else if (e.key === 'Escape') {
                      setIsEditingTitle(false);
                    }
                  }}
                />
              ) : (
                <h2
                  className="project-title"
                  onClick={() => !isLocked && setIsEditingTitle(true)}
                  style={{ cursor: isLocked ? 'default' : 'pointer' }}
                >
                  {currentChart.title}
                  {!isLocked && <span className="edit-hint no-export"> ✏️</span>}
                </h2>
              )}
            </div>
            <GanttChart
              tasks={currentChart.tasks}
              viewMode={viewMode}
              onTaskClick={(task) => handleEditTask(task.id)}
            />
          </div>
        )}
      </main>

      <footer className="app-footer">
        Created by <a href="https://github.com/ktallett" target="_blank" rel="noopener noreferrer">@ktallett</a> • Licensed under GPL 3.0
      </footer>
    </div>
  );
}
