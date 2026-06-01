const {
  withEntitlementsPlist,
  withXcodeProject,
  withDangerousMod,
} = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

// expo-share-intent's default extension name + group + bundle id
const EXTENSION_NAME = "ShareExtension";
const APP_GROUP = "group.com.savelyapp.savely";
const APPLE_TEAM_ID = "9XNKWD8QBV";

// Mirror of lib/supabase.ts — anon key is public, safe to embed at build time.
const DEFAULT_SUPABASE_URL = "https://djdwolekentrczauhlpl.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZHdvbGVrZW50cmN6YXVobHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NjgwMzUsImV4cCI6MjA5MDQ0NDAzNX0.bzNWqAZA3dg7iUIr9GBMfBFk1oveJk_Q-QmWp7d-HCU";

// Custom Swift files (in addition to ShareViewController.swift which we override)
const CUSTOM_SWIFT_FILES = [
  "SharedStore.swift",
  "SharePickerView.swift",
  "ShareAPI.swift",
  "MetadataFetcher.swift",
];

// 1) Main app entitlements: add Keychain Access Group (expo-share-intent already
//    adds App Group, but Keychain is needed for SharedStore session reads).
function withMainAppEntitlements(config) {
  return withEntitlementsPlist(config, async (cfg) => {
    const e = cfg.modResults;
    const groups = e["com.apple.security.application-groups"] || [];
    if (!groups.includes(APP_GROUP)) {
      e["com.apple.security.application-groups"] = [...groups, APP_GROUP];
    }
    const kc = e["keychain-access-groups"] || [];
    const kcEntry = `$(AppIdentifierPrefix)${APP_GROUP}`;
    if (!kc.includes(kcEntry)) {
      e["keychain-access-groups"] = [...kc, kcEntry];
    }
    return cfg;
  });
}

// 2) Podfile post_install: disable signing on pod resource bundles
//    (fixes XCODE_RESOURCE_BUNDLE_CODE_SIGNING_ERROR in Xcode 14+)
function withResourceBundleSigningFix(config) {
  return withDangerousMod(config, [
    "ios",
    async (cfg) => {
      const podfilePath = path.join(
        cfg.modRequest.platformProjectRoot,
        "Podfile"
      );
      if (!fs.existsSync(podfilePath)) return cfg;
      let podfile = fs.readFileSync(podfilePath, "utf8");
      const MARKER_START = "# >>> SAVELY_RESOURCE_BUNDLE_SIGNING_FIX";
      const MARKER_END = "# <<< SAVELY_RESOURCE_BUNDLE_SIGNING_FIX";
      if (podfile.includes(MARKER_START)) return cfg;

      const snippet = `
    ${MARKER_START}
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |bc|
        if target.respond_to?(:product_type) && target.product_type == "com.apple.product-type.bundle"
          bc.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'
          bc.build_settings['CODE_SIGNING_REQUIRED'] = 'NO'
          bc.build_settings['CODE_SIGN_IDENTITY'] = ''
          bc.build_settings['EXPANDED_CODE_SIGN_IDENTITY'] = ''
          bc.build_settings['DEVELOPMENT_TEAM'] = '${APPLE_TEAM_ID}'
        end
      end
    end
    ${MARKER_END}
`;

      if (podfile.includes("post_install do |installer|")) {
        podfile = podfile.replace(
          /post_install do \|installer\|/,
          `post_install do |installer|${snippet}`
        );
      } else {
        podfile += `\npost_install do |installer|${snippet}end\n`;
      }
      fs.writeFileSync(podfilePath, podfile, "utf8");
      return cfg;
    },
  ]);
}

// Note: on iOS, mod-compiler precedences are dangerous=-2 < xcodeproj=-1,
// so withDangerousMod runs BEFORE withXcodeProject. That means we can't
// override ShareExtension/* files in a dangerous mod — they don't exist yet
// when dangerous runs. The override lives in step 4 (withXcodeProject), which
// runs after expo-share-intent has generated the target's files on disk.

function patchInfoPlist(extDir) {
  const candidates = ["ShareExtension-Info.plist", "Info.plist"];
  const plistPath = candidates
    .map((f) => path.join(extDir, f))
    .find((p) => fs.existsSync(p));
  if (!plistPath) {
    console.warn("[savely-share-extension] Could not find ShareExtension Info.plist");
    return;
  }
  let content = fs.readFileSync(plistPath, "utf8");
  if (content.includes("SavelySupabaseUrl")) return;

  const inject = `	<key>SavelySupabaseUrl</key>
	<string>${DEFAULT_SUPABASE_URL}</string>
	<key>SavelySupabaseAnonKey</key>
	<string>${DEFAULT_SUPABASE_ANON_KEY}</string>
</dict>
</plist>`;
  content = content.replace(/<\/dict>\s*<\/plist>\s*$/, inject);
  fs.writeFileSync(plistPath, content, "utf8");
}

function patchEntitlements(extDir) {
  const candidates = ["ShareExtension.entitlements"];
  const plistPath = candidates
    .map((f) => path.join(extDir, f))
    .find((p) => fs.existsSync(p));
  if (!plistPath) {
    console.warn(
      "[savely-share-extension] Could not find ShareExtension.entitlements"
    );
    return;
  }
  let content = fs.readFileSync(plistPath, "utf8");
  if (content.includes("keychain-access-groups")) return;

  const inject = `	<key>keychain-access-groups</key>
	<array>
		<string>$(AppIdentifierPrefix)${APP_GROUP}</string>
	</array>
</dict>
</plist>`;
  content = content.replace(/<\/dict>\s*<\/plist>\s*$/, inject);
  fs.writeFileSync(plistPath, content, "utf8");
}

// 4) Override files + register additional Swift sources in one xcodeproj mod.
//    Runs AFTER expo-share-intent's withXcodeProject (plugin ordering in
//    app.json), so by this point ShareExtension/ exists on disk with
//    expo-share-intent's generated ShareViewController.swift, Info.plist, and
//    entitlements. We overwrite the Swift VC, copy 4 extra Swift sources,
//    patch Info.plist/entitlements, and register the extra sources in pbxproj.
function withShareExtensionCustomization(config) {
  return withXcodeProject(config, (cfg) => {
    const platformRoot = cfg.modRequest.platformProjectRoot;
    const extDir = path.join(platformRoot, EXTENSION_NAME);
    const moduleRoot = path.join(
      __dirname,
      "..",
      "modules",
      "savely-share-extension",
      "ios"
    );

    if (!fs.existsSync(extDir)) {
      console.warn(
        `[savely-share-extension] ${EXTENSION_NAME}/ not found; expo-share-intent should have generated it.`
      );
      return cfg;
    }

    // Overwrite the generated ShareViewController.swift with our SwiftUI picker
    fs.copyFileSync(
      path.join(moduleRoot, "ShareExtension", "ShareViewController.swift"),
      path.join(extDir, "ShareViewController.swift")
    );

    // Copy additional Swift sources into the target's directory
    fs.copyFileSync(
      path.join(moduleRoot, "Shared", "SharedStore.swift"),
      path.join(extDir, "SharedStore.swift")
    );
    for (const file of ["SharePickerView.swift", "ShareAPI.swift", "MetadataFetcher.swift"]) {
      fs.copyFileSync(
        path.join(moduleRoot, "ShareExtension", file),
        path.join(extDir, file)
      );
    }

    // Patch Info.plist with Supabase config (read by Bundle.main.object in extension)
    patchInfoPlist(extDir);

    // Patch entitlements with Keychain Access Group (shared with main app)
    patchEntitlements(extDir);

    // Register the 4 extra Swift sources in pbxproj so they compile into the target
    const pbx = cfg.modResults;
    const target = pbx.pbxTargetByName(EXTENSION_NAME);
    if (!target) {
      console.warn(
        `[savely-share-extension] Target ${EXTENSION_NAME} not found in pbxproj`
      );
      return cfg;
    }

    const groups = pbx.hash.project.objects.PBXGroup;
    let extGroupUUID = null;
    for (const uuid in groups) {
      const g = groups[uuid];
      if (typeof g === "object" && g.name === EXTENSION_NAME) {
        extGroupUUID = uuid;
        break;
      }
    }
    if (!extGroupUUID) {
      console.warn(
        `[savely-share-extension] PBXGroup ${EXTENSION_NAME} not found`
      );
      return cfg;
    }

    const existingGroup = groups[extGroupUUID];
    const existingChildren = (existingGroup.children || []).map((c) =>
      typeof c === "object" ? (c.comment || c.value) : c
    );

    let added = 0;
    for (const file of CUSTOM_SWIFT_FILES) {
      if (existingChildren.some((c) => c && c.includes(file))) continue;
      try {
        pbx.addSourceFile(file, { target: target.uuid }, extGroupUUID);
        added++;
      } catch (e) {
        console.warn(
          `[savely-share-extension] Failed to add ${file}: ${e.message}`
        );
      }
    }

    console.log(
      `[savely-share-extension] Overrode ShareViewController.swift, copied ${CUSTOM_SWIFT_FILES.length - 1} extra sources, added ${added} to pbxproj`
    );
    return cfg;
  });
}

module.exports = function withSavelyShareExtension(config) {
  config = withMainAppEntitlements(config);
  config = withResourceBundleSigningFix(config);
  config = withShareExtensionCustomization(config);
  return config;
};
