import { Router } from 'express';
import { queryAll, queryOne, runQuery } from '../db/database.js';

const router = Router();

// GET /api/projects — List all projects with log count
router.get('/', (req, res) => {
  try {
    const projects = queryAll(`
      SELECT 
        p.*,
        COUNT(dl.id) as log_count,
        MAX(dl.day_number) as latest_day
      FROM projects p
      LEFT JOIN daily_logs dl ON dl.project_id = p.id
      GROUP BY p.id
      ORDER BY p.updated_at DESC
    `);

    res.json({ success: true, data: projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/:id — Get project with all daily logs
router.get('/:id', (req, res) => {
  try {
    const project = queryOne('SELECT * FROM projects WHERE id = ?', [Number(req.params.id)]);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const logs = queryAll(`
      SELECT * FROM daily_logs 
      WHERE project_id = ? 
      ORDER BY day_number ASC
    `, [Number(req.params.id)]);

    const posts = queryAll(`
      SELECT * FROM generated_posts 
      WHERE project_id = ? 
      ORDER BY created_at DESC
    `, [Number(req.params.id)]);

    // Parse tags for logs
    const parsedLogs = logs.map(log => ({
      ...log,
      tags: JSON.parse(log.tags || '[]')
    }));

    res.json({ success: true, data: { ...project, logs: parsedLogs, posts } });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch project' });
  }
});

// POST /api/projects — Create a new project
router.post('/', (req, res) => {
  try {
    const { name, description = '' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Project name is required' });
    }

    const result = runQuery(
      'INSERT INTO projects (name, description) VALUES (?, ?)',
      [name.trim(), description.trim()]
    );

    const project = queryOne('SELECT * FROM projects WHERE id = ?', [result.lastInsertRowid]);

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, error: 'Failed to create project' });
  }
});

// PUT /api/projects/:id — Update project
router.put('/:id', (req, res) => {
  try {
    const { name, description, status } = req.body;
    const id = Number(req.params.id);

    const existing = queryOne('SELECT * FROM projects WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    runQuery(`
      UPDATE projects 
      SET name = ?,
          description = ?,
          status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name?.trim() || existing.name,
      description !== undefined ? description.trim() : existing.description,
      status || existing.status,
      id
    ]);

    const project = queryOne('SELECT * FROM projects WHERE id = ?', [id]);
    res.json({ success: true, data: project });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ success: false, error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id — Delete project
router.delete('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = queryOne('SELECT * FROM projects WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Unlink daily logs and posts instead of deleting them
    runQuery('UPDATE daily_logs SET project_id = NULL WHERE project_id = ?', [id]);
    runQuery('UPDATE generated_posts SET project_id = NULL WHERE project_id = ?', [id]);
    runQuery('DELETE FROM projects WHERE id = ?', [id]);

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ success: false, error: 'Failed to delete project' });
  }
});

export default router;
