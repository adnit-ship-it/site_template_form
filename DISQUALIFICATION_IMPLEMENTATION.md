# Disqualification Review Flow Implementation

## Overview
Implemented a comprehensive disqualification review flow for the weight-loss quiz to handle GLP-1 medication contraindications. This allows users to review and correct any accidentally selected disqualifying conditions before being permanently disqualified.

## Implementation Details

### 1. Components Created

#### `components/form/DisqualifiedScreen.vue`
- **Purpose**: Final screen shown when user is permanently disqualified
- **Features**:
  - Clear messaging about why they cannot proceed
  - Explanation of safety concerns
  - Link back to homepage
  - Clean, professional UI

#### `components/form/DisqualificationReviewScreen.vue`
- **Purpose**: Allows users to review and modify disqualifying answers
- **Features**:
  - Displays all questions with disqualifying answers
  - Highlights specific concerning selections
  - Allows inline editing of answers
  - Two action buttons: "Back to Quiz" and "Continue"
  - Re-checks answers on continue

### 2. Composable Updates (`composables/usePatientForm.ts`)

#### New State Variables
- `isDisqualified`: Boolean flag for final disqualification
- `showReviewScreen`: Boolean flag to show review screen
- `disqualifyingFields`: Array of fields with disqualifying selections
- `skipDisqualificationCheck`: Internal flag to prevent infinite loops

#### Disqualification Configuration
```typescript
const DISQUALIFICATION_CONFIG: Record<string, Record<string, string[]>> = {
  'weight-loss': {
    pregnancyStatus: [
      "Currently or possibly pregnant",
      "Breastfeeding or bottle-feeding with breastmilk",
    ],
    medicalConditions2: [
      "Cirrhosis or end-stage liver disease",
      "Chronic Kidney Disease Stage 3 or greater",
      "History of or current pancreatitis",
      "Cancer (active diagnosis, active treatment, or in remission or cancer-free for less than 5 continuous years - does not apply to non-melanoma skin cancer that was considered cured via simple excision)"
    ]
  }
}
```

#### New Functions
1. **`checkForDisqualifyingConditions()`**
   - Scans form answers for disqualifying conditions
   - Returns array of disqualifying fields with selections
   - Handles both MULTISELECT and SINGLESELECT answers

2. **`triggerDisqualificationReview()`**
   - Manually trigger the review flow
   - Checks for disqualifications and shows review screen

3. **`confirmReviewedAnswers()`**
   - Re-checks answers after user reviews them
   - Either shows final disqualification screen OR proceeds with submission
   - Prevents infinite loops with skipDisqualificationCheck flag

4. **`backFromReview()`**
   - Returns user to normal quiz flow from review screen
   - Allows them to modify their answers

5. **`resetDisqualificationState()`**
   - Resets all disqualification state
   - Useful for testing or form restart

#### Modified Functions
- **`nextStep()`**: Now checks for disqualifying conditions before final submission

### 3. Page Updates (`pages/consultation.vue`)

#### Template Changes
- Added conditional rendering for three states:
  1. `isDisqualified === true` → Show `DisqualifiedScreen`
  2. `showReviewScreen === true` → Show `DisqualificationReviewScreen`
  3. Default → Show normal form flow

#### Script Changes
- Imported disqualification state and functions from composable
- Connected review screen event handlers to composable functions

## User Flow

### Happy Path (No Disqualification)
1. User completes all quiz questions
2. Clicks "Finish" on last question
3. `nextStep()` checks for disqualifying conditions
4. No disqualifications found → Proceeds to checkout

### Disqualification with Correction
1. User completes quiz with disqualifying answer(s)
2. Clicks "Finish" on last question
3. `nextStep()` detects disqualifying conditions
4. Shows `DisqualificationReviewScreen` with problematic questions
5. User corrects their answers (removes disqualifying selections)
6. Clicks "Continue"
7. `confirmReviewedAnswers()` re-checks
8. No disqualifications found → Proceeds to checkout

### Permanent Disqualification
1. User completes quiz with disqualifying answer(s)
2. Clicks "Finish" on last question
3. `nextStep()` detects disqualifying conditions
4. Shows `DisqualificationReviewScreen` with problematic questions
5. User reviews but keeps disqualifying answers
6. Clicks "Continue"
7. `confirmReviewedAnswers()` re-checks
8. Still has disqualifications → Shows `DisqualifiedScreen`
9. User cannot proceed with this quiz

## Disqualifying Conditions for Weight-Loss Quiz

Based on GLP-1 medication contraindications:

### Pregnancy-Related (pregnancyStatus)
- Currently or possibly pregnant
- Breastfeeding or bottle-feeding with breastmilk

**Note**: "Have given birth to a child within the last 6 months" is NOT included as a disqualifying condition (this is a clinical decision - it's a caution but not absolute contraindication).

### Diabetes-Related (medicalConditions1)
- Type 1 diabetes
- Type 2 Diabetes (on insulin or sulfonylureas)

### Medical Conditions (medicalConditions2)
- Gallbladder disease
- Cirrhosis or end-stage liver disease
- End-stage kidney disease (on or about to be on dialysis)
- History of or current pancreatitis
- Current suicidal thoughts or prior suicide attempt
- Diabetic retinopathy (diabetic eye disease), damage to the optic nerve from trauma or reduced blood flow, or blindness
- On blood thinners/warfarin
- Cancer (active diagnosis, active treatment, or in remission or cancer-free for less than 5 continuous years - does not apply to non-melanoma skin cancer that was considered cured via simple excision)

## Extensibility

### Adding Disqualifications to Other Quizzes
To add disqualification logic to other quizzes (e.g., hormones, hair-loss):

1. Add configuration to `DISQUALIFICATION_CONFIG` in `usePatientForm.ts`:
```typescript
const DISQUALIFICATION_CONFIG: Record<string, Record<string, string[]>> = {
  'weight-loss': { /* existing config */ },
  'hormones': {
    fieldName: ["Disqualifying Option 1", "Disqualifying Option 2"]
  }
}
```

2. The system automatically applies the logic to any quiz with a configuration

### Modifying Disqualifying Conditions
Simply update the arrays in `DISQUALIFICATION_CONFIG` in `usePatientForm.ts`.

## Testing Checklist

- [ ] Complete quiz without disqualifying conditions → Should proceed to checkout
- [ ] Select disqualifying pregnancy condition → Should show review screen
- [ ] Select disqualifying medical condition → Should show review screen
- [ ] Review and remove disqualifying answer → Should proceed to checkout
- [ ] Review and keep disqualifying answer → Should show disqualified screen
- [ ] Click "Back to Quiz" from review screen → Should return to quiz
- [ ] Test with male user (pregnancy question hidden) → Should work correctly
- [ ] Test with female user → Should check pregnancy conditions
- [ ] Test multiple disqualifying conditions at once → Should show all in review screen

## Files Modified

### New Files
- `components/form/DisqualifiedScreen.vue`
- `components/form/DisqualificationReviewScreen.vue`
- `DISQUALIFICATION_IMPLEMENTATION.md` (this file)

### Modified Files
- `composables/usePatientForm.ts` (~150 lines added)
- `pages/consultation.vue` (~30 lines modified)
- `data/formSteps.ts` (added new questions for mental health, substance use, and blood thinners)

## Notes

1. **Why "Have given birth to a child within the last 6 months" is not disqualifying**: While this is collected for safety monitoring, it's not an absolute contraindication for GLP-1 medications. The clinical team can review this case-by-case.

2. **Questions Consolidated**: All critical safety screening questions were consolidated into existing questions:
   - Blood thinner/warfarin use was added to the medical conditions question (medicalConditions2)
   - Suicidal thoughts/prior suicide attempt was added to the medical conditions question (medicalConditions2)

3. **Future Enhancement**: Consider adding more specific thyroid cancer questions (medullary thyroid carcinoma, MEN2 syndrome) as these are major contraindications for GLP-1s but aren't specifically asked in the current form.

4. **Analytics**: Consider adding tracking for:
   - How many users hit the review screen
   - How many successfully correct their answers
   - How many are permanently disqualified
   - Which conditions are most commonly selected

## Documentation Reference

The implementation follows the specifications provided in the disqualification review flow documentation, which includes:
- User flow diagrams
- Component requirements
- State management approach
- Error handling guidelines
