# Google Analytics 4 (GA4) Implementation Guide

## 📊 Measurement ID
**G-3H9L5298TG**

---

## ✅ What's Been Implemented

### 1. **GA4 Plugin** (`plugins/google-analytics.client.ts`)
- Loads gtag.js automatically
- Tracks page views on all pages
- Provides helper methods for conversion events

### 2. **Conversion Events Tracked**

| Event | When it Fires | Location | Priority |
|-------|--------------|----------|----------|
| **purchase** | Payment successful | `utils/submitPatientForm.ts:557` | 🔴 CRITICAL |
| **generate_lead** | Quiz completed | `pages/consultation.vue:182` | 🔴 CRITICAL |
| **begin_checkout** | User reaches payment step | `pages/checkout.vue:388` | 🟡 Important |
| **page_view** | Every page load | Automatic | ✅ Active |

---

## 🧪 Testing Instructions

### **Step 1: Verify GA4 is Loading**

1. Restart dev server: `npm run dev`
2. Open your site: `http://localhost:3000`
3. Open Browser Console (F12)
4. Look for: `✅ Google Analytics 4 initialized: G-3H9L5298TG`

### **Step 2: Test Page Views**

1. Navigate between pages
2. Console should show: `📊 GA4 Event: page_view`
3. Check Network tab → Filter by `google-analytics` → Should see requests

### **Step 3: Test Generate Lead**

1. Start the quiz: `http://localhost:3000/consultation`
2. Complete all quiz questions
3. When you finish the last question, console should show:
   ```
   📊 GA4 Event: generate_lead
   ```

### **Step 4: Test Begin Checkout**

1. After quiz, go to checkout
2. When payment step loads, console should show:
   ```
   📊 GA4 Event: begin_checkout {value: XXX, currency: "USD", items: [...]}
   ```

### **Step 5: Test Purchase**

1. Complete a test purchase (use Stripe test card: `4242 4242 4242 4242`)
2. After successful payment, console should show:
   ```
   📊 GA4 Event: purchase {transaction_id: "xxx", value: XXX, currency: "USD", items: [...]}
   ```

---

## 📈 Verify in GA4 Dashboard

### **Real-Time Reports** (Immediate)

1. Go to GA4 Property: [analytics.google.com](https://analytics.google.com)
2. Click **Reports** → **Realtime**
3. Run tests above
4. You should see:
   - Page views updating
   - Events showing up in "Event count by Event name"

### **Events Report** (20 minutes delay)

1. Go to **Reports** → **Engagement** → **Events**
2. After 20 minutes, you should see:
   - `page_view`
   - `generate_lead`
   - `begin_checkout`
   - `purchase`

---

## 🎯 Set Up Conversions in GA4

For ad campaigns, you need to mark these as **Conversions**:

### **Instructions:**

1. Go to **Admin** (bottom left)
2. Under **Property** → Click **Events**
3. Find these events:
   - `generate_lead`
   - `purchase`
4. Toggle "Mark as conversion" ON for both

**This is CRITICAL for running ad campaigns!**

---

## 🚀 Production Deployment

### **Before Deploying:**

- [x] GA4 plugin created
- [x] All conversion events implemented
- [x] Plugin added to nuxt.config.ts
- [ ] Test all events in development
- [ ] Verify events in GA4 Realtime
- [ ] Mark conversions in GA4

### **After Deploying:**

1. **Immediately test** on production site
2. Check GA4 Realtime for events
3. Wait 24 hours for full data to populate
4. Verify conversions are tracking correctly

---

## 🔧 Troubleshooting

### **Events not showing in console?**
- Check browser console for errors
- Verify gtag.js loaded: `console.log(window.gtag)`
- Check Network tab for blocked requests

### **Events not in GA4 Dashboard?**
- Wait 20-30 minutes (processing delay)
- Check Realtime reports (immediate)
- Verify Measurement ID is correct

### **Test card for Stripe:**
```
Card: 4242 4242 4242 4242
Exp: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

---

## 📞 Support

If events aren't tracking:
1. Check browser console for errors
2. Verify Network tab shows gtag requests
3. Check GA4 DebugView (Admin → DebugView)

---

## ✅ Ready for Monday!

Once you complete the testing checklist above and mark conversions in GA4, you're ready to launch ad campaigns!

**Estimated setup time:** 15 minutes
**Estimated testing time:** 10 minutes
**Total:** 25 minutes to production-ready
