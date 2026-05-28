// utils/createAbandonedLead.ts
//
// Fires a single "abandoned lead" case to CareValidate when a user finishes
// the quiz and is being routed to checkout, but has not yet completed payment.
//
// The backend creates a Lead case with status=ABANDONED. When the user later
// completes checkout, submitPatientForm submits the full case (status=OPEN)
// and the backend converts the Lead case.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AbandonedLeadParams = {
  email: string;
  firstName?: string;
  lastName?: string;
  weight?: string;
  formTitle?: string;
  formDescription?: string;
  productBundleId?: string;
};

type AbandonedLeadResult = {
  caseId?: string;
  formResponseId?: string;
} | null;

/**
 * Creates an abandoned lead in CareValidate.
 *
 * Safe to call fire-and-forget — errors are swallowed and logged as warnings
 * so the quiz/checkout flow is never blocked by a non-critical tracking call.
 *
 * Returns the caseId on success, or null on failure / duplicate.
 */
export async function createAbandonedLead(
  params: AbandonedLeadParams
): Promise<AbandonedLeadResult> {
  const email = String(params.email ?? "").trim().toLowerCase();

  if (!EMAIL_RE.test(email)) {
    return null;
  }

  try {
    const response = await $fetch<{ success: boolean; data: any }>(
      "/api/create-abandoned-lead",
      {
        method: "POST",
        body: {
          email,
          firstName: params.firstName || "",
          lastName: params.lastName || "",
          weight: params.weight || "",
          formTitle: params.formTitle,
          formDescription: params.formDescription,
          productBundleId: params.productBundleId,
        },
      }
    );

    const caseId: string | undefined = response?.data?.data?.caseId;
    const formResponseId: string | undefined = response?.data?.data?.formResponseId;

    if (caseId && process.client) {
      try {
        localStorage.setItem("abandoned_lead_case_id", caseId);
      } catch {
        // localStorage may be unavailable — non-critical
      }
    }

    return { caseId, formResponseId };
  } catch (error: any) {
    console.warn("[createAbandonedLead] non-critical error:", error?.message ?? error);
    return null;
  }
}
