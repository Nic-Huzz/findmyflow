/**
 * electron-builder configuration for Vibe Rise desktop app.
 * @type {import('electron-builder').Configuration}
 */

const hasNotarizationCreds =
  !!process.env.APPLE_ID &&
  !!(process.env.APPLE_ID_PASSWORD || process.env.APPLE_APP_SPECIFIC_PASSWORD) &&
  !!process.env.APPLE_TEAM_ID

module.exports = {
  appId: 'com.nichuzz.viberise',
  productName: 'Vibe Rise',
  directories: {
    output: 'electron-dist',
  },
  files: [
    'dist/**/*',
    'server/**/*',
    'electron/**/*',
    'node_modules/**/*',
    'package.json',
  ],
  mac: {
    category: 'public.app-category.business',
    target: [
      { target: 'dmg', arch: ['arm64', 'x64'] },
    ],
    icon: 'electron/icons/icon.icns',
    artifactName: 'Vibe-Rise-mac-${arch}.dmg',
    hardenedRuntime: hasNotarizationCreds,
    gatekeeperAssess: false,
    entitlements: hasNotarizationCreds ? 'electron/entitlements.mac.plist' : undefined,
    entitlementsInherit: hasNotarizationCreds ? 'electron/entitlements.mac.plist' : undefined,
    notarize: hasNotarizationCreds,
  },
  win: {
    target: ['nsis'],
    icon: 'electron/icons/icon.ico',
    artifactName: 'Vibe-Rise-Setup.exe',
  },
  dmg: {
    title: 'Vibe Rise',
    contents: [
      { x: 130, y: 220 },
      { x: 410, y: 220, type: 'link', path: '/Applications' },
    ],
  },
  nsis: {
    oneClick: true,
    allowToChangeInstallationDirectory: false,
  },
}
