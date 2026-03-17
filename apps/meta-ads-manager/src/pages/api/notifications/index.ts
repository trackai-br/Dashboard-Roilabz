import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { user, error: authError } = await requireAuth(req);
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    return handleGet(req, res, user.id);
  }

  if (req.method === 'POST') {
    return handlePost(req, res, user.id);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { unreadOnly } = req.query;

    let query = supabase
      .from('meta_notifications')
      .select('*')
      .eq('user_id', userId);

    if (unreadOnly === 'true') {
      query = query.eq('read', false);
    }

    const { data: notifications, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }

    const unreadCount = notifications?.filter((n) => !n.read).length || 0;

    return res.status(200).json({
      notifications: notifications || [],
      count: notifications?.length || 0,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { notificationIds, action } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ error: 'Invalid notification IDs' });
    }

    if (action === 'mark-read') {
      const { error } = await supabase
        .from('meta_notifications')
        .update({ read: true })
        .in('id', notificationIds)
        .eq('user_id', userId);

      if (error) {
        return res.status(500).json({ error: 'Failed to update notifications' });
      }

      return res.status(200).json({
        success: true,
        message: 'Notifications marked as read',
      });
    }

    if (action === 'delete') {
      const { error } = await supabase
        .from('meta_notifications')
        .delete()
        .in('id', notificationIds)
        .eq('user_id', userId);

      if (error) {
        return res.status(500).json({ error: 'Failed to delete notifications' });
      }

      return res.status(200).json({
        success: true,
        message: 'Notifications deleted',
      });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
