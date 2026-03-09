import { supabase } from './supabaseClient';

/**
 * Query contact emails from multiple pools based on a segment definition.
 * Deduplicates by lowercased email.
 *
 * @param {Object} segment - { sources: string[], tags?: string[] }
 * @returns {Promise<string[]>} Array of unique email strings
 */
export async function querySegmentEmails(segment) {
  const { sources, tags } = segment;
  const isAll = sources.includes('all');
  const hasTags = tags && tags.length > 0;
  const emails = new Set();

  // external_contacts pool
  if (isAll || sources.includes('external')) {
    let query = supabase
      .from('external_contacts')
      .select('email')
      .eq('subscribed', true);

    if (hasTags) {
      query = query.overlaps('tags', tags);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (data) {
      for (const row of data) {
        if (row.email) emails.add(row.email.toLowerCase());
      }
    }
  }

  // crm_contacts pool
  if (isAll || sources.includes('crm')) {
    let query = supabase
      .from('crm_contacts')
      .select('email')
      .not('email', 'is', null);

    if (hasTags) {
      query = query.overlaps('tags', tags);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (data) {
      for (const row of data) {
        if (row.email) emails.add(row.email.toLowerCase());
      }
    }
  }

  // public_leads pool (no tags column — include when findmyflow tag
  // is selected or no tags are active, since quiz leads are FMF users)
  if (isAll || sources.includes('leads')) {
    const includeleads = !hasTags || tags.includes('findmyflow');
    if (includeleads) {
      const query = supabase
        .from('public_leads')
        .select('email')
        .not('email', 'is', null);

      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        for (const row of data) {
          if (row.email) emails.add(row.email.toLowerCase());
        }
      }
    }
  }

  return Array.from(emails);
}

/**
 * Count the number of unique recipients for a given segment.
 *
 * @param {Object} segment - { sources: string[], tags?: string[] }
 * @returns {Promise<number>}
 */
export async function countSegmentRecipients(segment) {
  const emails = await querySegmentEmails(segment);
  return emails.length;
}

/**
 * Fetch all distinct tags from external_contacts and crm_contacts.
 * Returns a sorted array of unique tag strings.
 *
 * @returns {Promise<string[]>}
 */
export async function fetchAvailableTags() {
  const tagSet = new Set();

  // Tags from external_contacts (subscribed only)
  const { data: externalData, error: externalError } = await supabase
    .from('external_contacts')
    .select('tags')
    .eq('subscribed', true);

  if (externalError) throw externalError;
  if (externalData) {
    for (const row of externalData) {
      if (Array.isArray(row.tags)) {
        for (const tag of row.tags) {
          tagSet.add(tag);
        }
      }
    }
  }

  // Tags from crm_contacts (where tags not null)
  const { data: crmData, error: crmError } = await supabase
    .from('crm_contacts')
    .select('tags')
    .not('tags', 'is', null);

  if (crmError) throw crmError;
  if (crmData) {
    for (const row of crmData) {
      if (Array.isArray(row.tags)) {
        for (const tag of row.tags) {
          tagSet.add(tag);
        }
      }
    }
  }

  return Array.from(tagSet).sort();
}

/**
 * Send a newsletter by invoking the send-newsletter edge function.
 *
 * @param {string} draftId - The newsletter draft ID
 * @param {Object} segment - The audience segment definition
 * @param {string|null} scheduledFor - Optional ISO timestamp for scheduled sending
 * @returns {Promise<Object>} Response data from the edge function
 */
export async function sendNewsletter(draftId, segment, scheduledFor = null) {
  const { data, error } = await supabase.functions.invoke('send-newsletter', {
    body: {
      draft_id: draftId,
      segment,
      scheduled_for: scheduledFor,
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Send a test email to a specific address without affecting draft status.
 *
 * @param {string} draftId - The newsletter draft ID
 * @param {string} testEmail - Email address to send the test to
 * @returns {Promise<Object>} Response data from the edge function
 */
export async function sendTestNewsletter(draftId, testEmail) {
  const { data, error } = await supabase.functions.invoke('send-newsletter', {
    body: {
      draft_id: draftId,
      test_email: testEmail,
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Fetch the send progress for a newsletter draft.
 *
 * @param {string} draftId - The newsletter draft ID
 * @returns {Promise<Object|null>} { total, sent, queued, failed, nextBatchAt } or null if no rows
 */
export async function fetchSendProgress(draftId) {
  const { data, error } = await supabase
    .from('newsletter_sends')
    .select('status, scheduled_for')
    .eq('draft_id', draftId);

  if (error) throw error;
  if (!data || data.length === 0) return null;

  const total = data.length;
  const sent = data.filter((row) => row.status === 'sent').length;
  const queued = data.filter((row) => row.status === 'queued').length;
  const failed = data.filter((row) => row.status === 'failed').length;

  const queuedRows = data.filter(
    (row) => row.status === 'queued' && row.scheduled_for
  );
  const nextBatchAt =
    queuedRows.length > 0
      ? queuedRows.reduce((earliest, row) =>
          row.scheduled_for < earliest ? row.scheduled_for : earliest,
        queuedRows[0].scheduled_for)
      : null;

  return { total, sent, queued, failed, nextBatchAt };
}

/**
 * Retry failed sends for a newsletter draft.
 * Calls the edge function in retry mode — only resends failed rows.
 *
 * @param {string} draftId - The newsletter draft ID
 * @returns {Promise<Object>} Response data from the edge function
 */
export async function retryFailedSends(draftId) {
  const { data, error } = await supabase.functions.invoke('send-newsletter', {
    body: {
      draft_id: draftId,
      retry: true,
    },
  });

  if (error) throw error;
  return data;
}
