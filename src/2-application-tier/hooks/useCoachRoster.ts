import { useCallback, useState } from 'react';
import {
  getAthleteDocumentsForCoach,
  getCoachAthletes,
  getCommitteeReviewQueue,
  type AthleteWithDocuments,
} from '../../3-data-tier/services/rosterService';
import type { Document, Profile } from '../../3-data-tier/types/database.types';

export function useCoachRoster(coachId: string | undefined) {
  const [athletes, setAthletes] = useState<Profile[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAthletes = useCallback(async () => {
    if (!coachId) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await getCoachAthletes(coachId);
      setAthletes(list);
      if (list.length && !selectedAthleteId) setSelectedAthleteId(list[0].id);
    } catch {
      setError('Failed to load assigned athletes.');
    } finally {
      setIsLoading(false);
    }
  }, [coachId]);

  const loadDocuments = useCallback(async (athleteId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const docs = await getAthleteDocumentsForCoach(athleteId);
      setDocuments(docs);
    } catch {
      setError('Failed to load athlete documents.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectAthlete = useCallback(
    async (athleteId: string) => {
      setSelectedAthleteId(athleteId);
      await loadDocuments(athleteId);
    },
    [loadDocuments],
  );

  return {
    athletes,
    selectedAthleteId,
    documents,
    isLoading,
    error,
    loadAthletes,
    loadDocuments,
    selectAthlete,
    clearError: () => setError(null),
  };
}

export function useCommitteeQueue() {
  const [queue, setQueue] = useState<AthleteWithDocuments[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setQueue(await getCommitteeReviewQueue());
    } catch {
      setError('Failed to load eligibility queue.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { queue, isLoading, error, loadQueue, clearError: () => setError(null) };
}
