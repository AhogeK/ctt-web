export interface TermsSection {
  id: string
  title: string
  content: string
  subsections?: TermsSection[]
}

export interface TermsContent {
  language: 'en'
  lastUpdated: string
  version: string
  sections: TermsSection[]
  disclaimer: string
}

export const termsContent: TermsContent = {
  language: 'en',
  lastUpdated: '2026-05-02',
  version: '1.0.0',
  sections: [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms',
      content: `By accessing, browsing, or using the Code Time Tracker platform ("Service"), you ("User," "you," or "your") acknowledge that you have read, understood, and agree to be bound by these Terms of Service ("Terms") and our Privacy Policy, which is incorporated herein by reference. If you do not agree to all of these Terms, you must not access or use the Service.

These Terms constitute a legally binding agreement between you and Code Time Tracker ("Company," "we," "us," or "our"). Your use of the Service is conditioned upon your acceptance of these Terms through a clickwrap agreement mechanism presented during account registration. By clicking "I Agree" or by creating an account, you expressly consent to these Terms.

If you are using the Service on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms. In such case, "you" and "your" refer to both you individually and the organization.`,
    },
    {
      id: 'description-of-service',
      title: '2. Description of Service',
      content: `Code Time Tracker is a developer analytics software-as-a-service ("SaaS") platform that provides the following capabilities:

Coding Time Tracking: The Service monitors and records the time you spend writing code in integrated development environments ("IDEs"), including active coding duration, idle periods, and session summaries.

Language Distribution Analytics: The Service analyzes your coding activity to generate statistics on programming language usage, including time spent per language, frequency of use, and trends over time.

Analytics Dashboards: The Service provides web-based dashboards that visualize your coding productivity metrics, historical data, project-level breakdowns, and team-level aggregations (where applicable).

JetBrains IDE Plugin Integration: The Service operates through a JetBrains IDE plugin ("Plugin") that you install in your local development environment. The Plugin collects coding session data and securely transmits it to our cloud infrastructure for processing and storage.

Cloud Data Synchronization: Your coding data is synchronized across devices through our cloud infrastructure, enabling you to access your analytics from any supported browser or device.

The Service is provided on a subscription basis with tiered feature access. We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time, with reasonable notice where practicable.`,
    },
    {
      id: 'user-accounts',
      title: '3. User Accounts & Responsibilities',
      content: `To access the Service, you must create an account by providing a valid email address and establishing a password. By creating an account, you agree to the following:

Account Security: You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account or any other breach of security.

Accurate Information: You agree to provide accurate, current, and complete information during the registration process and to update such information as necessary to keep it accurate, current, and complete.

Age Requirement: You must be at least eighteen (18) years of age, or the age of legal majority in your jurisdiction, whichever is greater, to create an account and use the Service. By creating an account, you represent and warrant that you meet this age requirement.

Account Termination: We reserve the right to suspend or terminate your account at our sole discretion, with or without notice, for any reason including but not limited to violation of these Terms, suspected fraudulent activity, or extended periods of inactivity.

Single Account Policy: Each individual is permitted to maintain only one (1) active account. Creation of multiple accounts may result in suspension of all associated accounts.`,
    },
    {
      id: 'acceptable-use',
      title: '4. Acceptable Use Policy',
      content: `You agree to use the Service only for lawful purposes and in accordance with these Terms. You shall not use the Service to transmit, store, or process any content that violates applicable laws or regulations in any jurisdiction where the Service operates.`,
      subsections: [
        {
          id: 'prohibited-content',
          title: '4.1 Prohibited Content',
          content: `You shall not use the Service to create, upload, transmit, store, or process any content that:

Illegal Activities: Violates any applicable local, state, national, or international law or regulation, including but not limited to laws regarding the export of data or software.

Intellectual Property Infringement: Infringes upon or misappropriates any patent, trademark, trade secret, copyright, or other intellectual property or proprietary right of any party.

Harmful Software: Contains viruses, malware, trojan horses, worms, time bombs, cancelbots, or any other harmful or deleterious programs or code.

Spam and Abuse: Constitutes unsolicited or unauthorized advertising, promotional materials, junk mail, spam, chain letters, pyramid schemes, or any other form of solicitation.

Reverse Engineering: Attempts to reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code, underlying ideas, algorithms, or structure of the Service or any portion thereof.

Unauthorized Access: Attempts to gain unauthorized access to the Service, other accounts, computer systems, or networks connected to the Service, whether through hacking, password mining, or any other means.

China-Specific Prohibited Content (Cybersecurity Law of the People's Republic of China): In compliance with the Cybersecurity Law of the People's Republic of China ("CSL"), the Data Security Law, and the Personal Information Protection Law ("PIPL"), you shall not use the Service to create, upload, transmit, store, or process any content that:

(a) Endangers national security, divulges state secrets, or subverts state power;
(b) Damages national honor or interests;
(c) Incites ethnic hatred or discrimination, or undermines national unity;
(d) Violates the national religious policy, or propagates cults or superstition;
(e) Spreads rumors, disrupts social order, or undermines social stability;
(f) Contains obscenity, pornography, gambling, violence, murder, terror, or instigates crime;
(g) Insults or defames others, or infringes upon the lawful rights and interests of others;
(h) Contains any other content prohibited by laws or administrative regulations.

Users who violate these China-specific provisions bear full legal liability for their actions under applicable Chinese law, including but not limited to the CSL, the Data Security Law, the PIPL, and related implementing regulations. The Company shall cooperate with relevant authorities as required by law.`,
        },
        {
          id: 'user-responsibility',
          title: '4.2 User Responsibility',
          content: `You acknowledge and agree that you bear sole and full legal responsibility for all content you submit, transmit, or process through the Service, including content submitted via the JetBrains IDE plugin, the web interface, or any API integration.

The Company acts as a technology platform provider and does not pre-screen, monitor, or review all user-submitted content. However, we reserve the right to review, remove, or disable access to any content at our sole discretion, without notice, for any reason.

You agree to indemnify and hold harmless the Company from any claims, damages, losses, or liabilities arising from content you submit through the Service, including but not limited to claims related to prohibited content violations, intellectual property infringement, or breach of applicable laws.

In the event that your content is reported to or discovered by the Company as potentially violating these Terms or applicable law, we may take any action we deem appropriate, including but not limited to removing the content, suspending your account, reporting to law enforcement, and cooperating with governmental authorities.`,
        },
      ],
    },
    {
      id: 'user-generated-content',
      title: '5. User-Generated Content',
      content: `The Service allows you to submit, store, and process content, including but not limited to coding session data, project configurations, and analytics preferences ("User Content").

Ownership: You retain all right, title, and interest in and to your User Content. These Terms do not grant us any ownership rights to your User Content.

License Grant: By submitting User Content to the Service, you grant the Company a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to host, store, transfer, display, reproduce, modify, and analyze your User Content solely for the purpose of operating, providing, and improving the Service.

Content Moderation: We reserve the right, but have no obligation, to monitor, review, and moderate User Content for compliance with these Terms. We may remove or disable access to any User Content that we determine, in our sole discretion, violates these Terms or is otherwise objectionable.

DMCA Takedown Procedure: If you believe that any content on the Service infringes your copyright, you may submit a takedown notice pursuant to the Digital Millennium Copyright Act ("DMCA") by providing the following information to our designated copyright agent:

(a) A physical or electronic signature of the copyright owner or authorized representative;
(b) Identification of the copyrighted work claimed to have been infringed;
(c) Identification of the material that is claimed to be infringing, with sufficient detail for us to locate it;
(d) Your contact information, including address, telephone number, and email;
(e) A statement that you have a good faith belief that the use is not authorized by the copyright owner, its agent, or the law;
(f) A statement, under penalty of perjury, that the information in the notice is accurate and that you are authorized to act on behalf of the copyright owner.

DMCA notices should be sent to: dmca@codetimetracker.com

Upon receipt of a valid DMCA notice, we will promptly remove or disable access to the allegedly infringing content and notify the affected user. Counter-notifications may be filed in accordance with the DMCA.`,
    },
    {
      id: 'intellectual-property',
      title: '6. Intellectual Property',
      content: `The Service, including all software, source code, algorithms, designs, user interfaces, graphics, documentation, trademarks, service marks, trade names, trade dress, and all other intellectual property rights therein ("Platform IP"), is and shall remain the exclusive property of the Company and its licensors.

Limited License: Subject to your compliance with these Terms, the Company grants you a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to access and use the Service for your personal or internal business purposes during the term of your subscription.

Restrictions: You shall not:

(a) Copy, modify, distribute, sell, or lease any part of the Platform IP;
(b) Reverse engineer or attempt to extract the source code of the Service or any component thereof;
(c) Remove, alter, or obscure any proprietary notices, labels, or marks on the Service;
(d) Use the Company's trademarks, service marks, or trade names without our prior written consent;
(e) Create derivative works based upon the Service or any Platform IP;
(f) Use the Service to build a competing product or service.

Any feedback, suggestions, ideas, or recommendations you provide regarding the Service ("Feedback") may be used by the Company without restriction or obligation. You hereby assign to the Company all right, title, and interest in and to such Feedback.`,
    },
    {
      id: 'privacy-data-protection',
      title: '7. Privacy & Data Protection',
      content: `Our collection, use, and protection of your personal data is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Service, you consent to the data practices described in our Privacy Policy.

In addition to our general Privacy Policy, the following jurisdiction-specific disclosures apply to users in the respective regions:`,
      subsections: [
        {
          id: 'china-pipl-csl',
          title: '7.1 China (PIPL & CSL)',
          content: `For users located in the People's Republic of China, the following provisions apply in compliance with the Personal Information Protection Law ("PIPL") and the Cybersecurity Law ("CSL"):

Data Processing Scope: We process personal information only to the extent necessary to provide the Service, including account registration data, coding session metadata, and usage analytics. We do not process personal information beyond the stated purposes without obtaining separate consent.

Separate Consent for Sensitive Data: Where we process sensitive personal information (as defined under PIPL), including biometric data, financial information, or data concerning minors, we will obtain your separate and explicit consent prior to processing.

Cross-Border Transfer Requirements: If your personal information is transferred outside of mainland China, we will comply with applicable cross-border data transfer requirements, including conducting a security assessment, obtaining separate consent, and executing standard contractual clauses as required by the Cyberspace Administration of China ("CAC").

Data Minimization: We adhere to the principle of data minimization, collecting only the personal information that is directly relevant and necessary for the stated purposes of the Service.

Data Localization: Where required by applicable law, certain categories of personal information and important data will be stored within mainland China.

Your Rights: Under PIPL, you have the right to know, decide, restrict, object to, access, copy, correct, delete, and request portability of your personal information. You may exercise these rights by contacting us at the address provided in Section 14.`,
        },
        {
          id: 'eu-gdpr',
          title: '7.2 European Union (GDPR)',
          content: `For users located in the European Economic Area ("EEA"), the United Kingdom, or Switzerland, the following provisions apply in compliance with the General Data Protection Regulation ("GDPR"):

Lawful Basis for Processing: We process your personal data based on the following lawful bases:
(a) Performance of a contract (providing the Service to you);
(b) Legitimate interests (improving the Service, preventing fraud);
(c) Consent (where specifically obtained);
(d) Legal obligation (compliance with applicable laws).

Data Subject Rights: Under GDPR, you have the following rights:
(a) Right of Access: You may request a copy of the personal data we hold about you;
(b) Right of Rectification: You may request correction of inaccurate personal data;
(c) Right of Erasure: You may request deletion of your personal data ("right to be forgotten");
(d) Right to Data Portability: You may request your data in a structured, commonly used, machine-readable format;
(e) Right to Restrict Processing: You may request that we limit the processing of your personal data;
(f) Right to Object: You may object to the processing of your personal data;
(g) Right to Withdraw Consent: Where processing is based on consent, you may withdraw consent at any time.

Data Breach Notification: In the event of a personal data breach that is likely to result in a risk to your rights and freedoms, we will notify the relevant supervisory authority within seventy-two (72) hours of becoming aware of the breach, and will notify affected data subjects without undue delay where required.

Data Protection Officer: You may contact our Data Protection Officer at dpo@codetimetracker.com for any questions regarding your data protection rights.

International Data Transfers: Where we transfer personal data outside the EEA, we ensure appropriate safeguards are in place, including Standard Contractual Clauses approved by the European Commission.`,
        },
        {
          id: 'usa-ccpa',
          title: '7.3 United States (CCPA/CPRA)',
          content: `For users who are California residents, the following provisions apply in compliance with the California Consumer Privacy Act ("CCPA") as amended by the California Privacy Rights Act ("CPRA"):

Categories of Personal Information Collected: We collect the following categories of personal information:
(a) Identifiers (name, email address, account ID);
(b) Internet or electronic network activity information (usage data, session logs);
(c) Professional or employment-related information (company name, job title, if provided);
(d) Inferences drawn from the above (productivity patterns, coding preferences).

"Do Not Sell or Share" Right: You have the right to direct us not to sell or share your personal information for cross-context behavioral advertising purposes. We honor the Global Privacy Control ("GPC") signal as a valid opt-out request. You may also submit opt-out requests by contacting us directly.

Right to Know and Delete: You have the right to request that we disclose the personal information we have collected about you, and to request deletion of your personal information, subject to certain exceptions.

Right to Correct: You have the right to request correction of inaccurate personal information.

Right to Limit Use of Sensitive Personal Information: You have the right to limit the use and disclosure of sensitive personal information.

Response Window: We will respond to verified consumer requests within forty-five (45) days of receipt. If we require additional time, we will notify you of the extension and the reason therefor.

Non-Discrimination: We will not discriminate against you for exercising any of your CCPA/CPRA rights.`,
        },
        {
          id: 'japan-appi',
          title: '7.4 Japan (APPI)',
          content: `For users located in Japan, the following provisions apply in compliance with the Act on the Protection of Personal Information ("APPI"):

Purpose of Data Collection: We specify and publicly announce the purposes for which we utilize personal information. We will not handle personal information beyond the scope necessary to achieve the specified purposes without your prior consent.

Third-Party Transfers: We will not provide your personal information to any third party without your prior consent, except where permitted by APPI, such as when required by law or when necessary to protect human life, health, or property.

Opt-In/Opt-Out Rights: You have the right to request disclosure, correction, addition, deletion, cessation of use, or cessation of third-party provision of your personal information. We will respond to such requests in accordance with APPI requirements.

Supervision of Third Parties: Where we entrust the handling of personal information to a third party (such as cloud infrastructure providers), we will exercise necessary and appropriate supervision to ensure the security of such information.

Cross-Border Transfers: Where we transfer personal information outside Japan, we will ensure that the receiving party maintains data protection standards equivalent to those required under APPI, or obtain your consent for such transfer.`,
        },
        {
          id: 'korea-pipa',
          title: '7.5 South Korea (PIPA)',
          content: `For users located in the Republic of Korea, the following provisions apply in compliance with the Personal Information Protection Act ("PIPA"):

Explicit Consent: We obtain your explicit consent before collecting, using, or providing your personal information, except where permitted by PIPA without consent.

Sensitive Data Processing: We obtain separate and explicit consent before processing sensitive personal information (as defined under PIPA), including data related to health, political opinions, religious beliefs, or criminal records.

Individual Rights: Under PIPA, you have the following rights:
(a) Right to request access to your personal information;
(b) Right to request correction or deletion of your personal information;
(c) Right to request suspension of processing of your personal information;
(d) Right to be informed of the processing of your personal information.

Data Breach Notification: In the event of a personal information breach, we will notify affected individuals without delay and report to the Personal Information Protection Commission.

Designated Privacy Officer: We have designated a Chief Privacy Officer responsible for overseeing our compliance with PIPA. You may contact this officer at privacy@codetimetracker.com.

Consent Withdrawal: You may withdraw your consent to the collection, use, and provision of your personal information at any time. However, withdrawal of consent may limit your ability to use certain features of the Service.`,
        },
        {
          id: 'privacy-brazil-lgpd',
          title: '7.6 Brazil (LGPD)',
          content: `For users located in Brazil, the following provisions apply in compliance with the Lei Geral de Proteção de Dados Pessoais ("LGPD"):

Lawful Basis for Processing: We process personal data based on the following lawful bases:
(a) Consent: Free, informed, and unambiguous consent for specific purposes;
(b) Contractual performance: Processing necessary for the performance of a contract;
(c) Legal obligation: Compliance with legal or regulatory obligations;
(d) Legitimate interest: Processing necessary for legitimate interests pursued by us or third parties.

Data Subject Rights: Under LGPD, you have the following rights:
(a) Right of Confirmation and Access: You may request confirmation of and access to your personal data;
(b) Right of Correction: You may request correction of incomplete, inaccurate, or outdated personal data;
(c) Right of Anonymization, Blocking, or Deletion: You may request anonymization, blocking, or deletion of unnecessary or excessive data;
(d) Right to Data Portability: You may request portability of your personal data to another service provider;
(e) Right to Delete Personal Data: You may request deletion of personal data processed with your consent;
(f) Right to Information on Sharing: You may request information about public and private entities with which your data has been shared;
(g) Right to Revoke Consent: You may revoke your consent at any time.

Cross-Border Transfers: We transfer personal data outside Brazil only when:
(a) The recipient country provides an adequate level of data protection as determined by the Autoridade Nacional de Proteção de Dados ("ANPD");
(b) We have implemented Standard Contractual Clauses ("SCCs") or Binding Corporate Rules ("BCRs");
(c) You have provided specific consent for the transfer.

Data Breach Notification: In the event of a security incident that may create risk or relevant harm to data subjects, we will notify the ANPD and affected data subjects within a reasonable time as determined by the ANPD.

Data Protection Officer: We have appointed a Data Protection Officer ("Encarregado") who can be contacted at dpo@codetimetracker.com for any questions regarding your data protection rights.

Penalties: Non-compliance with LGPD may result in penalties of up to two percent (2%) of the revenue of the private legal entity, group, or conglomerate in Brazil in its last fiscal year, limited to a total of R$50,000,000.00 (fifty million reais) per infraction.`,
        },
        {
          id: 'privacy-canada-pipeda',
          title: '7.7 Canada (PIPEDA + Provincial)',
          content: `For users located in Canada, the following provisions apply in compliance with the Personal Information Protection and Electronic Documents Act ("PIPEDA") and applicable provincial privacy legislation:

Meaningful Consent: We obtain meaningful consent for the collection, use, and disclosure of your personal information. We ensure that consent is:
(a) Express and informed: You understand what you are consenting to;
(b) Voluntary: Not a condition of service beyond what is necessary;
(c) Specific: Limited to the stated purposes;
(d) Documented: We maintain records of consent obtained.

Data Subject Rights: Under PIPEDA, you have the following rights:
(a) Right of Access: You may request access to the personal information we hold about you;
(b) Right of Correction: You may request correction of inaccurate personal information;
(c) Right to Challenge Compliance: You may challenge our compliance with PIPEDA's principles.

Cross-Border Transfers: We transfer personal information outside Canada only where the receiving jurisdiction provides comparable privacy protection. We ensure contractual protections are in place to provide a comparable level of protection.

Breach Notification: In the event of a breach of security safeguards that creates a real risk of significant harm to affected individuals, we will:
(a) Report to the Privacy Commissioner of Canada;
(b) Notify affected individuals as soon as feasible;
(c) Notify any third-party organizations that may be able to reduce the risk of harm.

Provincial Variations: Users in Quebec are additionally protected by Law 25 (An Act respecting the protection of personal information in the private sector), which includes enhanced consent requirements, privacy impact assessments, and a right to data portability. Users in Alberta and British Columbia are protected by their respective Personal Information Protection Acts, which contain similar but distinct requirements.

Penalties: Non-compliance with PIPEDA may result in penalties of up to CAD $100,000 per violation. Proposed amendments under the Consumer Privacy Protection Act ("CPPA") would increase penalties to the greater of CAD $25,000,000 or five percent (5%) of global revenue.`,
        },
        {
          id: 'privacy-australia-privacy-act',
          title: '7.8 Australia (Privacy Act 1988 + 2024 Amendments)',
          content: `For users located in Australia, the following provisions apply in compliance with the Privacy Act 1988 (Cth) and the Privacy Amendment (Enforcement and Other Measures) Act 2024:

Consent Model: We operate on an opt-out model for general personal information. For sensitive information (as defined under the Privacy Act), we obtain your express consent prior to collection.

Australian Privacy Principles: We comply with the Australian Privacy Principles ("APPs"), including:
(a) APP 1: Open and transparent management of personal information;
(b) APP 5: Notification of the collection of personal information;
(c) APP 6: Use or disclosure of personal information;
(d) APP 8: Cross-border disclosure of personal information;
(e) APP 11: Security of personal information.

Data Subject Rights: Under the Privacy Act, you have the following rights:
(a) Right of Access: You may request access to the personal information we hold about you;
(b) Right of Correction: You may request correction of inaccurate personal information;
(c) Right of Deletion: Under 2024 amendments, you may request deletion of personal information no longer needed;
(d) Right of Erasure: New statutory right to request erasure of personal information.

Cross-Border Transfers: We take reasonable steps to ensure that overseas recipients comply with the APPs. Where we disclose personal information to overseas recipients, we ensure contractual protections are in place.

Breach Notification: In the event of an eligible data breach, we will notify the Office of the Australian Information Commissioner ("OAIC") and affected individuals within thirty (30) days of becoming aware of the breach.

Penalties: Under the 2024 amendments, penalties for serious or repeated breaches have been significantly increased to the greater of:
(a) AUD $50,000,000;
(b) Three times the value of any benefit obtained through the misuse of information;
(c) Thirty percent (30%) of the entity's adjusted turnover in the relevant period.

Statutory Tort: Effective June 2025, a new statutory tort for serious privacy invasions allows individuals to take direct action in court for serious invasions of privacy without needing to demonstrate financial loss.`,
        },
        {
          id: 'privacy-india-dpdp',
          title: '7.9 India (DPDP Act 2023)',
          content: `For users located in India, the following provisions apply in compliance with the Digital Personal Data Protection Act, 2023 ("DPDP Act"):

Consent Requirements: We process personal data based on your free, specific, informed, unconditional, and unambiguous consent. Consent is:
(a) Given through a clear affirmative action;
(b) Limited to the specific purpose stated;
(c) Withdrawable at any time;
(d) Not a condition for receiving services beyond what is necessary.

Data Principal Rights: Under the DPDP Act, you have the following rights:
(a) Right of Access: You may request a summary of personal data being processed and processing activities;
(b) Right of Correction and Erasure: You may request correction, completion, updating, or erasure of personal data;
(c) Right of Grievance Redressal: You may seek grievance redressal through accessible mechanisms;
(d) Right to Nominate: You may nominate another person to exercise your rights in the event of your death or incapacity;
(e) Right to Withdraw Consent: You may withdraw consent at any time with the same ease with which it was given.

Cross-Border Transfers: We may transfer personal data outside India except to countries or territories restricted by the Central Government through notification. We ensure adequate safeguards are in place for cross-border transfers.

Breach Notification: In the event of a personal data breach, we will notify the Data Protection Board of India and affected Data Principals in such manner as may be prescribed.

Children's Data: We do not process personal data of children (individuals under eighteen years of age) without verifiable parental consent. We do not undertake tracking or behavioral monitoring of children or targeted advertising directed at children.

Consent Manager: You may appoint a Consent Manager to manage consent on your behalf through an accessible, transparent, and interoperable platform registered with the Data Protection Board.

Penalties: Non-compliance with the DPDP Act may result in penalties of up to two hundred fifty crore rupees (approximately thirty million United States dollars) per instance.`,
        },
        {
          id: 'privacy-uk-gdpr',
          title: '7.10 United Kingdom (UK GDPR + Data Protection Act 2018)',
          content: `For users located in the United Kingdom, the following provisions apply in compliance with the UK General Data Protection Regulation ("UK GDPR") and the Data Protection Act 2018:

Lawful Basis for Processing: We process your personal data based on the following lawful bases:
(a) Performance of a contract (providing the Service to you);
(b) Legitimate interests (improving the Service, preventing fraud);
(c) Consent (where specifically obtained);
(d) Legal obligation (compliance with applicable laws).

Data Subject Rights: Under UK GDPR, you have the following rights:
(a) Right of Access: You may request a copy of the personal data we hold about you;
(b) Right of Rectification: You may request correction of inaccurate personal data;
(c) Right of Erasure: You may request deletion of your personal data ("right to be forgotten");
(d) Right to Data Portability: You may request your data in a structured, commonly used, machine-readable format;
(e) Right to Restrict Processing: You may request that we limit the processing of your personal data;
(f) Right to Object: You may object to the processing of your personal data;
(g) Right to Withdraw Consent: Where processing is based on consent, you may withdraw consent at any time.

Age Threshold: The age threshold for valid consent for information society services in the UK is thirteen (13) years, compared to sixteen (16) years under the EU GDPR.

Data Breach Notification: In the event of a personal data breach that is likely to result in a risk to your rights and freedoms, we will notify the Information Commissioner's Office ("ICO") within seventy-two (72) hours of becoming aware of the breach, and will notify affected data subjects without undue delay where required.

International Data Transfers: Where we transfer personal data outside the UK, we ensure appropriate safeguards are in place, including International Data Transfer Agreements or UK Addenda to EU Standard Contractual Clauses.

Penalties: Non-compliance with UK GDPR may result in penalties of up to seventeen million pounds sterling (£17,500,000) or four percent (4%) of annual global turnover, whichever is greater.

Post-Brexit Distinction: The UK GDPR operates as a separate legal framework from the EU GDPR following the United Kingdom's withdrawal from the European Union. Data transfers between the UK and EEA are currently permitted under adequacy decisions.`,
        },
        {
          id: 'privacy-singapore-pdpa',
          title: '7.11 Singapore (PDPA)',
          content: `For users located in Singapore, the following provisions apply in compliance with the Personal Data Protection Act 2012 ("PDPA") as amended in 2024:

Consent and Obligations: We comply with the eleven (11) key obligations under the PDPA, including:
(a) Consent obligation: We obtain your consent before collecting, using, or disclosing your personal data;
(b) Purpose limitation obligation: We collect, use, or disclose personal data only for purposes that a reasonable person would consider appropriate;
(c) Notification obligation: We notify you of the purposes for collection, use, or disclosure;
(d) Access and correction obligation: We provide access to and correction of personal data upon request;
(e) Protection obligation: We protect personal data with reasonable security arrangements;
(f) Retention limitation obligation: We cease to retain personal data when no longer necessary;
(g) Transfer limitation obligation: We ensure comparable protection for cross-border transfers.

Data Subject Rights: Under the PDPA, you have the following rights:
(a) Right of Access: You may request access to your personal data within one (1) year of the request;
(b) Right of Correction: You may request correction of inaccurate personal data;
(c) Right to Withdraw Consent: You may withdraw consent at any time, subject to reasonable notice.

Cross-Border Transfers: We transfer personal data outside Singapore only where the receiving country or territory provides a comparable standard of protection. We ensure contractual protections are in place to provide a comparable level of protection.

Breach Notification: In the event of a data breach that is likely to result in significant harm to affected individuals or that affects five hundred (500) or more individuals, we will notify the Personal Data Protection Commission ("PDPC") and affected individuals.

Penalties: Under the 2024 amendments, penalties for significant breaches have been increased to the greater of:
(a) SGD $1,000,000;
(b) Ten percent (10%) of the organization's annual turnover in Singapore.

AI Usage Guidelines: The 2024 amendments include guidelines on the use of artificial intelligence in processing personal data, requiring transparency and accountability in AI-driven decision-making.`,
        },
        {
          id: 'privacy-south-africa-popia',
          title: '7.12 South Africa (POPIA)',
          content: `For users located in South Africa, the following provisions apply in compliance with the Protection of Personal Information Act, 2013 ("POPIA"):

Lawful Basis for Processing: We process personal information based on the following lawful bases:
(a) Consent: You have given consent for specific processing;
(b) Contractual necessity: Processing is necessary for the performance of a contract;
(c) Legal obligation: Processing is required by law;
(d) Legitimate interest: Processing is necessary for legitimate interests;
(e) Public interest: Processing is necessary for a public law duty;
(f) Legitimate interest of a third party: Processing is necessary for the legitimate interest of a third party.

Data Subject Rights: Under POPIA, you have the following rights:
(a) Right of Access: You may request confirmation of whether we hold personal information about you and access to such information;
(b) Right of Correction: You may request correction or deletion of inaccurate, irrelevant, excessive, out-of-date, incomplete, misleading, or unlawfully obtained personal information;
(c) Right to Object: You may object to the processing of your personal information for purposes of direct marketing;
(d) Right to Complain: You may submit a complaint to the Information Regulator.

Cross-Border Transfers: We transfer personal information outside South Africa only where:
(a) The recipient is subject to a law, binding corporate rules, or contract that provides an adequate level of protection;
(b) You have consented to the transfer;
(c) The transfer is necessary for the performance of a contract.

Breach Notification: In the event of a security compromise, we will notify the Information Regulator and affected data subjects as soon as reasonably possible.

Children's Data: We do not process personal information of children (individuals under eighteen years of age) without the consent of a competent person (parent or legal guardian).

Penalties: Non-compliance with POPIA may result in:
(a) Administrative fines of up to ten million rand (R10,000,000);
(b) Imprisonment for a period not exceeding ten (10) years;
(c) Both a fine and imprisonment.`,
        },
        {
          id: 'privacy-switzerland-fadp',
          title: '7.13 Switzerland (FADP)',
          content: `For users located in Switzerland, the following provisions apply in compliance with the Federal Act on Data Protection ("FADP") as revised effective September 1, 2023:

Consent Requirements: We obtain your consent before processing personal data. For the processing of sensitive personal data, we obtain your explicit consent. Consent may be withdrawn at any time.

Data Subject Rights: Under the revised FADP, you have the following rights:
(a) Right of Access: You may request information about whether personal data concerning you is being processed;
(b) Right of Correction: You may request correction of inaccurate personal data;
(c) Right of Deletion: You may request deletion of personal data;
(d) Right to Data Portability: You may request your personal data in a commonly used electronic format;
(e) Right to Object: You may object to the processing of your personal data.

Cross-Border Transfers: We transfer personal data outside Switzerland only where:
(a) The Federal Council has determined that the destination country provides adequate protection;
(b) We have implemented appropriate safeguards, including Standard Contractual Clauses or Binding Corporate Rules;
(c) You have given your consent after being informed of the risks.

Breach Notification: In the event of a data security breach that is likely to result in a high risk to the personality or fundamental rights of the data subjects, we will notify the Federal Data Protection and Information Commissioner ("FDPIC") as soon as possible.

Penalties: Under the revised FADP, natural persons who intentionally violate data protection provisions may be fined up to two hundred fifty thousand Swiss francs (CHF 250,000). The revised FADP does not provide for administrative fines against legal entities, but responsible individuals may be held personally liable.

Effective Date: The revised FADP became effective on September 1, 2023, with no transition period. All provisions are immediately applicable.`,
        },
        {
          id: 'privacy-thailand-pdpa',
          title: '7.14 Thailand (PDPA)',
          content: `For users located in Thailand, the following provisions apply in compliance with the Personal Data Protection Act, B.E. 2562 (2019) ("PDPA"):

Consent Requirements: We obtain your consent before collecting, using, or disclosing your personal data. For sensitive personal data, we obtain your explicit consent. Consent must be:
(a) Freely given;
(b) Specific;
(c) Informed;
(d) Unambiguous.

Data Subject Rights: Under the PDPA, you have the following rights:
(a) Right of Access: You may request access to your personal data;
(b) Right of Correction: You may request correction of inaccurate personal data;
(c) Right of Deletion: You may request deletion of personal data that is no longer necessary;
(d) Right to Data Portability: You may request your personal data in a structured, commonly used, machine-readable format;
(e) Right to Object: You may object to the collection, use, or disclosure of your personal data;
(f) Right to Restrict Processing: You may request restriction of processing.

Cross-Border Transfers: We transfer personal data outside Thailand only where:
(a) The destination country has adequate data protection standards as determined by the Personal Data Protection Committee;
(b) We have implemented appropriate safeguards;
(c) You have given your consent after being informed of the destination country's data protection standards.

Breach Notification: In the event of a personal data breach, we will notify the Personal Data Protection Committee and affected data subjects within seventy-two (72) hours of becoming aware of the breach.

Penalties: Non-compliance with the PDPA may result in:
(a) Administrative fines of up to five million baht (THB 5,000,000);
(b) Criminal penalties including imprisonment for up to one (1) year and fines of up to one million baht (THB 1,000,000);
(c) Both administrative and criminal penalties.`,
        },
        {
          id: 'privacy-indonesia-pdp',
          title: '7.15 Indonesia (PDP Law)',
          content: `For users located in Indonesia, the following provisions apply in compliance with Law No. 27 of 2022 on Personal Data Protection ("PDP Law"):

Consent Requirements: We obtain your consent before processing personal data. Consent must be:
(a) Explicit and informed;
(b) Given through a clear affirmative action;
(c) Specific to the stated purpose;
(d) Withdrawable at any time.

Data Subject Rights: Under the PDP Law, you have the following rights:
(a) Right of Access: You may request access to your personal data;
(b) Right of Correction: You may request correction of inaccurate or incomplete personal data;
(c) Right of Deletion: You may request deletion of personal data;
(d) Right to Restrict Processing: You may request restriction of processing;
(e) Right to Object: You may object to the processing of your personal data;
(f) Right to Data Portability: You may request your personal data in a structured, commonly used format.

Cross-Border Transfers: We transfer personal data outside Indonesia only where:
(a) The destination country has an adequate level of data protection as determined by the relevant authority;
(b) We have implemented binding agreements or corporate rules;
(c) You have given your consent for the transfer.

Breach Notification: In the event of a personal data breach, we will notify affected data subjects and the relevant authority within fourteen (14) days of becoming aware of the breach.

Penalties: Non-compliance with the PDP Law may result in:
(a) Administrative fines of up to two percent (2%) of annual revenue;
(b) Criminal penalties including imprisonment for up to six (6) years and fines of up to six billion rupiah (IDR 6,000,000,000);
(c) Both administrative and criminal penalties.

Effective Date: The PDP Law became effective on October 17, 2024, with a two-year transition period for compliance.`,
        },
      ],
    },
    {
      id: 'third-party-services',
      title: '8. Third-Party Services',
      content: `The Service integrates with and relies upon certain third-party services and platforms. Your use of these third-party services is subject to their respective terms of service and privacy policies.

JetBrains IDE Plugin: The Service operates through a JetBrains IDE plugin that you install in your local development environment. The Plugin is subject to JetBrains' terms of service and privacy policy in addition to these Terms. We are not responsible for the performance, availability, or security of the JetBrains IDE itself.

Cloud Infrastructure Providers: The Service is hosted on cloud infrastructure provided by Amazon Web Services ("AWS") and Google Cloud Platform ("GCP"). These providers may process certain data as part of providing infrastructure services. Their respective terms of service and data processing agreements apply to such processing.

Analytics Tools: We may use third-party analytics tools to monitor and improve the Service. These tools may collect information about your usage patterns in accordance with their own privacy policies.

Third-Party Limitations: We make no representations or warranties regarding the availability, security, or functionality of any third-party service. We shall not be liable for any loss or damage arising from your use of or reliance on any third-party service.

Data Processing Agreements: We maintain data processing agreements with our third-party service providers that require them to protect your personal data in accordance with applicable data protection laws.`,
    },
    {
      id: 'disclaimers-liability',
      title: '9. Disclaimers & Limitation of Liability',
      content: `THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE. TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, THE COMPANY DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.

We do not warrant that:
(a) The Service will be uninterrupted, timely, secure, or error-free;
(b) The results obtained from the use of the Service will be accurate or reliable;
(c) The quality of any products, services, information, or other material obtained through the Service will meet your expectations;
(d) Any errors in the Service will be corrected.

LIMITATION OF LIABILITY: TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL THE COMPANY, ITS DIRECTORS, OFFICERS, EMPLOYEES, AGENTS, PARTNERS, OR SUPPLIERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATED TO:

(a) Your access to, use of, or inability to access or use the Service;
(b) Any conduct or content of any third party on the Service;
(c) Any content obtained from the Service;
(d) Unauthorized access, use, or alteration of your transmissions or content;

WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), OR ANY OTHER LEGAL THEORY, WHETHER OR NOT WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

AGGREGATE LIABILITY CAP: NOTWITHSTANDING ANYTHING TO THE CONTRARY HEREIN, THE COMPANY'S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE TOTAL AMOUNT OF FEES PAID BY YOU TO THE COMPANY IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE LIABILITY, OR (B) ONE HUNDRED UNITED STATES DOLLARS ($100.00 USD).

Some jurisdictions do not allow the exclusion or limitation of certain warranties or damages. In such jurisdictions, our liability shall be limited to the maximum extent permitted by law.`,
    },
    {
      id: 'indemnification',
      title: '10. Indemnification',
      content: `You agree to defend, indemnify, and hold harmless the Company, its parent, subsidiaries, affiliates, and their respective directors, officers, employees, agents, contractors, licensors, and suppliers from and against any and all claims, actions, suits, proceedings, demands, losses, damages, liabilities, costs, and expenses (including reasonable attorneys' fees and court costs) arising out of or related to:

(a) Your use of or access to the Service;
(b) Your violation or breach of any provision of these Terms;
(c) Your violation of any applicable law, regulation, or third-party right;
(d) Any content you submit, transmit, or process through the Service, including but not limited to prohibited content as defined in Section 4;
(e) Your negligent or willful misconduct;
(f) Any dispute between you and any third party arising from your use of the Service.

The Company reserves the right, at its own expense, to assume the exclusive defense and control of any matter otherwise subject to indemnification by you, in which event you agree to cooperate with the Company in the defense of such claim. You shall not settle any claim without the Company's prior written consent.

This indemnification obligation shall survive the termination or expiration of these Terms and your use of the Service.`,
    },
    {
      id: 'termination',
      title: '11. Termination',
      content: `Company's Right to Terminate: We may suspend or terminate your access to the Service, in whole or in part, at any time, for any reason, with or without notice, including but not limited to:

(a) Violation of these Terms or any applicable law;
(b) Suspected fraudulent, abusive, or illegal activity;
(c) Requests by law enforcement or government agencies;
(d) Extended periods of inactivity;
(e) Discontinuance or material modification of the Service;
(f) Unanticipated technical or security issues.

User's Right to Terminate: You may terminate your account and delete your data at any time by contacting us at support@codetimetracker.com or through the account settings in the Service. Upon your request, we will delete your account and associated data within thirty (30) days, except where retention is required by applicable law.

Effect of Termination: Upon termination of your account:
(a) Your right to access and use the Service will immediately cease;
(b) We will have no obligation to maintain or forward any data stored in your account;
(c) Any outstanding fees will become immediately due and payable;
(d) All provisions of these Terms that by their nature should survive termination shall survive, including but not limited to intellectual property provisions, disclaimers, indemnification, limitation of liability, and governing law.

Data Retention After Termination: We may retain certain data for a period of time after termination as required by applicable law, for legitimate business purposes, or to resolve disputes. Retained data will be handled in accordance with our Privacy Policy.`,
    },
    {
      id: 'governing-law',
      title: '12. Governing Law & Dispute Resolution',
      content: `Governing Law: These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States of America, without regard to its conflict of law principles.

Informal Resolution: Before initiating any formal dispute resolution proceeding, you agree to first contact us at legal@codetimetracker.com and attempt to resolve the dispute informally for a period of at least thirty (30) days.

Binding Arbitration: Any dispute, controversy, or claim arising out of or relating to these Terms, or the breach, termination, or invalidity thereof, that cannot be resolved through informal negotiation shall be finally settled by binding arbitration administered by the American Arbitration Association ("AAA") in accordance with its Commercial Arbitration Rules. The arbitration shall be conducted by a single arbitrator, and the place of arbitration shall be Wilmington, Delaware. The language of the arbitration shall be English.

Class Action Waiver: YOU AGREE THAT ANY DISPUTE RESOLUTION PROCEEDINGS WILL BE CONDUCTED ONLY ON AN INDIVIDUAL BASIS AND NOT IN A CLASS, CONSOLIDATED, OR REPRESENTATIVE ACTION. IF FOR ANY REASON A CLAIM PROCEEDS IN COURT RATHER THAN IN ARBITRATION, YOU AND THE COMPANY EACH WAIVE ANY RIGHT TO A JURY TRIAL.

Exceptions: Notwithstanding the above, either party may seek injunctive or other equitable relief in any court of competent jurisdiction to prevent the actual or threatened infringement, misappropriation, or violation of intellectual property rights.

Severability: If any provision of this dispute resolution clause is found to be unenforceable, the remaining provisions shall remain in full force and effect.`,
    },
    {
      id: 'changes-to-terms',
      title: '13. Changes to Terms',
      content: `We reserve the right to modify or update these Terms at any time at our sole discretion. When we make material changes to these Terms, we will:

(a) Update the "Last Updated" date at the top of these Terms;
(b) Provide at least thirty (30) days' advance notice of material changes via email to the address associated with your account;
(c) Post a prominent notice on the Service indicating that the Terms have been updated.

Your continued use of the Service after the effective date of any changes constitutes your acceptance of the revised Terms. If you do not agree to the revised Terms, you must stop using the Service and terminate your account before the effective date of the changes.

We encourage you to review these Terms periodically to stay informed of any updates. The version of the Terms in effect at the time of any particular use of the Service shall apply to that use.

For non-material changes (such as typographical corrections or clarifications that do not affect your rights), we may update these Terms without advance notice.`,
    },
    {
      id: 'contact-information',
      title: '14. Contact Information',
      content: `If you have any questions, concerns, or feedback regarding these Terms or the Service, please contact us at:

Email: legal@codetimetracker.com
Support: support@codetimetracker.com
Privacy: privacy@codetimetracker.com
DMCA: dmca@codetimetracker.com

Mailing Address:
Code Time Tracker, Inc.
[Address Placeholder]
[City, State, ZIP Code]
United States of America

We will make commercially reasonable efforts to respond to your inquiries within five (5) business days.`,
    },
    {
      id: 'legal-disclaimer',
      title: '15. Legal Disclaimer',
      content: `THIS DOCUMENT IS A TEMPLATE AND SHOULD BE REVIEWED BY QUALIFIED LEGAL COUNSEL BEFORE DEPLOYMENT.

The Terms of Service provided herein are intended as a starting point and general reference for the Code Time Tracker platform. While we have endeavored to address key legal considerations across multiple jurisdictions, this document:

(a) Does not constitute legal advice;
(b) May not address all applicable laws and regulations in your specific jurisdiction;
(c) Should be customized to reflect the actual practices, policies, and business operations of your organization;
(d) Must be reviewed and approved by qualified legal professionals licensed in the relevant jurisdictions before being presented to users.

The Company makes no representations or warranties regarding the legal sufficiency, enforceability, or compliance of these Terms with any applicable law. You are solely responsible for ensuring that your Terms of Service comply with all applicable laws and regulations.

We strongly recommend engaging qualified legal counsel to review and adapt these Terms to your specific circumstances, including but not limited to:

(a) Verifying compliance with local consumer protection laws;
(b) Ensuring enforceability of arbitration and class action waiver provisions;
(c) Reviewing data protection provisions for compliance with applicable privacy laws;
(d) Confirming that limitation of liability provisions are enforceable in your jurisdiction;
(e) Adapting governing law and dispute resolution provisions to your business needs.`,
    },
  ],
  disclaimer:
    'This document is a template and should be reviewed by qualified legal counsel before deployment. The Company makes no representations or warranties regarding the legal sufficiency or enforceability of these Terms.',
}

export default termsContent
