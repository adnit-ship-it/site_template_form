import { resolveEnvMode } from "~/server/utils/envMode";
import type { RuntimeConfigDB } from "~/types/runtime-config";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const { apiKey, apiUrl, useStaging, isEmbed } = resolveEnvMode(event);

  if (!apiKey || !apiUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: "Missing CareValidate configuration",
    });
  }

  if (isEmbed && useStaging) {
    console.info("[submit-form] Embedded request → routing to staging CareValidate org");
  }

  // `useNewAPI` lives in Supabase now (`site_config.use_new_api`). We call
  // our own runtime-config endpoint via `$fetch` — Nitro routes this
  // in-process and hits the same cached value the client plugin gets, so
  // there's no extra Supabase round-trip per submission.
  const runtimeDB = await $fetch<RuntimeConfigDB>("/api/runtime-config");
  const useNewAPI = runtimeDB.siteConfig.useNewAPI;

  const basePath = apiUrl.replace(/\/$/, "");
  const submitUrl = useNewAPI ? `${basePath}/cases` : `${basePath}/dynamic-case`;

  try {
    const response = await $fetch(submitUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "cv-api-key": apiKey,
      },
      body: body,
    });

    return { success: true, data: response };
  } catch (error: any) {
    console.error("CareValidate API Error:", {
      statusCode: error.statusCode,
      statusMessage: error.statusMessage,
      data: error.data,
      message: error.message,
    });

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to create patient case.",
      data: error.data,
    });
  }
});
