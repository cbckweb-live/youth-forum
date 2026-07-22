import { NextRequest, NextResponse } from "next/server";
import {
  jsonResponse,
  errorResponse,
  requireAdmin,
  getServiceSupabase,
} from "@/lib/admin-api-utils";
import { getRateLimiter, getClientIp } from "@/lib/rate-limiter";

/**
 * Configuration for a generic admin CRUD route.
 */
export interface GenericCrudRouteConfig {
  /** Supabase table name (e.g. "living_room_seasons"). */
  table: string;
  /** Action name for creating a record. */
  actionCreate: string;
  /** Action name for updating a record. */
  actionUpdate: string;
  /** Action name for deleting a record. */
  actionDelete: string;
  /**
   * Optional — transform the payload on create/update before inserting.
   * Useful for stripping out control fields and mapping form keys to column names.
   */
  sanitizePayload?: (payload: Record<string, unknown>) => Record<string, unknown>;
  /**
   * Optional — custom validation for create/update payloads.
   * Return a string error message or null if valid.
   */
  validate?: (payload: Record<string, unknown>, action: string) => string | null;
  /**
   * Optional — custom actions beyond create/update/delete.
   * Each action receives the parsed payload and service Supabase client.
   */
  customActions?: Record<
    string,
    (payload: Record<string, unknown>, serviceSupabase: ReturnType<typeof getServiceSupabase>) => Promise<NextResponse>
  >;
  /**
   * Optional — hook called after a successful update.
   * Useful for cleaning up old storage objects (e.g. replaced images).
   */
  afterUpdate?: (
    serviceSupabase: ReturnType<typeof getServiceSupabase>,
    payload: Record<string, unknown>,
  ) => Promise<void>;
  /**
   * Optional — hook called after a successful delete.
   * Useful for cleaning up associated storage objects.
   */
  afterDelete?: (
    serviceSupabase: ReturnType<typeof getServiceSupabase>,
    payload: Record<string, unknown>,
  ) => Promise<void>;
}

/**
 * Returns a POST handler for admin CRUD operations.
 *
 * Usage in an API route:
 * ```ts
 * import { createGenericRoute } from "@/lib/crud/generic-api-handler";
 * export const POST = createGenericRoute({ table: "living_room_seasons", ... });
 * ```
 */
export function createGenericRoute(config: GenericCrudRouteConfig) {
  return async function POST(request: NextRequest) {
    const response = NextResponse.next();
    const auth = await requireAdmin(request, response);
    if ("error" in auth) return auth.error;

    let serviceSupabase: ReturnType<typeof getServiceSupabase>;
    try {
      serviceSupabase = getServiceSupabase();
    } catch {
      return errorResponse("Supabase service role key is not configured.", 500);
    }

    // ── Rate limit ──
    const limiter = getRateLimiter();
    const ip = getClientIp(request);
    const rlResult = limiter.check({
      ip,
      endpoint: `admin:${config.table}`,
      tier: "authenticated",
    });
    if (!rlResult.allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please slow down." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil(rlResult.retryAfter / 1000)),
          },
        },
      );
    }

    const payload = await request.json();
    const { action } = payload as { action?: string };

    // ── Custom actions ──
    if (config.customActions && action && config.customActions[action]) {
      return config.customActions[action](payload, serviceSupabase);
    }

    // ── DELETE ──
    if (action === config.actionDelete) {
      const { id } = payload as { id?: string };
      if (!id) return errorResponse("ID is required.", 400);

      if (config.afterDelete) {
        await config.afterDelete(serviceSupabase, payload);
      }

      const { error } = await serviceSupabase
        .from(config.table)
        .delete()
        .eq("id", id);

      if (error) return errorResponse(error.message, 500);
      return new NextResponse(null, { status: 204 });
    }

    // ── CREATE ──
    if (action === config.actionCreate) {
      // Strip control fields — destructuring creates a clean copy without them
      let { action: _, id: _id, previous_image_url: _prev, ...insertData } = payload;

      if (config.sanitizePayload) {
        insertData = config.sanitizePayload(insertData);
      }

      if (config.validate) {
        const err = config.validate(insertData, action);
        if (err) return errorResponse(err, 400);
      }

      const { data, error } = await serviceSupabase
        .from(config.table)
        .insert(insertData)
        .select();

      if (error) return errorResponse(error.message, 500);

      return jsonResponse({ data, insertedRows: data });
    }

    // ── UPDATE ──
    if (action === config.actionUpdate) {
      const { id } = payload as { id?: string };
      if (!id) return errorResponse("ID is required.", 400);

      // Strip control fields — destructuring creates a clean copy without them
      let { action: _, id: _id, previous_image_url: _prev, ...updateData } = payload;

      if (config.sanitizePayload) {
        updateData = config.sanitizePayload(updateData);
      }

      if (config.validate) {
        const err = config.validate(updateData, action);
        if (err) return errorResponse(err, 400);
      }

      const { error } = await serviceSupabase
        .from(config.table)
        .update(updateData)
        .eq("id", id);

      if (error) return errorResponse(error.message, 500);

      if (config.afterUpdate) {
        await config.afterUpdate(serviceSupabase, payload);
      }

      return new NextResponse(null, { status: 204 });
    }

    return errorResponse("Invalid action.", 400);
  };
}
