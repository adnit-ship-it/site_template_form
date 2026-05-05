// composables/useEverflow.ts

// Global tracking to prevent duplicate events
const eventTracking = {
  beginQuiz: false,
  completeQuiz: false,
  caseCreated: false,
};

export const useEverflow = () => {
  const nuxtApp = useNuxtApp();
  const { $efTrack, $efConversion } = nuxtApp;

  return {
    // Event ID 2: BEGIN QUIZ - Fires when user starts the questionnaire
    beginQuiz: async () => {
      if (eventTracking.beginQuiz) {
        console.log('⚠️ BEGIN QUIZ already fired, skipping duplicate');
        return Promise.resolve();
      }
      console.log('📋 Triggering: BEGIN QUIZ (event_id: 66)');
      eventTracking.beginQuiz = true;
      return $efTrack(66);
    },

    // Event ID 3: COMPLETE QUIZ - Fires when user completes all questions
    completeQuiz: async (extra?: Record<string, any>) => {
      if (eventTracking.completeQuiz) {
        console.log('⚠️ COMPLETE QUIZ already fired, skipping duplicate');
        return Promise.resolve();
      }
      console.log('✅ Triggering: COMPLETE QUIZ (event_id: 67)');
      eventTracking.completeQuiz = true;
      return $efTrack(67, extra);
    },

    // Event ID 4: PRODUCT SELECTED - Fires when user selects a product
    productSelected: async (extra?: Record<string, any>) => {
      console.log('🛍️ Triggering: PRODUCT SELECTED (event_id: 65)', extra);
      return $efTrack(65, extra);
    },

    // Base Conversion: CASE CREATED - Fires when patient case is successfully created
    conversion: async (extra?: Record<string, any>) => {
      if (eventTracking.caseCreated) {
        console.log('⚠️ CASE CREATED already fired, skipping duplicate');
        return Promise.resolve();
      }
      console.log('🎉 Triggering: CASE CREATED (base conversion)', extra);
      eventTracking.caseCreated = true;
      return $efConversion(extra);
    },

    // Alias for clarity
    caseCreated: async (extra?: Record<string, any>) => {
      if (eventTracking.caseCreated) {
        console.log('⚠️ CASE CREATED already fired, skipping duplicate');
        return Promise.resolve();
      }
      console.log('🎉 Triggering: CASE CREATED (base conversion)', extra);
      eventTracking.caseCreated = true;
      return $efConversion(extra);
    },

    // Reset tracking (useful for testing or new sessions)
    resetTracking: () => {
      eventTracking.beginQuiz = false;
      eventTracking.completeQuiz = false;
      eventTracking.caseCreated = false;
    },
  };
};