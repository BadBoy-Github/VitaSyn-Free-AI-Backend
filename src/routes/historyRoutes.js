import express from 'express';
import jwt from 'jsonwebtoken';
import { getAssessments, getAssessmentById } from '../utils/store.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'vitasyn_secret_key_2025';

/**
 * Middleware: extract userId from JWT token if present.
 * Sets req.userId to the decoded userId or null.
 */
function extractUserId(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.replace('Bearer ', ''), JWT_SECRET);
      req.userId = decoded.userId || null;
    } catch {
      req.userId = null;
    }
  } else {
    req.userId = null;
  }
  next();
}

/**
 * GET /api/history
 * Fetch past assessments — filtered to the current user if authenticated.
 */
router.get('/', extractUserId, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 25, 50);
    // Only return this user's assessments; if not authenticated return empty
    const userId = req.userId;
    if (!userId) {
      return res.json({ success: true, data: [] });
    }
    const assessments = await getAssessments(limit, userId);
    return res.json({
      success: true,
      data: assessments,
    });
  } catch (error) {
    console.error('History fetch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch assessment history.',
      error: error.message,
    });
  }
});

/**
 * GET /api/history/:id
 * Fetch single assessment by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const item = await getAssessmentById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found.',
      });
    }
    return res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('History single item error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch assessment.',
      error: error.message,
    });
  }
});

export default router;
