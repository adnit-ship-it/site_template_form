export default defineEventHandler(async (event) => {
  try {
    const response = await fetch('https://api-staging.care360-next.carevalidate.com/graphql/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        operationName: "OrganizationPartnerIntegrationPublicInfo",
        variables: { linkName: "art-s-org" },
        query: `query OrganizationPartnerIntegrationPublicInfo($linkName: String) { 
          organizationPartnerIntegrationPublicInfo(linkName: $linkName) { 
            id 
            organizationId 
            linkName 
            monthlyCost 
            tagline 
            allowSelfSignup 
            enableSelfSignupPayment 
            referralCodeEnabled 
            showCarouselPrices 
            showTestimonials 
            organizationDomainName 
            organizationDomainLink 
            homeLink 
            enableLegitScriptLogo 
            legitScriptIntegrationId 
            membersAreaLink 
            orderStatusLink 
            instructionsLink 
            supportLink 
            videoLink 
            affiliateLink 
            contactEmail 
            contactPhone 
            termsOfServicesLink 
            privacyPolicyLink 
            fulfillmentPolicyLink 
            jotformLink 
            organizationName 
            medicalConsentLink 
            forCaliforniaResidentsLink 
            billOfRightsLink 
            colorPrimary 
            colorFaqGradientBottom 
            primaryMedicationTitleText 
            primaryMedicationLargeTitleTextColor 
            primaryMedicationTitleTextColor 
            primaryMedicationSubtitle1Text 
            primaryMedicationSubtitle1TextColor 
            primaryMedicationSubtitle2Text 
            primaryMedicationSubtitle2TextColor 
            seeIfIQualifyButtonText 
            seeIfIQualifyButtonTextColor 
            seeIfIQualifyButtonColor 
            journeyHeadingTextColor 
            journeyItem1TitleText 
            journeyItem1TitleTextColor 
            journeyItem1SubtitleText 
            journeyItem1SubtitleTextColor 
            journeyItem2TitleText 
            journeyItem2TitleTextColor 
            journeyItem2SubtitleText 
            journeyItem2SubtitleTextColor 
            journeyItem3TitleText 
            journeyItem3TitleTextColor 
            journeyItem3SubtitleText 
            journeyItem3SubtitleTextColor 
            secondaryMedicationTitleText 
            secondaryMedicationTitleTextColor 
            secondaryMedicationBodyText 
            secondaryMedicationMainBodyTextColor 
            secondaryMedicationBodyTextColor 
            productPaymentLabelText 
            productPaymentLabelTextColor 
            signupSuccessMessageText 
            signupSuccessMessageTextColor 
            paymentSuccessMessageText 
            paymentSuccessMessageTextColor 
            attachPaymentInfoSuccessText 
            logosHeadingTextColor 
            logosColor 
            faqTitleTextColor 
            faqBodyTextColor 
            complianceLogosTitleTextColor 
            headerLinksTextColor 
            footerLinksTextColor 
            copyrightTextColor 
            legalLinksTextColor 
            carouselProductTextColor 
            productCategoriesColor 
            addHomeLinkToHeader 
            homeLinkName 
            showLogos 
            selfSignUpProfileFields 
            selfSignUpSmsNotificationsRequired 
            hideSeeIfQualifyBtn 
            journeyTitleText 
            useModalForSignup 
            formHeaderColor 
            formHeaderText 
            showProductCategoriesInLandingPage 
            showGDPRLogo 
            autoCreateUserPromoCodes 
            masterUserPromoCodeId 
            paymentProvider 
            nmiCollectJsPublicKey 
            loginCustomizeEnabled 
            loginTitle 
            loginSubtitle 
            loginImagePosition 
            loginAccentColor 
            isPartner 
            form { 
              description 
              id 
              isActive 
              name 
              organization { 
                id 
                __typename 
              } 
              questions { 
                hint 
                id 
                isPHI 
                options 
                placeholder 
                required 
                text 
                type 
                renderMode 
                index 
                condition { 
                  questionIndex 
                  response 
                  __typename 
                } 
                document { 
                  id 
                  fileName 
                  isGlobal 
                  __typename 
                } 
                __typename 
              } 
              versionId 
              versionNumber 
              showStepsIndividually 
              __typename 
            } 
            faq { 
              id 
              question 
              answer 
              index 
              __typename 
            } 
            productBundles { 
              id 
              name 
              description 
              price 
              priceUnit 
              initialDiscount 
              imageUrl 
              linkName 
              products { 
                name 
                imageUrl 
                categories { 
                  id 
                  name 
                  __typename 
                } 
                __typename 
              } 
              formVersion { 
                forms { 
                  id 
                  versionId 
                  name 
                  isActive 
                  questions { 
                    id 
                    text 
                    __typename 
                  } 
                  showStepsIndividually 
                  __typename 
                } 
                __typename 
              } 
              tag 
              isSoldOut 
              soldOutListText 
              soldOutListColor 
              soldOutModalText 
              soldOutModalColor 
              __typename 
            } 
            defaultProductBundle { 
              id 
              name 
              description 
              price 
              priceUnit 
              initialDiscount 
              imageUrl 
              linkName 
              products { 
                name 
                imageUrl 
                categories { 
                  id 
                  name 
                  __typename 
                } 
                __typename 
              } 
              formVersion { 
                forms { 
                  id 
                  versionId 
                  name 
                  isActive 
                  questions { 
                    id 
                    text 
                    __typename 
                  } 
                  showStepsIndividually 
                  __typename 
                } 
                __typename 
              } 
              tag 
              isSoldOut 
              soldOutListText 
              soldOutListColor 
              soldOutModalText 
              soldOutModalColor 
              __typename 
            } 
            visiblePromoCodes { 
              name 
              label 
              description 
              __typename 
            } 
            analyticsPromoCodes { 
              name 
              label 
              description 
              __typename 
            } 
            __typename 
          } 
        }`
      })
    })
    
    const result = await response.json()
    return result.data?.organizationPartnerIntegrationPublicInfo
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch CRM data'
    })
  }
}) 