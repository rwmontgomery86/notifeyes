/**
 * Shift "boost" constants + types, safe to import from anywhere (client or
 * server). The boost feature lets practices pay extra to surface a shift to
 * ODs whose watch zones don't include the practice but are within the radius.
 */

/** 25 miles ≈ 40,233 meters. Fixed for V1; configurable later if needed. */
export const BUMP_RADIUS_METERS = 40_233;
