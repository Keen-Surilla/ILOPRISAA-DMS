import { supabase } from '../config/SupabaseClient';
import { transitionDocumentStatus } from '../services/documentStateMachine';

export interface PendingDocumentRow {
  id: string;
  athlete_id: string;
  document_type: string;
  status: string;
  original_filename: string;
  storage_path: string;
  created_at: string;

  athlete_name: string;

  coach_id: string | null;
  coach_name: string;
  institution_id: string | null;

  division: string | null;
  sport: string | null;
  gender: string | null;
}

export async function getPendingDocuments(): Promise<PendingDocumentRow[]> {
  // --------------------------------------------------
  // 1. Get documents waiting for committee review
  // --------------------------------------------------
  const { data: documents, error: docsError } = await supabase
    .from('documents')
    .select(
      'id, athlete_id, document_type, status, original_filename, storage_path, created_at'
    )
    .eq('status', 'pending_review')
    .order('created_at', { ascending: true });

  if (docsError) {
    console.error('Error fetching pending documents:', docsError);

    throw new Error(
      'Could not load pending documents. Please try again.'
    );
  }

  if (!documents || documents.length === 0) {
    return [];
  }

  // --------------------------------------------------
  // 2. Get the athletes connected to those documents
  // --------------------------------------------------
  const athleteIds = [
    ...new Set(
      documents
        .map((document) => document.athlete_id)
        .filter(Boolean)
    ),
  ];

  if (athleteIds.length === 0) {
    return [];
  }

  const { data: athletes, error: athletesError } = await supabase
    .from('team_members')
    .select(
      'id, name, coach_id, user_id, division, sport, gender'
    )
    .in('id', athleteIds);

  if (athletesError) {
    console.error('Error fetching athletes:', athletesError);

    throw new Error(
      'Could not load athlete info. Please try again.'
    );
  }

  // --------------------------------------------------
  // 3. Get athlete profile information
  //
  // Some manually-created athletes may have no user_id.
  // Therefore, only query profiles when IDs actually exist.
  // --------------------------------------------------
  const athleteUserIds = [
    ...new Set(
      (athletes ?? [])
        .map((athlete) => athlete.user_id)
        .filter(
          (id): id is string => Boolean(id)
        )
    ),
  ];

  let athleteProfiles: Array<{
    id: string;
    sport: string | null;
    gender: string | null;
  }> = [];

  if (athleteUserIds.length > 0) {
    const {
      data,
      error: athleteProfilesError,
    } = await supabase
      .from('profiles')
      .select('id, sport, gender')
      .in('id', athleteUserIds);

    if (athleteProfilesError) {
      console.error(
        'Error fetching athlete profiles:',
        athleteProfilesError
      );

      throw new Error(
        'Could not load athlete profile info. Please try again.'
      );
    }

    athleteProfiles = data ?? [];
  }

  // --------------------------------------------------
  // 4. Get coach information
  //
  // Some athlete records may have no coach_id, so only
  // query profiles when coach IDs actually exist.
  // --------------------------------------------------
  const coachIds = [
    ...new Set(
      (athletes ?? [])
        .map((athlete) => athlete.coach_id)
        .filter(
          (id): id is string => Boolean(id)
        )
    ),
  ];

  let coaches: Array<{
    id: string;
    full_name: string | null;
    institution_id: string | null;
  }> = [];

  if (coachIds.length > 0) {
    const {
      data,
      error: coachesError,
    } = await supabase
      .from('profiles')
      .select('id, full_name, institution_id')
      .in('id', coachIds);

    if (coachesError) {
      console.error(
        'Error fetching coaches:',
        coachesError
      );

      throw new Error(
        'Could not load coach info. Please try again.'
      );
    }

    coaches = data ?? [];
  }

  // --------------------------------------------------
  // 5. Build lookup maps
  // --------------------------------------------------
  const athleteMap = new Map(
    (athletes ?? []).map((athlete) => [
      athlete.id,
      athlete,
    ])
  );

  const athleteProfileMap = new Map(
    athleteProfiles.map((profile) => [
      profile.id,
      profile,
    ])
  );

  const coachMap = new Map(
    coaches.map((coach) => [
      coach.id,
      coach,
    ])
  );

  // --------------------------------------------------
  // 6. Combine everything into Review Queue rows
  // --------------------------------------------------
  return documents.map((doc) => {
    const athlete = athleteMap.get(doc.athlete_id);

    const coach =
      athlete?.coach_id
        ? coachMap.get(athlete.coach_id)
        : undefined;

    const athleteProfile =
      athlete?.user_id
        ? athleteProfileMap.get(athlete.user_id)
        : undefined;

    return {
      id: doc.id,
      athlete_id: doc.athlete_id,
      document_type: doc.document_type,
      status: doc.status,
      original_filename: doc.original_filename,
      storage_path: doc.storage_path,
      created_at: doc.created_at,

      athlete_name:
        athlete?.name ?? 'Unknown',

      coach_id:
        athlete?.coach_id ?? null,

      coach_name:
        coach?.full_name ?? 'Unknown',

      institution_id:
        coach?.institution_id ?? null,

      division:
        athlete?.division ?? null,

      // Prefer the new team_members values.
      // Fall back to profiles for older athlete records.
      sport:
        athlete?.sport ??
        athleteProfile?.sport ??
        null,

      gender:
        athlete?.gender ??
        athleteProfile?.gender ??
        null,
    };
  });
}

// --------------------------------------------------
// VERIFY DOCUMENT
// --------------------------------------------------
export async function verifyDocument(
  documentId: string,
  reviewerId: string
): Promise<void> {
  try {
    await transitionDocumentStatus(supabase, {
      documentId,
      from: 'pending_review',
      to: 'verified',
      reviewerId,
    });
  } catch (error) {
    console.error(
      'Error verifying document:',
      error
    );

    throw new Error(
      'Could not verify this document. Please try again.'
    );
  }
}

// --------------------------------------------------
// REJECT DOCUMENT
// --------------------------------------------------
export async function rejectDocument(
  documentId: string,
  reviewerId: string,
  notes: string
): Promise<void> {
  try {
    await transitionDocumentStatus(supabase, {
      documentId,
      from: 'pending_review',
      to: 'action_required',
      rejectionReason: notes,
      reviewerId,
    });
  } catch (error) {
    console.error(
      'Error rejecting document:',
      error
    );

    throw new Error(
      'Could not reject this document. Please try again.'
    );
  }
}

// --------------------------------------------------
// GET SIGNED DOCUMENT URL
// --------------------------------------------------
export async function getSignedUrl(
  storagePath: string
): Promise<string> {
  const {
    data,
    error,
  } = await supabase
    .storage
    .from('athlete-documents')
    .createSignedUrl(
      storagePath,
      60 * 5
    );

  if (error || !data) {
    throw new Error(
      'Could not generate a link to view this file.'
    );
  }

  return data.signedUrl;
}