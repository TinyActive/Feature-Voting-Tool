import { Env } from "../index";
import {
  getAllFeatures,
  getFeatureById,
  createFeature,
  updateFeature,
  deleteFeature,
} from "../db/queries";
import { corsHeaders } from "../utils/cors";
import { verifyAdminAccess } from "../middleware/auth";
import { sendTelegramNotification } from "../utils/telegram";
import { verifyRecaptcha } from "../utils/recaptcha";

// Helper functions to reduce duplication
function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractFeatureId(request: Request): string | null {
  const url = new URL(request.url);
  return url.pathname.split("/").pop() || null;
}

async function verifyRecaptchaToken(
  token: string,
  env: Env,
  action: string,
): Promise<Response | null> {
  const result = await verifyRecaptcha(token, env, action);
  if (!result.success) {
    return jsonResponse(
      { error: result.error || "Security verification failed" },
      400,
    );
  }
  return null;
}

async function verifyAdmin(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const authResult = await verifyAdminAccess(request, env);
  if (!authResult.authorized) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  return null;
}

export async function handleAdminFeatures(
  request: Request,
  env: Env,
  action: "create" | "update" | "delete",
): Promise<Response> {
  const authError = await verifyAdmin(request, env);
  if (authError) return authError;

  try {
    if (action === "create") {
      const body: any = await request.json();

      const recaptchaError = await verifyRecaptchaToken(
        body.recaptchaToken,
        env,
        "admin_create_feature",
      );
      if (recaptchaError) return recaptchaError;

      if (!body.title?.en || !body.title?.vi) {
        return jsonResponse({ error: "Title (en and vi) required" }, 400);
      }

      const feature = await createFeature(env, {
        title: body.title,
        description: body.description || { en: "", vi: "" },
      });

      await sendTelegramNotification(
        env,
        `✨ New feature added: "${feature.title.en}"`,
      );

      return jsonResponse(feature);
    }

    if (action === "update") {
      const featureId = extractFeatureId(request);
      if (!featureId) {
        return jsonResponse({ error: "Feature ID required" }, 400);
      }

      const body: any = await request.json();

      const recaptchaError = await verifyRecaptchaToken(
        body.recaptchaToken,
        env,
        "admin_update_feature",
      );
      if (recaptchaError) return recaptchaError;

      await updateFeature(env, featureId, body);
      const updated = await getFeatureById(env, featureId);
      return jsonResponse(updated);
    }

    if (action === "delete") {
      const featureId = extractFeatureId(request);
      if (!featureId) {
        return jsonResponse({ error: "Feature ID required" }, 400);
      }

      await deleteFeature(env, featureId);
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Invalid action" }, 400);
  } catch (error: any) {
    console.error("Admin action error:", error);
    return jsonResponse(
      { error: error.message || "Failed to process request" },
      500,
    );
  }
}

export async function handleAdminStats(
  request: Request,
  env: Env,
): Promise<Response> {
  const authError = await verifyAdmin(request, env);
  if (authError) return authError;

  try {
    const features = await getAllFeatures(env);
    const totalFeatures = features.length;
    const totalVotes = features.reduce(
      (sum, f) => sum + f.votesUp + f.votesDown,
      0,
    );
    const topFeature = features.length > 0 ? features[0] : null;

    return jsonResponse({
      totalFeatures,
      totalVotes,
      topFeature,
    });
  } catch (error: any) {
    console.error("Stats error:", error);
    return jsonResponse(
      { error: error.message || "Failed to fetch stats" },
      500,
    );
  }
}

/**
 * Verify admin token (legacy endpoint for backward compatibility)
 * POST /api/admin/verify
 * Headers: Authorization: Bearer <admin_token>
 *
 * Note: This endpoint is deprecated. Use email-based admin authentication instead.
 */
export async function handleAdminVerify(
  request: Request,
  env: Env,
): Promise<Response> {
  const authResult = await verifyAdminAccess(request, env);

  if (!authResult.authorized) {
    return jsonResponse({ error: "Unauthorized - Admin access required" }, 401);
  }

  try {
    return jsonResponse({
      success: true,
      message: "Admin verified",
      user: {
        id: authResult.user!.id,
        email: authResult.user!.email,
        role: authResult.user!.role,
      },
    });
  } catch (error: any) {
    console.error("Admin verify error:", error);
    return jsonResponse(
      { error: error.message || "Failed to verify admin" },
      500,
    );
  }
}
