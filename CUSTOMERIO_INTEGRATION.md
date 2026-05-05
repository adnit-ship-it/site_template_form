# Customer.io Integration Summary

## ✅ Installation Complete

### Package Installed
- `@customerio/cdp-analytics-browser` - Customer.io CDP Analytics Browser SDK

### Files Created

1. **`plugins/customerio.client.ts`**
   - Initializes Customer.io SDK with Write Key
   - Exposes analytics instance globally via `$cioanalytics`

2. **`composables/useCustomerio.ts`**
   - Provides convenient methods for tracking events
   - Handles user identification with attributes
   - Methods: `identify()`, `track()`, and event-specific helpers

### Tracking Implemented

#### Events & Locations:

1. **`completed_quiz`** - Quiz Completion
   - **File:** `composables/usePatientForm.ts` (line 308-323)
   - **Trigger:** When user completes the last step of consultation
   - **Data:** Identifies user as `lead: true` with all form attributes

2. **`selected_product`** - Product Selection  
   - **File:** `components/checkout/VariationSelection.vue` (line 483-485)
   - **Trigger:** When user selects a product variation
   - **Property:** `product_type` (product name/ID)

3. **`selected_bundle`** - Frequency/Bundle Selection
   - **File:** `components/checkout/FrequencySelector.vue` (line 238-247)
   - **Trigger:** When user selects a frequency plan (monthly/3-month/6-month/yearly)
   - **Properties:** `frequency`, `amount`

4. **`selected_bnpl`** - BNPL Payment Method Selected
   - **File:** `components/checkout/PaymentStep.vue` (line 522-526)
   - **Trigger:** When user switches to Buy Now, Pay Later

5. **`selected_cc_payment`** - Card Payment Method Selected
   - **File:** `components/checkout/PaymentStep.vue` (line 527-529)
   - **Trigger:** When user switches to Credit Card payment

6. **`initiated_checkout`** - Checkout Initiated
   - **File:** `utils/submitPatientForm.ts` (line 60-63)
   - **Trigger:** On submit button click (form submission start)
   - **Properties:** `email`, `amount`

7. **`completed_purchase`** - Purchase Completed Successfully
   - **File:** `utils/submitPatientForm.ts` (line 413-419)
   - **Trigger:** After successful payment/case creation
   - **Data:** Updates user to `customer: true`, adds `case_id`
   - **Properties:** `email`, `order_id`, `amount`, `case_id`

8. **`failed_purchase`** - Purchase Failed
   - **File:** `utils/submitPatientForm.ts` (line 593-601)
   - **Trigger:** When payment/submission fails
   - **Properties:** `email`, `amount`, `error` message

### User Attributes Tracked

When quiz is completed (`lead`):
- `email`
- `first_name`
- `last_name`
- `phone`
- `sms_consent`
- `weight`
- `dob_month`, `dob_day`, `dob_year`
- `pregnancy_status`
- `feet`, `inches`
- `gender`

When purchase completes (`customer`):
- `customer: true` (attribute)
- `case_id`

### Configuration

- **Write Key:** Configured via environment variable (see setup below)
- **Data Center:** US (default)
- **In-App Messaging:** Disabled (tracking only)
- **Page View Tracking:** Disabled (events only)

## 🔧 Setup Instructions

### 1. Get Your Customer.io Write Key

The key `63b07ab6435d5bd9953f` is a **Tracking API key**, not a CDP Write Key. You need to get the correct Write Key:

1. Log into Customer.io Dashboard
2. Go to: **Data & Integrations** → **Integrations**
3. Click on the **Connections** tab
4. Find and click on **JavaScript** integration
5. Copy the **Write Key** (this is different from the Tracking API key)

### 2. Set Environment Variable

Add to your `.env` file (or `.env.local`):

```bash
# Customer.io Write Key for JavaScript SDK
NUXT_PUBLIC_CUSTOMERIO_WRITE_KEY=your_actual_write_key_here

# Site ID (optional - defaults to 4e50592c1ffefcb22e4a)
NUXT_PUBLIC_CUSTOMERIO_SITE_ID=4e50592c1ffefcb22e4a
```

### 3. Restart Dev Server

After adding the environment variable:
```bash
npm run dev
```

**Note:** If you don't have a CDP/JavaScript integration set up in Customer.io yet, you may need to:
1. Create a new JavaScript Source in Customer.io
2. This will generate a Write Key specifically for the JavaScript SDK
3. Use that Write Key in your environment variables

## 🧪 Testing

To test the integration:

1. Start the dev server: `npm run dev`
2. Complete the full funnel flow:
   - Fill out the quiz → triggers `completed_quiz` (user identified as `lead`)
   - Select a product → triggers `selected_product`
   - Choose a frequency → triggers `selected_bundle`
   - Toggle payment methods → triggers `selected_bnpl` or `selected_cc_payment`
   - Submit payment → triggers `initiated_checkout`
   - Success → triggers `completed_purchase` (user updated to `customer`)
   - OR failure → triggers `failed_purchase`

3. Check browser console for Customer.io logs
4. Verify events in Customer.io dashboard

## 📊 Parallel Tracking

Customer.io tracking runs **alongside** ActiveCampaign tracking. Both systems receive the same events at the same time. ActiveCampaign can be removed later without affecting Customer.io.

## 🔧 Maintenance

All Customer.io tracking logic is centralized in `composables/useCustomerio.ts`. To add new events or modify existing ones, update this file and the corresponding component/utility file.
