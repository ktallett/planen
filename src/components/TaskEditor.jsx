import { useState } from 'react';

export default function TaskEditor({ task, existingTasks = [], onSave, onCancel, onDelete }) {
  // Calculate default dates for new task
  const getDefaultTaskDates = () => {
    if (task) {
      // Editing existing task - use its dates
      return { start: task.start, end: task.end };
    }

    if (existingTasks.length === 0) {
      // First task - use today and +7 days
      return {
        start: new Date().toISOString().split('T')[0],
        end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      };
    }

    // New task - start day after last task ends
    const lastTask = existingTasks[existingTasks.length - 1];
    const nextStartDate = new Date(lastTask.end);
    nextStartDate.setDate(nextStartDate.getDate() + 1);
    const nextStart = nextStartDate.toISOString().split('T')[0];

    const nextEndDate = new Date(nextStartDate);
    nextEndDate.setDate(nextEndDate.getDate() + 7);
    const nextEnd = nextEndDate.toISOString().split('T')[0];

    return { start: nextStart, end: nextEnd };
  };

  const defaultDates = getDefaultTaskDates();

  const [formData, setFormData] = useState(
    task || {
      id: crypto.randomUUID(),
      name: '',
      start: defaultDates.start,
      end: defaultDates.end,
      color: '#3b82f6',
      subtasks: [],
    }
  );

  // Calculate initial subtask dates based on existing subtasks
  const getInitialSubtaskDates = () => {
    const existingSubtasks = formData.subtasks || [];

    if (existingSubtasks.length === 0) {
      // First subtask: start at task start date
      return {
        start: formData.start,
        end: formData.end,
      };
    } else {
      // Subsequent subtasks: start day after last subtask ends
      const lastSubtask = existingSubtasks[existingSubtasks.length - 1];
      const nextStartDate = new Date(lastSubtask.end);
      nextStartDate.setDate(nextStartDate.getDate() + 1);
      const nextStart = nextStartDate.toISOString().split('T')[0];

      const nextEndDate = new Date(nextStartDate);
      nextEndDate.setDate(nextEndDate.getDate() + 7);
      const nextEnd = nextEndDate.toISOString().split('T')[0];

      return { start: nextStart, end: nextEnd };
    }
  };

  const [newSubtask, setNewSubtask] = useState({
    name: '',
    description: '',
    ...getInitialSubtaskDates(),
    color: '#60a5fa',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddSubtask = () => {
    if (!newSubtask.name) return;

    const subtask = {
      id: crypto.randomUUID(),
      ...newSubtask,
    };

    const updatedSubtasks = [...(formData.subtasks || []), subtask];
    setFormData({
      ...formData,
      subtasks: updatedSubtasks,
    });

    // Calculate next subtask start date (day after the last subtask ends)
    const lastSubtask = subtask;
    const nextStartDate = new Date(lastSubtask.end);
    nextStartDate.setDate(nextStartDate.getDate() + 1);
    const nextStart = nextStartDate.toISOString().split('T')[0];

    // Default end date (7 days after new start)
    const nextEndDate = new Date(nextStartDate);
    nextEndDate.setDate(nextEndDate.getDate() + 7);
    const nextEnd = nextEndDate.toISOString().split('T')[0];

    setNewSubtask({
      name: '',
      description: '',
      start: nextStart,
      end: nextEnd,
      color: '#60a5fa',
    });
  };

  const handleRemoveSubtask = (subtaskId) => {
    setFormData({
      ...formData,
      subtasks: formData.subtasks.filter((st) => st.id !== subtaskId),
    });
  };

  const handleUpdateSubtaskColor = (subtaskId, newColor) => {
    setFormData({
      ...formData,
      subtasks: formData.subtasks.map((st) =>
        st.id === subtaskId ? { ...st, color: newColor } : st
      ),
    });
  };

  const handleUpdateSubtaskField = (subtaskId, field, value) => {
    setFormData({
      ...formData,
      subtasks: formData.subtasks.map((st) =>
        st.id === subtaskId ? { ...st, [field]: value } : st
      ),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name) {
      onSave(formData);
    }
  };

  return (
    <div className="task-editor">
      <h3>{task ? 'Edit Task' : 'New Task'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Task Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="start">Start Date</label>
            <input
              type="date"
              id="start"
              name="start"
              value={formData.start}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="end">End Date</label>
            <input
              type="date"
              id="end"
              name="end"
              value={formData.end}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="color">Color</label>
          <input
            type="color"
            id="color"
            name="color"
            value={formData.color}
            onChange={handleChange}
          />
        </div>

        <div className="subtasks-section">
          <h4>Subtasks</h4>
          {formData.subtasks?.map((subtask) => (
            <div key={subtask.id} className="subtask-item">
              <label className="subtask-color-picker">
                <input
                  type="color"
                  value={subtask.color}
                  onChange={(e) => handleUpdateSubtaskColor(subtask.id, e.target.value)}
                  title="Change subtask color"
                />
                <div
                  className="subtask-color-indicator"
                  style={{ backgroundColor: subtask.color }}
                ></div>
              </label>
              <div className="subtask-info">
                <input
                  type="text"
                  className="subtask-name-input"
                  value={subtask.name}
                  onChange={(e) => handleUpdateSubtaskField(subtask.id, 'name', e.target.value)}
                  placeholder="Subtask name"
                />
                <input
                  type="text"
                  className="subtask-description-input"
                  value={subtask.description || ''}
                  onChange={(e) => handleUpdateSubtaskField(subtask.id, 'description', e.target.value)}
                  placeholder="Description (optional)"
                />
                <div className="subtask-dates-edit">
                  <input
                    type="date"
                    value={subtask.start}
                    onChange={(e) => handleUpdateSubtaskField(subtask.id, 'start', e.target.value)}
                  />
                  <span>→</span>
                  <input
                    type="date"
                    value={subtask.end}
                    onChange={(e) => handleUpdateSubtaskField(subtask.id, 'end', e.target.value)}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveSubtask(subtask.id)}
                className="btn-remove"
              >
                Remove
              </button>
            </div>
          ))}

          <div className="add-subtask">
            <input
              type="text"
              placeholder="Subtask name"
              value={newSubtask.name}
              onChange={(e) =>
                setNewSubtask({ ...newSubtask, name: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newSubtask.description}
              onChange={(e) =>
                setNewSubtask({ ...newSubtask, description: e.target.value })
              }
            />
            <input
              type="date"
              value={newSubtask.start}
              onChange={(e) =>
                setNewSubtask({ ...newSubtask, start: e.target.value })
              }
            />
            <input
              type="date"
              value={newSubtask.end}
              onChange={(e) =>
                setNewSubtask({ ...newSubtask, end: e.target.value })
              }
            />
            <input
              type="color"
              value={newSubtask.color}
              onChange={(e) =>
                setNewSubtask({ ...newSubtask, color: e.target.value })
              }
              title="Subtask color"
            />
            <button type="button" onClick={handleAddSubtask} className="btn-add">
              Add Subtask
            </button>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Save
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          {task && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="btn-danger"
            >
              Delete
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
