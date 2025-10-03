// Simple localStorage-based storage for better reliability
const STORAGE_KEY = 'planen_charts';

// Get next available ID
const getNextId = (charts) => {
  if (charts.length === 0) return 1;
  return Math.max(...charts.map(c => c.id)) + 1;
};

// Load all charts from localStorage
const loadCharts = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const charts = JSON.parse(stored);
    console.log('Loaded charts from localStorage:', charts);
    return charts;
  } catch (error) {
    console.error('Error loading charts:', error);
    return [];
  }
};

// Save all charts to localStorage
const saveCharts = (charts) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(charts));
    console.log('Saved charts to localStorage:', charts);
    return true;
  } catch (error) {
    console.error('Error saving charts:', error);
    return false;
  }
};

// Chart model helper functions
export const chartDB = {
  // Create a new chart
  async create(chartData) {
    const charts = loadCharts();
    const now = new Date().toISOString();
    const chart = {
      id: getNextId(charts),
      title: chartData.title || 'Untitled Chart',
      timeRange: chartData.timeRange || {
        start: new Date().toISOString().split('T')[0],
        end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      tasks: chartData.tasks || [],
      createdAt: now,
      updatedAt: now,
    };
    charts.push(chart);
    saveCharts(charts);
    return chart;
  },

  // Get a chart by ID
  async get(id) {
    const charts = loadCharts();
    return charts.find(c => c.id === id);
  },

  // Get all charts
  async getAll() {
    const charts = loadCharts();
    return charts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },

  // Update a chart
  async update(id, updates) {
    const charts = loadCharts();
    const index = charts.findIndex(c => c.id === id);
    if (index === -1) return null;

    const now = new Date().toISOString();
    charts[index] = {
      ...charts[index],
      ...updates,
      updatedAt: now,
    };
    saveCharts(charts);
    return charts[index];
  },

  // Delete a chart
  async delete(id) {
    const charts = loadCharts();
    const filtered = charts.filter(c => c.id !== id);
    saveCharts(filtered);
  },

  // Export chart as JSON
  async export(id) {
    const chart = await this.get(id);
    return JSON.stringify(chart, null, 2);
  },

  // Import chart from JSON
  async import(jsonString) {
    const chart = JSON.parse(jsonString);
    delete chart.id; // Let DB assign new ID
    return await this.create(chart);
  },
};
