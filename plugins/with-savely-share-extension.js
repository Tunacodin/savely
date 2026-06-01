const {
  withEntitlementsPlist,
  withXcodeProject,
  withDangerousMod,
} = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const APP_GROUP = "group.com.savelyapp.savely";
const EXTENSION_NAME = "SavelyShareExtension";
const EXTENSION_BUNDLE_ID = "com.savelyapp.savely.share-extension";
const APPLE_TEAM_ID = "9XNKWD8QBV";

// Mirror of lib/supabase.ts — anon key is public, safe to embed.
const DEFAULT_SUPABASE_URL = "https://djdwolekentrczauhlpl.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZHdvbGVrZW50cmN6YXVobHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NjgwMzUsImV4cCI6MjA5MDQ0NDAzNX0.bzNWqAZA3dg7iUIr9GBMfBFk1oveJk_Q-QmWp7d-HCU";

// 1) Main app entitlements: App Group + Keychain Access Group
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

// 2) Podfile post_install: set DEVELOPMENT_TEAM on pod resource bundles
//    (fixes XCODE_RESOURCE_BUNDLE_CODE_SIGNING_ERROR in Xcode 14+ when an
//    app_extension target is added to the project)
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
      if target.respond_to?(:product_type) && target.product_type == "com.apple.product-type.bundle"
        target.build_configurations.each do |bc|
          bc.build_settings['DEVELOPMENT_TEAM'] = '${APPLE_TEAM_ID}'
          bc.build_settings['CODE_SIGN_STYLE'] = 'Automatic'
          bc.build_settings['CODE_SIGN_IDENTITY'] = 'Apple Development'
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
      console.log(
        "[savely-share-extension] Added Podfile resource bundle signing fix"
      );
      return cfg;
    },
  ]);
}

// 3) Copy extension files into ios/SavelyShareExtension/
function withCopyExtensionFiles(config) {
  return withDangerousMod(config, [
    "ios",
    async (cfg) => {
      const projectRoot = cfg.modRequest.platformProjectRoot;
      const extDir = path.join(projectRoot, EXTENSION_NAME);
      const moduleRoot = path.join(
        __dirname,
        "..",
        "modules",
        "savely-share-extension",
        "ios"
      );

      fs.mkdirSync(extDir, { recursive: true });

      // Shared/SharedStore.swift -> extDir/SharedStore.swift
      fs.copyFileSync(
        path.join(moduleRoot, "Shared", "SharedStore.swift"),
        path.join(extDir, "SharedStore.swift")
      );

      // ShareExtension/*.{swift,plist,entitlements} -> extDir
      const sourceDir = path.join(moduleRoot, "ShareExtension");
      for (const file of fs.readdirSync(sourceDir)) {
        fs.copyFileSync(path.join(sourceDir, file), path.join(extDir, file));
      }

      return cfg;
    },
  ]);
}

// 3) Create Xcode target with all Swift sources and build settings
function withExtensionTarget(config, { supabaseUrl, supabaseAnonKey }) {
  return withXcodeProject(config, (cfg) => {
    const pbx = cfg.modResults;

    const existingTarget = pbx.pbxTargetByName(EXTENSION_NAME);
    if (existingTarget) {
      console.log(
        `[savely-share-extension] Target ${EXTENSION_NAME} exists; only refreshing build settings.`
      );
      applyBuildSettings(pbx, cfg, { supabaseUrl, supabaseAnonKey });
      return cfg;
    }

    const devTeam = getMainAppDevelopmentTeam(pbx);

    const sourceFiles = [
      "SharedStore.swift",
      "ShareViewController.swift",
      "SharePickerView.swift",
      "ShareAPI.swift",
      "MetadataFetcher.swift",
    ];
    const configFiles = ["Info.plist", `${EXTENSION_NAME}.entitlements`];
    const allFiles = [...sourceFiles, ...configFiles];

    // Group
    const extGroup = pbx.addPbxGroup(allFiles, EXTENSION_NAME, EXTENSION_NAME);
    const groups = pbx.hash.project.objects.PBXGroup;
    Object.keys(groups).forEach((key) => {
      if (
        typeof groups[key] === "object" &&
        groups[key].name === undefined &&
        groups[key].path === undefined
      ) {
        pbx.addToPbxGroup(extGroup.uuid, key);
      }
    });

    // Workaround for addTarget single-target bug
    const projObjects = pbx.hash.project.objects;
    projObjects.PBXTargetDependency = projObjects.PBXTargetDependency || {};
    projObjects.PBXContainerItemProxy =
      projObjects.PBXContainerItemProxy || {};

    // Target
    const target = pbx.addTarget(
      EXTENSION_NAME,
      "app_extension",
      EXTENSION_NAME
    );

    // Build phases
    pbx.addBuildPhase(
      sourceFiles,
      "PBXSourcesBuildPhase",
      "Sources",
      target.uuid
    );
    pbx.addBuildPhase([], "PBXResourcesBuildPhase", "Resources", target.uuid);
    pbx.addBuildPhase([], "PBXFrameworksBuildPhase", "Frameworks", target.uuid);

    applyBuildSettings(pbx, cfg, { supabaseUrl, supabaseAnonKey });

    if (devTeam) {
      pbx.addTargetAttribute("DevelopmentTeam", devTeam);
      const tgt = pbx.pbxTargetByName(EXTENSION_NAME);
      pbx.addTargetAttribute("DevelopmentTeam", devTeam, tgt);
    }

    console.log(
      `[savely-share-extension] Created target ${EXTENSION_NAME} (bundle id: ${EXTENSION_BUNDLE_ID})`
    );
    return cfg;
  });
}

function applyBuildSettings(pbx, cfg, { supabaseUrl, supabaseAnonKey }) {
  const devTeam = getMainAppDevelopmentTeam(pbx);
  const configurations = pbx.pbxXCBuildConfigurationSection();
  const buildNumber = (cfg.ios && cfg.ios.buildNumber) || "1";
  const version = cfg.version || "1.0.0";

  for (const key in configurations) {
    const c = configurations[key];
    const bs = c.buildSettings;
    if (!bs || !bs.PRODUCT_NAME) continue;
    if (bs.PRODUCT_NAME !== `"${EXTENSION_NAME}"`) continue;

    bs.CLANG_ENABLE_MODULES = "YES";
    bs.INFOPLIST_FILE = `"${EXTENSION_NAME}/Info.plist"`;
    bs.CODE_SIGN_ENTITLEMENTS = `"${EXTENSION_NAME}/${EXTENSION_NAME}.entitlements"`;
    bs.CODE_SIGN_STYLE = "Automatic";
    bs.CURRENT_PROJECT_VERSION = `"${buildNumber}"`;
    bs.MARKETING_VERSION = `"${version}"`;
    bs.PRODUCT_BUNDLE_IDENTIFIER = `"${EXTENSION_BUNDLE_ID}"`;
    bs.SWIFT_VERSION = "5.0";
    bs.SWIFT_EMIT_LOC_STRINGS = "YES";
    bs.TARGETED_DEVICE_FAMILY = `"1,2"`;
    bs.IPHONEOS_DEPLOYMENT_TARGET = "15.1";
    bs.GENERATE_INFOPLIST_FILE = "NO";
    bs.SAVELY_SUPABASE_URL = `"${supabaseUrl}"`;
    bs.SAVELY_SUPABASE_ANON_KEY = `"${supabaseAnonKey}"`;
    if (devTeam) bs.DEVELOPMENT_TEAM = devTeam;
  }
}

function getMainAppDevelopmentTeam(pbx) {
  const configs = pbx.pbxXCBuildConfigurationSection();
  for (const key in configs) {
    const c = configs[key];
    const bs = c.buildSettings;
    if (!bs || !bs.PRODUCT_NAME) continue;
    const productName = bs.PRODUCT_NAME.replace(/"/g, "");
    if (
      productName.includes("Extension") ||
      productName.includes("Widget")
    ) {
      continue;
    }
    const devTeam = bs.DEVELOPMENT_TEAM
      ? bs.DEVELOPMENT_TEAM.replace(/"/g, "")
      : undefined;
    if (devTeam) return devTeam;
  }
  return null;
}

module.exports = function withSavelyShareExtension(config, props) {
  const p = props || {};
  const supabaseUrl = p.supabaseUrl || DEFAULT_SUPABASE_URL;
  const supabaseAnonKey = p.supabaseAnonKey || DEFAULT_SUPABASE_ANON_KEY;

  config = withMainAppEntitlements(config);
  config = withResourceBundleSigningFix(config);
  config = withCopyExtensionFiles(config);
  config = withExtensionTarget(config, { supabaseUrl, supabaseAnonKey });
  return config;
};
