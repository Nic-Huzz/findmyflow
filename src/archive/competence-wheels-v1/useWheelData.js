import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  SKILLS_SEGMENTS,
  PROBLEM_SEGMENTS,
  PERSONA_SEGMENTS,
  getSegmentsForWheel,
  getCombinedIdentity,
} from '../lib/wheelTaxonomy';

/**
 * useWheelData - Hook for fetching and managing competence wheel data
 *
 * @param {string} wheelType - 'skills' | 'problems' | 'persona'
 * @param {string} userId - User ID
 * @param {string} projectId - Project ID (optional, uses active project if not provided)
 * @returns {object} Wheel data, loading state, and utility functions
 */
export function useWheelData(wheelType, userId, projectId = null) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wheelId, setWheelId] = useState(null);
  const [segmentData, setSegmentData] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);

  // Get segment definitions for this wheel type
  const segments = useMemo(() => getSegmentsForWheel(wheelType), [wheelType]);

  // Calculate lit segments
  const litSegments = useMemo(() => {
    return segments.filter(s => segmentData[s.id]?.isLit);
  }, [segments, segmentData]);

  // Calculate progress percentage
  const progress = useMemo(() => {
    return Math.round((litSegments.length / segments.length) * 100);
  }, [litSegments, segments]);

  // Fetch wheel data from database
  const fetchWheelData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get or create the wheel
      let query = supabase
        .from('competence_wheels')
        .select('id, created_at, updated_at')
        .eq('user_id', userId)
        .eq('wheel_type', wheelType);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data: wheelData, error: wheelError } = await query.maybeSingle();

      if (wheelError) throw wheelError;

      if (!wheelData) {
        // No wheel exists yet - initialize empty state
        const emptyData = {};
        segments.forEach(s => {
          emptyData[s.id] = {
            isLit: false,
            responseCount: 0,
            confidence: 0,
            ring: null,
            problemType: null,
            energySource: null,
            engagementDepth: null,
          };
        });
        setSegmentData(emptyData);
        setWheelId(null);
        setLoading(false);
        return;
      }

      setWheelId(wheelData.id);
      setLastUpdated(wheelData.updated_at);

      // Fetch segment data
      const { data: segmentsData, error: segmentsError } = await supabase
        .from('wheel_segments')
        .select('*')
        .eq('wheel_id', wheelData.id);

      if (segmentsError) throw segmentsError;

      // Build segment data map
      const dataMap = {};
      segments.forEach(s => {
        const dbSegment = segmentsData?.find(d => d.segment_id === s.id);
        dataMap[s.id] = {
          isLit: dbSegment?.is_lit || false,
          responseCount: dbSegment?.response_count || 0,
          confidence: dbSegment?.confidence || 0,
          ring: dbSegment?.ring || null,
          problemType: dbSegment?.problem_type || null,
          energySource: dbSegment?.energy_source || null,
          engagementDepth: dbSegment?.engagement_depth || null,
        };
      });

      setSegmentData(dataMap);

    } catch (err) {
      console.error('Error fetching wheel data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, projectId, wheelType, segments]);

  // Initial fetch
  useEffect(() => {
    fetchWheelData();
  }, [fetchWheelData]);

  // Light up a segment
  const lightSegment = useCallback(async (segmentId, options = {}) => {
    if (!userId) return { error: 'No user ID' };

    const { ring, problemType, energySource, engagementDepth, confidence = 0.8 } = options;

    try {
      // Create wheel if it doesn't exist
      let currentWheelId = wheelId;

      if (!currentWheelId) {
        const { data: newWheel, error: createError } = await supabase
          .from('competence_wheels')
          .insert({
            user_id: userId,
            project_id: projectId,
            wheel_type: wheelType,
          })
          .select()
          .single();

        if (createError) throw createError;
        currentWheelId = newWheel.id;
        setWheelId(currentWheelId);
      }

      // Upsert the segment
      const { error: segmentError } = await supabase
        .from('wheel_segments')
        .upsert({
          wheel_id: currentWheelId,
          segment_id: segmentId,
          is_lit: true,
          ring,
          problem_type: problemType,
          energy_source: energySource,
          engagement_depth: engagementDepth,
          confidence,
          response_count: (segmentData[segmentId]?.responseCount || 0) + 1,
        }, {
          onConflict: 'wheel_id,segment_id',
        });

      if (segmentError) throw segmentError;

      // Update local state
      setSegmentData(prev => ({
        ...prev,
        [segmentId]: {
          ...prev[segmentId],
          isLit: true,
          ring: ring || prev[segmentId]?.ring,
          problemType: problemType || prev[segmentId]?.problemType,
          energySource: energySource || prev[segmentId]?.energySource,
          engagementDepth: engagementDepth || prev[segmentId]?.engagementDepth,
          confidence: Math.max(confidence, prev[segmentId]?.confidence || 0),
          responseCount: (prev[segmentId]?.responseCount || 0) + 1,
        },
      }));

      return { success: true };

    } catch (err) {
      console.error('Error lighting segment:', err);
      return { error: err.message };
    }
  }, [userId, projectId, wheelType, wheelId, segmentData]);

  // Classify a response using the edge function
  const classifyResponse = useCallback(async (response, context = null) => {
    try {
      const { data, error } = await supabase.functions.invoke('classify-response', {
        body: {
          response,
          wheelType,
          context,
        },
      });

      if (error) throw error;
      return data;

    } catch (err) {
      console.error('Error classifying response:', err);
      return { error: err.message, segments: [] };
    }
  }, [wheelType]);

  // Classify and light segments for a response
  const processResponse = useCallback(async (response, context = null) => {
    const classification = await classifyResponse(response, context);

    if (classification.error || !classification.segments?.length) {
      return classification;
    }

    // Light each matched segment
    for (const match of classification.segments) {
      await lightSegment(match.id, {
        confidence: match.confidence,
        ring: classification.ring,
        problemType: classification.problemType,
      });
    }

    return classification;
  }, [classifyResponse, lightSegment]);

  // Get responses linked to a segment
  const getSegmentResponses = useCallback(async (segmentId) => {
    if (!wheelId) return [];

    try {
      // First get the segment ID from wheel_segments
      const { data: segment } = await supabase
        .from('wheel_segments')
        .select('id')
        .eq('wheel_id', wheelId)
        .eq('segment_id', segmentId)
        .single();

      if (!segment) return [];

      // Then get linked responses
      const { data: links } = await supabase
        .from('segment_responses')
        .select(`
          confidence,
          response_id,
          nikigai_responses (
            id,
            response_text,
            created_at
          )
        `)
        .eq('segment_id', segment.id);

      return links?.map(l => ({
        ...l.nikigai_responses,
        confidence: l.confidence,
      })) || [];

    } catch (err) {
      console.error('Error fetching segment responses:', err);
      return [];
    }
  }, [wheelId]);

  // Create a snapshot of current wheel state
  const createSnapshot = useCallback(async () => {
    if (!wheelId) return { error: 'No wheel to snapshot' };

    try {
      const { error } = await supabase
        .from('wheel_snapshots')
        .insert({
          wheel_id: wheelId,
          snapshot: segmentData,
        });

      if (error) throw error;
      return { success: true };

    } catch (err) {
      console.error('Error creating snapshot:', err);
      return { error: err.message };
    }
  }, [wheelId, segmentData]);

  return {
    // Data
    segments,
    segmentData,
    litSegments,
    progress,
    wheelId,
    lastUpdated,

    // State
    loading,
    error,

    // Actions
    fetchWheelData,
    lightSegment,
    classifyResponse,
    processResponse,
    getSegmentResponses,
    createSnapshot,
  };
}

/**
 * useAllWheels - Hook for fetching all three wheels at once
 */
export function useAllWheels(userId, projectId = null) {
  const skills = useWheelData('skills', userId, projectId);
  const problems = useWheelData('problems', userId, projectId);
  const persona = useWheelData('persona', userId, projectId);

  const loading = skills.loading || problems.loading || persona.loading;
  const error = skills.error || problems.error || persona.error;

  // Calculate combined identity
  const combinedIdentity = useMemo(() => {
    if (loading) return null;
    return getCombinedIdentity(
      skills.litSegments,
      problems.litSegments,
      persona.litSegments
    );
  }, [loading, skills.litSegments, problems.litSegments, persona.litSegments]);

  // Overall progress
  const overallProgress = useMemo(() => {
    if (loading) return 0;
    const total = skills.segments.length + problems.segments.length + persona.segments.length;
    const lit = skills.litSegments.length + problems.litSegments.length + persona.litSegments.length;
    return Math.round((lit / total) * 100);
  }, [loading, skills, problems, persona]);

  return {
    skills,
    problems,
    persona,
    loading,
    error,
    combinedIdentity,
    overallProgress,
  };
}

export default useWheelData;
