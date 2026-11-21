# NAEL Mobile PWA — public-safe shell

This is an iPhone-friendly static PWA with quick links into the **owner-controlled private Google Sheets**, Outlook, Meta Business, and freelance sources.

**Security:** no WhatsApp/Meta API tokens, customer names, telephone numbers, conversation content, or Google Sheet data are embedded in the published HTML. The link to a private Google spreadsheet is only a reference and remains controlled by Google Drive ACLs. The app does not mirror data or send outbound messages.

**Capabilities:** install to iPhone Home Screen with Safari Share > Add to Home Screen; quick navigation to sheets/tabs, Outlook, and Meta; edit spreadsheet URL locally. No dedicated OAuth flow required for shell itself. Linked services still require their own authorized sign-ins.

**Not supported:** automated WhatsApp inbox integration, real-time direct Google Sheets data in the shell, autonomous emails, backend authentication or deal payment confirmation. These require a separate protected backend and explicit owner permissions.

This lives on a non-default branch to avoid modifying the existing project's main code.
