ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS document_category TEXT
  CHECK (document_category IN ('permanent', 'annual'))
  DEFAULT 'annual';