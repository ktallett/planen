import { useEffect, useRef, useState } from 'react';
import Gantt from 'frappe-gantt';
import 'frappe-gantt/dist/frappe-gantt.css';

export default function GanttChart({ tasks, onTaskClick, viewMode = 'Day' }) {
  const ganttContainer = useRef(null);
  const ganttInstance = useRef(null);
  const touchState = useRef({ startX: 0, startY: 0, lastX: 0, lastY: 0, isDragging: false, pinchDistance: 0 });
  const [scale, setScale] = useState(1);

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
      padding: 18,
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

    // After Gantt is created, apply text colors and add week numbers
    setTimeout(() => {
      const svg = ganttContainer.current.querySelector('svg');
      if (svg) {
        console.log('Applying text colors to SVG elements');

        // Trim SVG height to remove excess whitespace at bottom
        const ganttGroup = svg.querySelector('.gantt');
        if (ganttGroup) {
          const bbox = ganttGroup.getBBox();
          const newHeight = bbox.y + bbox.height + 20; // Add small padding
          svg.setAttribute('height', newHeight);
        }

        // Add week numbers
        const allDates = [];
        tasks.forEach(task => {
          allDates.push(new Date(task.start));
          allDates.push(new Date(task.end));
          if (task.subtasks) {
            task.subtasks.forEach(subtask => {
              allDates.push(new Date(subtask.start));
              allDates.push(new Date(subtask.end));
            });
          }
        });

        if (allDates.length > 0) {
          const startDate = new Date(Math.min(...allDates));
          const endDate = new Date(Math.max(...allDates));
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(0, 0, 0, 0);

          // Calculate number of weeks
          const diffTime = endDate.getTime() - startDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const numWeeks = Math.ceil(diffDays / 7);

          // Create week labels group
          let weekLabelsGroup = svg.querySelector('.week-labels-group');
          if (!weekLabelsGroup) {
            weekLabelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            weekLabelsGroup.setAttribute('class', 'week-labels-group');
            svg.appendChild(weekLabelsGroup); // Append to end so it's on top
          } else {
            weekLabelsGroup.innerHTML = '';
          }

          // Get all bars and find the actual leftmost and rightmost positions
          const gridBars = svg.querySelectorAll('.bar');
          if (gridBars.length > 0) {
            let minX = Infinity;
            let maxX = -Infinity;

            gridBars.forEach(bar => {
              const bbox = bar.getBBox();
              minX = Math.min(minX, bbox.x);
              maxX = Math.max(maxX, bbox.x + bbox.width);
            });

            const chartStart = minX;
            const chartEnd = maxX;
            const chartWidth = chartEnd - chartStart;
            const weekWidth = chartWidth / numWeeks;

            // Add background rectangle for week numbers
            const weekBgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            weekBgRect.setAttribute('x', chartStart);
            weekBgRect.setAttribute('y', '0');
            weekBgRect.setAttribute('width', chartWidth);
            weekBgRect.setAttribute('height', '25');
            weekBgRect.style.fill = '#f8fafc';
            weekBgRect.style.stroke = '#e2e8f0';
            weekBgRect.style.strokeWidth = '1';
            weekLabelsGroup.appendChild(weekBgRect);

            // Get SVG height to draw vertical lines
            const svgHeight = svg.getBBox().height;

            // Add vertical lines for week boundaries
            for (let i = 1; i < numWeeks; i++) {
              const weekLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
              const x = chartStart + (i * weekWidth);
              weekLine.setAttribute('x1', x);
              weekLine.setAttribute('y1', '0');
              weekLine.setAttribute('x2', x);
              weekLine.setAttribute('y2', svgHeight);
              weekLine.style.stroke = '#b0b7c0';
              weekLine.style.strokeWidth = '1';
              weekLine.style.strokeDasharray = 'none';
              weekLine.style.opacity = '0.6';
              weekLine.style.pointerEvents = 'none';
              weekLabelsGroup.appendChild(weekLine);
            }

            // Add week number labels (show every other week in Month view)
            const skipInterval = viewMode === 'Month' ? 2 : 1;
            for (let i = 0; i < numWeeks; i += skipInterval) {
              const weekText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              const x = chartStart + (i * weekWidth) + (weekWidth / 2);
              weekText.setAttribute('x', x);
              weekText.setAttribute('y', '17');
              weekText.setAttribute('text-anchor', 'middle');
              weekText.setAttribute('font-size', '12');
              weekText.setAttribute('font-weight', '700');
              weekText.setAttribute('class', 'week-number-label');
              weekText.style.fill = '#3b82f6';
              weekText.style.pointerEvents = 'none';
              weekText.textContent = `W${i + 1}`;
              weekLabelsGroup.appendChild(weekText);
            }
          }
        }

        // First, set all text to dark color (except week labels)
        const allTexts = svg.querySelectorAll('text:not(.week-number-label)');
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

  // Touch event handlers for mobile
  useEffect(() => {
    const container = ganttContainer.current;
    if (!container) return;

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        touchState.current.isDragging = true;
        touchState.current.startX = e.touches[0].clientX;
        touchState.current.startY = e.touches[0].clientY;
        touchState.current.lastX = container.scrollLeft;
        touchState.current.lastY = container.scrollTop;
      } else if (e.touches.length === 2) {
        // Pinch to zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        touchState.current.pinchDistance = distance;
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 1 && touchState.current.isDragging) {
        e.preventDefault();
        const deltaX = touchState.current.startX - e.touches[0].clientX;
        const deltaY = touchState.current.startY - e.touches[0].clientY;
        container.scrollLeft = touchState.current.lastX + deltaX;
        container.scrollTop = touchState.current.lastY + deltaY;
      } else if (e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        if (touchState.current.pinchDistance > 0) {
          const delta = distance - touchState.current.pinchDistance;
          const newScale = Math.max(0.5, Math.min(3, scale + delta * 0.01));
          setScale(newScale);
        }
        touchState.current.pinchDistance = distance;
      }
    };

    const handleTouchEnd = () => {
      touchState.current.isDragging = false;
      touchState.current.pinchDistance = 0;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [scale]);

  return (
    <div className="gantt-container">
      <div
        ref={ganttContainer}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          transition: 'transform 0.1s ease-out'
        }}
      ></div>
    </div>
  );
}
