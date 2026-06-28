import { Router } from 'express';
import { queryAll, queryOne, runQuery } from '../db/database.js';
import { generateLinkedInPost, regenerateWithFeedback } from '../agents/postGenerator.js';
import { generateProjectOverview, generateMilestonePost } from '../agents/overviewAgent.js';

const router = Router();

// POST /api/posts/generate — Generate a LinkedIn post from raw input
router.post('/generate', async (req, res) => {
  try {
    const { input, tone = 'professional', daily_log_id, project_id } = req.body;

    if (!input || !input.trim()) {
      return res.status(400).json({ success: false, error: 'Input text is required' });
    }

    const validTones = ['professional', 'casual', 'storytelling', 'motivational'];
    if (!validTones.includes(tone)) {
      return res.status(400).json({
        success: false,
        error: `Invalid tone. Choose from: ${validTones.join(', ')}`
      });
    }

    const generatedContent = await generateLinkedInPost(input.trim(), tone);

    // Save to database
    const result = runQuery(`
      INSERT INTO generated_posts (daily_log_id, project_id, raw_input, generated_content, tone)
      VALUES (?, ?, ?, ?, ?)
    `, [
      daily_log_id ? Number(daily_log_id) : null,
      project_id ? Number(project_id) : null,
      input.trim(),
      generatedContent,
      tone
    ]);

    const post = queryOne('SELECT * FROM generated_posts WHERE id = ?', [result.lastInsertRowid]);

    res.status(201).json({ success: true, data: post });
  } catch (error) {
    console.error('Error generating post:', error);

    if (error.message?.includes('API key')) {
      return res.status(401).json({ success: false, error: error.message });
    }

    res.status(500).json({ success: false, error: 'Failed to generate post. ' + error.message });
  }
});

// POST /api/posts/regenerate — Regenerate a post with feedback
router.post('/regenerate', async (req, res) => {
  try {
    const { post_id, feedback, tone } = req.body;

    if (!post_id) {
      return res.status(400).json({ success: false, error: 'post_id is required' });
    }
    if (!feedback || !feedback.trim()) {
      return res.status(400).json({ success: false, error: 'Feedback is required' });
    }

    const originalPost = queryOne('SELECT * FROM generated_posts WHERE id = ?', [Number(post_id)]);

    if (!originalPost) {
      return res.status(404).json({ success: false, error: 'Original post not found' });
    }

    const useTone = tone || originalPost.tone;
    const regenerated = await regenerateWithFeedback(
      originalPost.generated_content,
      feedback.trim(),
      useTone
    );

    // Save as new post referencing same source
    const result = runQuery(`
      INSERT INTO generated_posts (daily_log_id, project_id, raw_input, generated_content, tone)
      VALUES (?, ?, ?, ?, ?)
    `, [
      originalPost.daily_log_id,
      originalPost.project_id,
      originalPost.raw_input + '\n\n[Feedback: ' + feedback.trim() + ']',
      regenerated,
      useTone
    ]);

    const post = queryOne('SELECT * FROM generated_posts WHERE id = ?', [result.lastInsertRowid]);

    res.status(201).json({ success: true, data: post });
  } catch (error) {
    console.error('Error regenerating post:', error);
    res.status(500).json({ success: false, error: 'Failed to regenerate post. ' + error.message });
  }
});

// POST /api/posts/project-overview — Generate overview post for a project
router.post('/project-overview', async (req, res) => {
  try {
    const { project_id, tone = 'professional' } = req.body;

    if (!project_id) {
      return res.status(400).json({ success: false, error: 'project_id is required' });
    }

    const project = queryOne('SELECT * FROM projects WHERE id = ?', [Number(project_id)]);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const logs = queryAll(
      'SELECT * FROM daily_logs WHERE project_id = ? ORDER BY day_number ASC',
      [Number(project_id)]
    );

    if (logs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Project has no daily logs. Add some logs first before generating an overview.'
      });
    }

    const generatedContent = await generateProjectOverview(project, logs, tone);

    // Save the generated post
    const rawInput = `Project Overview: ${project.name}\n${logs.length} days of logs`;
    const result = runQuery(`
      INSERT INTO generated_posts (project_id, raw_input, generated_content, tone)
      VALUES (?, ?, ?, ?)
    `, [Number(project_id), rawInput, generatedContent, tone]);

    const post = queryOne('SELECT * FROM generated_posts WHERE id = ?', [result.lastInsertRowid]);

    res.status(201).json({ success: true, data: post });
  } catch (error) {
    console.error('Error generating project overview:', error);
    res.status(500).json({ success: false, error: 'Failed to generate overview. ' + error.message });
  }
});

// GET /api/posts — List all generated posts
router.get('/', (req, res) => {
  try {
    const { limit = 50, offset = 0, project_id } = req.query;

    let posts;

    if (project_id) {
      posts = queryAll(`
        SELECT gp.*, p.name as project_name
        FROM generated_posts gp
        LEFT JOIN projects p ON p.id = gp.project_id
        WHERE gp.project_id = ?
        ORDER BY gp.created_at DESC
        LIMIT ? OFFSET ?
      `, [Number(project_id), Number(limit), Number(offset)]);
    } else {
      posts = queryAll(`
        SELECT gp.*, p.name as project_name
        FROM generated_posts gp
        LEFT JOIN projects p ON p.id = gp.project_id
        ORDER BY gp.created_at DESC
        LIMIT ? OFFSET ?
      `, [Number(limit), Number(offset)]);
    }

    res.json({ success: true, data: posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch posts' });
  }
});

// GET /api/posts/:id — Get specific post
router.get('/:id', (req, res) => {
  try {
    const post = queryOne(`
      SELECT gp.*, p.name as project_name
      FROM generated_posts gp
      LEFT JOIN projects p ON p.id = gp.project_id
      WHERE gp.id = ?
    `, [Number(req.params.id)]);

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    res.json({ success: true, data: post });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch post' });
  }
});

// PUT /api/posts/:id/favorite — Toggle favorite
router.put('/:id/favorite', (req, res) => {
  try {
    const id = Number(req.params.id);
    const post = queryOne('SELECT * FROM generated_posts WHERE id = ?', [id]);

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    runQuery('UPDATE generated_posts SET is_favorite = ? WHERE id = ?', [post.is_favorite ? 0 : 1, id]);

    const updated = queryOne('SELECT * FROM generated_posts WHERE id = ?', [id]);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle favorite' });
  }
});

// DELETE /api/posts/:id — Delete post
router.delete('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = queryOne('SELECT * FROM generated_posts WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    runQuery('DELETE FROM generated_posts WHERE id = ?', [id]);
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ success: false, error: 'Failed to delete post' });
  }
});

export default router;
