import Dexie from 'dexie';

export const db = new Dexie('planenDB');

// Define database schema
db.version(1).stores({
  charts: '++id, title, createdAt, updatedAt',
});

// Chart model helper functions
export const chartDB = {
  // Create a new chart
  async create(chartData) {
    const now = new Date().toISOString();
    const chart = {
      title: chartData.title || 'Untitled Chart',
      timeRange: chartData.timeRange || {
        start: new Date().toISOString().split('T')[0],
        end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      tasks: chartData.tasks || [],
      createdAt: now,
      updatedAt: now,
    };
    const id = await db.charts.add(chart);
    return { ...chart, id };
  },

  // Get a chart by ID
  async get(id) {
    return await db.charts.get(id);
  },

  // Get all charts
  async getAll() {
    return await db.charts.orderBy('updatedAt').reverse().toArray();
  },

  // Update a chart
  async update(id, updates) {
    const now = new Date().toISOString();
    await db.charts.update(id, {
      ...updates,
      updatedAt: now,
    });
    return await db.charts.get(id);
  },

  // Delete a chart
  async delete(id) {
    await db.charts.delete(id);
  },

  // Export chart as JSON
  async export(id) {
    const chart = await db.charts.get(id);
    return JSON.stringify(chart, null, 2);
  },

  // Import chart from JSON
  async import(jsonString) {
    const chart = JSON.parse(jsonString);
    delete chart.id; // Let DB assign new ID
    return await this.create(chart);
  },
};
