
export const {
  apiUrl,
  appUpdated,
  blockManifests,
  definition,
  id: appId,
  languages,
  logins,
  sentryDsn,
  sentryEnvironment,
  showAppsembleLogin,
  showAppsembleOAuth2Login,
  vapidPublicKey,
} = window.settings;
delete window.settings;