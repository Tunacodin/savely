const { withAndroidManifest, withDangerousMod, AndroidConfig } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const SHARE_TARGET_CATEGORY = "com.savelyapp.savely.category.SHARE_TARGET";
const SAVE_TARGET_CLASS = "expo.modules.sharingshortcuts.SaveTargetActivity";

const SHORTCUTS_XML = `<?xml version="1.0" encoding="utf-8"?>
<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">
    <share-target android:targetClass="${SAVE_TARGET_CLASS}">
        <data android:mimeType="text/plain" />
        <data android:mimeType="text/*" />
        <category android:name="${SHARE_TARGET_CATEGORY}" />
    </share-target>
</shortcuts>
`;

function withShortcutsXml(config) {
  return withDangerousMod(config, [
    "android",
    async (cfg) => {
      const xmlDir = path.join(cfg.modRequest.platformProjectRoot, "app", "src", "main", "res", "xml");
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(path.join(xmlDir, "shortcuts.xml"), SHORTCUTS_XML, "utf8");
      return cfg;
    },
  ]);
}

function withShortcutsMeta(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    const mainActivity = app.activity?.find(
      (a) => a.$["android:name"] === ".MainActivity"
    );
    if (!mainActivity) return cfg;

    mainActivity["meta-data"] = mainActivity["meta-data"] ?? [];
    const existing = mainActivity["meta-data"].find(
      (m) => m.$["android:name"] === "android.app.shortcuts"
    );
    if (!existing) {
      mainActivity["meta-data"].push({
        $: {
          "android:name": "android.app.shortcuts",
          "android:resource": "@xml/shortcuts",
        },
      });
    }
    return cfg;
  });
}

module.exports = function withAndroidSharingShortcuts(config) {
  config = withShortcutsXml(config);
  config = withShortcutsMeta(config);
  return config;
};
