# AR Ventures Everflow Tracking - Testing Guide

## 🎯 Implementation Summary

AR Ventures parallel tracking has been successfully integrated. Both tracking domains work independently:

- **Primary Domain**: `cg6ttm8trk.com` (Your existing tracking)
- **AR Domain**: `dp9mgd4trk.com` (AR Ventures tracking)

## 📊 Event Mapping

| Event | Primary (cg6ttm8trk) | AR Ventures (dp9mgd4trk) |
|-------|---------------------|--------------------------|
| Landing Page | - | Event 60 |
| Begin Quiz | Event 66 | Event 56 |
| Complete Quiz | Event 67 | Event 58 |
| Product Selected | Event 65 | Event 59 |
| Purchase/Case Created | Event 64 | aid: 19 |

## 🧪 Testing URLs

### Test AR Tracking:
```
http://localhost:3000/?source_id=AR_ventures&sub3=TEST_TXN_123&sub4=18&sub1=&sub2=&utm_source=ARV
```

### Test Regular Tracking (No AR):
```
http://localhost:3000/?affid=22&oid=19
```

## ✅ What to Check

### 1. Initial Page Load with AR Traffic
**URL**: Add `source_id=AR_ventures&sub3=TEST_TXN_123&sub4=18`

**Expected Console Logs**:
```
[AR Everflow] ✓ Detected AR traffic
[AR Everflow] ✓ Stored AR params (offer: 18, txn: TEST_TXN...)
[AR Everflow] ✓ SDK loaded
[AR Everflow] ✓ Event 60 (Landing Page) fired
```

**Check SessionStorage**:
- Open DevTools → Application → Session Storage
- Look for key: `ar_ef_data`
- Should contain: `{"transaction_id":"TEST_TXN_123","offer_id":"18","timestamp":...}`

### 2. Begin Quiz
**Action**: Start the quiz

**Expected Console Logs**:
```
📋 Triggering: BEGIN QUIZ (event_id: 66)  ← Primary
[AR Everflow] ✓ Event 56 fired            ← AR
```

### 3. Complete Quiz
**Action**: Finish all quiz questions

**Expected Console Logs**:
```
✅ Triggering: COMPLETE QUIZ (event_id: 67)  ← Primary
[AR Everflow] ✓ Event 58 fired               ← AR
```

### 4. Product Selection
**Action**: Select a product variation

**Expected Console Logs**:
```
🛍️ Triggering: PRODUCT SELECTED (event_id: 65)  ← Primary
[AR Everflow] ✓ Event 59 fired                   ← AR
```

### 5. Purchase/Checkout
**Action**: Complete checkout and submit form

**Expected Console Logs**:
```
🎉 Triggering: CASE CREATED (base conversion)  ← Primary
[AR Everflow] ✓ Purchase event fired           ← AR
```

## 🔍 Verification in Everflow Dashboards

### Primary Dashboard (cg6ttm8trk.com)
1. Login to your primary Everflow account
2. Check for conversions with your transaction_id
3. Verify events 66, 67, 65, 64 appear

### AR Dashboard (dp9mgd4trk.com)
1. AR Ventures should see conversions with their transaction_id (sub3)
2. Verify events 60, 56, 58, 59, and purchase (aid: 19) appear
3. offer_id should be 18

## 🚨 Troubleshooting

### AR Tracking Not Firing
**Check**:
1. URL has `source_id=AR_ventures` parameter
2. URL has `sub3` (transaction_id) and `sub4` (offer_id)
3. SessionStorage has `ar_ef_data` key
4. Console shows AR SDK loaded

### Both SDKs Conflicting
**Solution**: Each conversion call specifies `tracking_domain`, so they should route correctly. Check console for errors.

### AR Tracking Expired
**Note**: AR tracking expires after 30 days. Check the timestamp in sessionStorage.

### Primary Tracking Broken
**Rollback**: If primary tracking fails, the AR plugin can be disabled in `nuxt.config.ts` by commenting out the AR plugin line.

## 📝 Network Requests to Monitor

Open DevTools → Network tab and filter for:
- `cg6ttm8trk.com` - Your primary tracking calls
- `dp9mgd4trk.com` - AR tracking calls

You should see parallel requests to both domains when AR traffic is active.

## 🔒 Security Notes

- AR transaction_id and offer_id are stored in sessionStorage (client-side only)
- Data expires after 30 days
- No sensitive user data is stored in AR tracking
- Both tracking domains use HTTPS

## 📞 Support

If issues arise:
1. Check browser console for error messages
2. Verify sessionStorage has AR data
3. Test with non-AR traffic to confirm primary tracking still works
4. Contact AR Ventures with specific error messages

---

**Implementation Date**: {{ TODAY }}
**Version**: 1.0
**Status**: ✅ Ready for Testing
