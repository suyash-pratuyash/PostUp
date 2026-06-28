import { Router } from 'express';
import { queryAll, queryOne, runQuery } from '../db/database.js';

const router = Router();

// GET /api/logs — List all logs (optional project filter)
router.get('/', (req, res) => {
  try {
    const { project_id, limit = 50, offset = 0 } = req.query;

    let logs;

    if (project_id) {
      logs = queryAll(`
        SELECT dl.*, p.name as project_name
        FROM daily_logs dl
        LEFT JOIN projects p ON p.id = dl.project_id
        WHERE dl.project_id = ?
        ORDER BY dl.day_number DESC
        LIMIT ? OFFSET ?
      `, [Number(project_id), Number(limit), Number(offset)]);
    } else {
      logs = queryAll(`
        SELECT dl.*, p.name as project_name
        FROM daily_logs dl
        LEFT JOIN projects p ON p.id = dl.project_id
        ORDER BY dl.created_at DESC
        LIMIT ? OFFSET ?
      `, [Number(limit), Number(offset)]);
    }

    // Parse tags from JSON string
    const parsed = logs.map(log => ({
      ...log,
      tags: JSON.parse(log.tags || '[]')
    }));

    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch logs' });
  }
});

// GET /api/logs/:id — Get specific log
router.get('/:id', (req, res) => {
  try {
    const log = queryOne(`
      SELECT dl.*, p.name as project_name
      FROM daily_logs dl
      LEFT JOIN projects p ON p.id = dl.project_id
      WHERE dl.id = ?
    `, [Number(req.params.id)]);

    if (!log) {
      return res.status(404).json({ success: false, error: 'Log not found' });
    }

    log.tags = JSON.parse(log.tags || '[]');
    res.json({ success: true, data: log });
  } catch (error) {
    console.error('Error fetching log:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch log' });
  }
});

// POST /api/logs — Create a new daily log
router.post('/', (req, res) => {
  try {
    const { project_id, day_number, title, content, tags = [] } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    // Auto-calculate day_number if not provided and project_id exists
    let finalDayNumber = day_number;
    if (!finalDayNumber && project_id) {
      const maxDay = queryOne(
        'SELECT MAX(day_number) as max_day FROM daily_logs WHERE project_id = ?',
        [Number(project_id)]
      );
      finalDayNumber = (maxDay?.max_day || 0) + 1;
    }

    // If project_id is provided, verify it exists
    if (project_id) {
      const project = queryOne('SELECT id FROM projects WHERE id = ?', [Number(project_id)]);
      if (!project) {
        return res.status(400).json({ success: false, error: 'Project not found' });
      }
    }

    const result = runQuery(`
      INSERT INTO daily_logs (project_id, day_number, title, content, tags)
      VALUES (?, ?, ?, ?, ?)
    `, [
      project_id ? Number(project_id) : null,
      finalDayNumber || null,
      title.trim(),
      content.trim(),
      JSON.stringify(tags)
    ]);

    // Update project's updated_at
    if (project_id) {
      runQuery('UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [Number(project_id)]);
    }

    const log = queryOne(`
      SELECT dl.*, p.name as project_name
      FROM daily_logs dl
      LEFT JOIN projects p ON p.id = dl.project_id
      WHERE dl.id = ?
    `, [result.lastInsertRowid]);

    log.tags = JSON.parse(log.tags || '[]');

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    console.error('Error creating log:', error);
    res.status(500).json({ success: false, error: 'Failed to create log' });
  }
});

// PUT /api/logs/:id — Update log
router.put('/:id', (req, res) => {
  try {
    const { title, content, tags, day_number } = req.body;
    const id = Number(req.params.id);

    const existing = queryOne('SELECT * FROM daily_logs WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Log not found' });
    }

    runQuery(`
      UPDATE daily_logs 
      SET title = ?,
          content = ?,
          tags = ?,
          day_number = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      title?.trim() || existing.title,
      content?.trim() || existing.content,
      tags ? JSON.stringify(tags) : existing.tags,
      day_number || existing.day_number,
      id
    ]);

    const log = queryOne(`
      SELECT dl.*, p.name as project_name
      FROM daily_logs dl
      LEFT JOIN projects p ON p.id = dl.project_id
      WHERE dl.id = ?
    `, [id]);

    log.tags = JSON.parse(log.tags || '[]');
    res.json({ success: true, data: log });
  } catch (error) {
    console.error('Error updating log:', error);
    res.status(500).json({ success: false, error: 'Failed to update log' });
  }
});

// DELETE /api/logs/:id — Delete log
router.delete('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = queryOne('SELECT * FROM daily_logs WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Log not found' });
    }

    runQuery('UPDATE generated_posts SET daily_log_id = NULL WHERE daily_log_id = ?', [id]);
    runQuery('DELETE FROM daily_logs WHERE id = ?', [id]);

    res.json({ success: true, message: 'Log deleted successfully' });
  } catch (error) {
    console.error('Error deleting log:', error);
    res.status(500).json({ success: false, error: 'Failed to delete log' });
  }
});

export default router;
