-- ============================================================================
-- Product Relationships Migration
-- Version: 1.0
-- Date: 2026-02-01
-- Description: Creates product_relationships table for cross-product linking
--              (upsells, downsells, continuity, lead magnets, funnel flow)
-- ============================================================================

-- Create the product_relationships table
CREATE TABLE IF NOT EXISTS product_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The product that HAS the relationship (e.g., the core product)
  from_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- The product it relates TO (e.g., the upsell)
  to_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Relationship type
  relationship_type TEXT NOT NULL,

  -- Where was this relationship created?
  source_flow TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent exact duplicate relationships
  UNIQUE(from_product_id, to_product_id, relationship_type)
);

-- Constraint: prevent self-referencing relationships
ALTER TABLE product_relationships ADD CONSTRAINT no_self_reference
CHECK (from_product_id != to_product_id);

-- Constraint: valid relationship types
ALTER TABLE product_relationships ADD CONSTRAINT valid_relationship_type
CHECK (relationship_type IN (
  'upsell',       -- from is core, to is upsell product
  'downsell',     -- from is core, to is downsell product
  'continuity',   -- from is core, to is continuity/subscription product
  'lead_magnet',  -- from is lead magnet, to is product it feeds into
  'leads_to'      -- general funnel flow (e.g., workshop leads to app)
));

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_product_relationships_from
  ON product_relationships(from_product_id);

CREATE INDEX IF NOT EXISTS idx_product_relationships_to
  ON product_relationships(to_product_id);

CREATE INDEX IF NOT EXISTS idx_product_relationships_type
  ON product_relationships(relationship_type);

CREATE INDEX IF NOT EXISTS idx_product_relationships_from_type
  ON product_relationships(from_product_id, relationship_type);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE product_relationships ENABLE ROW LEVEL SECURITY;

-- Users can view relationships for their own products
CREATE POLICY "Users can view own product relationships"
ON product_relationships FOR SELECT
USING (
  from_product_id IN (SELECT id FROM products WHERE user_id = auth.uid())
  OR to_product_id IN (SELECT id FROM products WHERE user_id = auth.uid())
);

-- Users can insert relationships only between their own products
CREATE POLICY "Users can insert own product relationships"
ON product_relationships FOR INSERT
WITH CHECK (
  from_product_id IN (SELECT id FROM products WHERE user_id = auth.uid())
  AND to_product_id IN (SELECT id FROM products WHERE user_id = auth.uid())
);

-- Users can update relationships for their own products
CREATE POLICY "Users can update own product relationships"
ON product_relationships FOR UPDATE
USING (
  from_product_id IN (SELECT id FROM products WHERE user_id = auth.uid())
);

-- Users can delete relationships for their own products
CREATE POLICY "Users can delete own product relationships"
ON product_relationships FOR DELETE
USING (
  from_product_id IN (SELECT id FROM products WHERE user_id = auth.uid())
);

-- ============================================================================
-- Trigger: Auto-delete relationships when product is archived
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_relationships_on_archive()
RETURNS TRIGGER AS $$
BEGIN
  -- When a product is archived, remove all its relationships
  IF NEW.status = 'archived' AND (OLD.status IS NULL OR OLD.status != 'archived') THEN
    DELETE FROM product_relationships
    WHERE from_product_id = NEW.id OR to_product_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS trigger_archive_breaks_relationships ON products;

-- Create trigger
CREATE TRIGGER trigger_archive_breaks_relationships
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION delete_relationships_on_archive();

-- ============================================================================
-- Trigger: Auto-update timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_product_relationships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_relationships_updated_at ON product_relationships;

CREATE TRIGGER trigger_update_product_relationships_updated_at
BEFORE UPDATE ON product_relationships
FOR EACH ROW
EXECUTE FUNCTION update_product_relationships_updated_at();

-- ============================================================================
-- Success message
-- ============================================================================

DO $$ BEGIN RAISE NOTICE 'Product relationships table created successfully'; END $$;
