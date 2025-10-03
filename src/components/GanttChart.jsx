import { useEffect, useRef } from 'react';
import Gantt from 'frappe-gantt';
import 'frappe-gantt/dist/frappe-gantt.css';

export default function GanttChart({ tasks, onTaskClick, viewMode = 'Day' }) {
  const ganttContainer = useRef(null);
  const ganttInstance = useRef(null);

  useEffect(() => {
    if (!ganttContainer.current || !tasks || tasks.length === 0) return;

    console.log('GanttChart tasks:', tasks); // Debug

    // Generate unique CSS class names for each color and inject styles
    const colorMap = new Map();
    let styleSheet = document.getElementById('gantt-dynamic-styles');

    if (!styleSheet) {
      styleSheet = document.createElement('style');
      styleSheet.id = 'gantt-dynamic-styles';
      document.head.appendChild(styleSheet);
    }

    let cssRules = '';

    // Helper function to determine if a color is light or dark
    const isLightColor = (hexColor) => {
      const rgb = parseInt(hexColor.slice(1), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      return luminance > 155;
    };

    tasks.forEach((task) => {
      if (task.color && !colorMap.has(task.color)) {
        const className = `color-${task.color.replace('#', '')}`;
        colorMap.set(task.color, className);
        const textColor = isLightColor(task.color) ? '#000000' : '#ffffff';
        // Multiple selectors to ensure it works
        cssRules += `.gantt .bar-wrapper.${className} .bar { fill: ${task.color} !important; }\n`;
        cssRules += `.gantt .${className} { fill: ${task.color} !important; }\n`;
        cssRules += `.gantt .bar.${className} { fill: ${task.color} !important; }\n`;
        cssRules += `.gantt .bar-wrapper.${className} .bar-label { fill: ${textColor} !important; }\n`;
      }

      task.subtasks?.forEach((subtask) => {
        if (subtask.color && !colorMap.has(subtask.color)) {
          const className = `color-${subtask.color.replace('#', '')}`;
          colorMap.set(subtask.color, className);
          const textColor = isLightColor(subtask.color) ? '#000000' : '#ffffff';
          // Multiple selectors to ensure it works
          cssRules += `.gantt .bar-wrapper.${className} .bar { fill: ${subtask.color} !important; }\n`;
          cssRules += `.gantt .${className} { fill: ${subtask.color} !important; }\n`;
          cssRules += `.gantt .bar.${className} { fill: ${subtask.color} !important; }\n`;
          cssRules += `.gantt .bar-wrapper.${className} .bar-label { fill: ${textColor} !important; }\n`;
        }
      });
    });

    console.log('CSS Rules:', cssRules); // Debug
    // Always update the stylesheet content
    styleSheet.textContent = cssRules;

    // Transform tasks to Frappe Gantt format
    const ganttTasks = tasks.flatMap((task) => {
      const mainTask = {
        id: task.id,
        name: task.name,
        start: task.start,
        end: task.end,
        progress: task.progress || 0,
        custom_class: task.color ? colorMap.get(task.color) : 'bar-milestone',
      };

      // Add subtasks if they exist
      const subtasks = task.subtasks?.map((subtask) => ({
        id: subtask.id,
        name: `  ${subtask.name}`, // Indent subtask names
        start: subtask.start,
        end: subtask.end,
        progress: subtask.progress || 0,
        dependencies: task.id,
        custom_class: subtask.color ? colorMap.get(subtask.color) : 'bar-task',
      })) || [];

      return [mainTask, ...subtasks];
    });

    // Clear and reinitialize Frappe Gantt to ensure colors update
    ganttContainer.current.innerHTML = '';
    ganttInstance.current = new Gantt(ganttContainer.current, ganttTasks, {
      view_mode: viewMode,
      date_format: 'YYYY-MM-DD',
      on_click: (task) => {
        if (onTaskClick) onTaskClick(task);
      },
      on_date_change: (task, start, end) => {
        console.log('Date changed:', task, start, end);
      },
      on_progress_change: (task, progress) => {
        console.log('Progress changed:', task, progress);
      },
    });

    // After Gantt is created, apply text colors directly to SVG elements
    setTimeout(() => {
      const svg = ganttContainer.current.querySelector('svg');
      if (svg) {
        console.log('Applying text colors to SVG elements');

        // First, set all text to dark color
        const allTexts = svg.querySelectorAll('text');
        allTexts.forEach(textEl => {
          textEl.setAttribute('fill', '#1e293b');
          textEl.style.setProperty('fill', '#1e293b', 'important');
          textEl.setAttribute('font-weight', '500');
          textEl.setAttribute('opacity', '1');
        });

        // Then check each task's text position and apply appropriate color
        ganttTasks.forEach((ganttTask) => {
          // Find the task's color from original data
          let taskColor = null;
          for (const task of tasks) {
            if (task.id === ganttTask.id) {
              taskColor = task.color;
              break;
            }
            if (task.subtasks) {
              const subtask = task.subtasks.find(st => st.id === ganttTask.id);
              if (subtask) {
                taskColor = subtask.color;
                break;
              }
            }
          }

          if (taskColor) {
            const textColor = isLightColor(taskColor) ? '#000000' : '#ffffff';

            // Try multiple selectors to find the bar wrapper
            let barWrapper = svg.querySelector(`.bar-wrapper[data-id="${ganttTask.id}"]`);

            if (!barWrapper) {
              const allWrappers = svg.querySelectorAll('.bar-wrapper');
              for (const wrapper of allWrappers) {
                const bar = wrapper.querySelector('.bar');
                if (bar && bar.getAttribute('data-id') === ganttTask.id) {
                  barWrapper = wrapper;
                  break;
                }
              }
            }

            if (barWrapper) {
              const bar = barWrapper.querySelector('.bar');
              const barLabel = barWrapper.querySelector('.bar-label');

              if (bar && barLabel) {
                try {
                  const barBBox = bar.getBBox();
                  const labelBBox = barLabel.getBBox();

                  // Check if label center is within bar bounds (with small margin)
                  const labelCenterX = labelBBox.x + labelBBox.width / 2;
                  const isInside = labelCenterX >= barBBox.x && labelCenterX <= (barBBox.x + barBBox.width);

                  if (isInside) {
                    // Text is inside bar - use contrast color
                    barLabel.setAttribute('fill', textColor);
                    barLabel.style.setProperty('fill', textColor, 'important');
                    console.log(`Text INSIDE bar for ${ganttTask.name}: using ${textColor}`);
                  } else {
                    // Text is outside bar - keep dark
                    console.log(`Text OUTSIDE bar for ${ganttTask.name}: keeping dark`);
                  }
                } catch (e) {
                  console.error('Error checking text position:', e);
                }
              }
            }
          }
        });
      }
    }, 500);

    return () => {
      // Cleanup
      if (ganttInstance.current) {
        ganttInstance.current = null;
      }
    };
  }, [tasks, viewMode, onTaskClick]);

  return (
    <div className="gantt-container">
      <div ref={ganttContainer}></div>
    </div>
  );
}
