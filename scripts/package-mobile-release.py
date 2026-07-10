#!/usr/bin/env python3
"""
Package the ReplyOS Flutter mobile project into a ZIP and upload to GitHub
as a release asset. Excludes build artifacts (.dart_tool, build/, etc.) to
keep the archive small.
"""

import os
import sys
import zipfile
import time
import json
from urllib.request import Request, urlopen
from urllib.error import HTTPError

# ===== Configuration =====
GITHUB_TOKEN = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
if not GITHUB_TOKEN:
    sys.exit("ERROR: Set GH_TOKEN environment variable before running this script.")

REPO_OWNER = "mcvsupportes-dev"
REPO_NAME = "replyos"
MOBILE_DIR = "/home/z/my-project/mobile"
OUTPUT_ZIP = "/home/z/my-project/download/replyos-mobile-source.zip"
RELEASE_TAG = f"v{time.strftime('%Y.%m.%d-%H%M')}"
RELEASE_NAME = f"ReplyOS Mobile Source (Build-all-devices) {RELEASE_TAG}"
RELEASE_BODY = """# ReplyOS Mobile App — Source Code + Build Instructions

## Contents
- Complete Flutter source code (lib/, android/, web/, assets/)
- pubspec.yaml + pubspec.lock
- BUILD_INSTRUCTIONS.md — step-by-step for APK / AAB / iOS / Web
- Pre-built APK for arm64 (modern Android phones)

## Build for All Devices (Fat APK)
```bash
flutter pub get
flutter build apk --release --no-tree-shake-icons
```
Output: `build/app/outputs/flutter-apk/app-release.apk` (~10 MB, runs on any Android)

## Per-ABI APKs (Smaller per-device)
```bash
flutter build apk --release --split-per-abi --no-tree-shake-icons
```

## Google Play AAB
```bash
flutter build appbundle --release --no-tree-shake-icons
```

See **BUILD_INSTRUCTIONS.md** inside the ZIP for full details (iOS, web, troubleshooting).

## Backend
- Dashboard: https://replyos-bbbmu.vercel.app
- Admin login: admin@replyos.com / ReplyOS2025!
- WhatsApp bridge: http://13.60.186.223

## Admin Credentials
- Email: admin@replyos.com
- Password: ReplyOS2025!
"""

# Directories and files to EXCLUDE from the ZIP (build artifacts / caches)
EXCLUDE_DIRS = {
    "build",
    ".dart_tool",
    ".gradle",
    ".idea",
    ".vscode",
    "android/.gradle",
    "android/build",
    "android/app/build",
    "android/app/.cxx",
    "ios/Pods",
    "ios/Flutter/Flutter.framework",
    "macos/Pods",
    "linux/flutter/ephemeral",
    "windows/flutter/ephemeral",
    ".fvm",
    ".symlinks",
}
EXCLUDE_FILES = {
    ".DS_Store",
    "Thumbs.db",
    ".flutter-plugins",
    ".flutter-plugins-dependencies",
}


def should_exclude(path: str) -> bool:
    parts = []
    head = path
    while head:
        head, tail = os.path.split(head)
        if tail:
            parts.insert(0, tail)
    for i in range(len(parts)):
        subpath = "/".join(parts[: i + 1])
        if subpath in EXCLUDE_DIRS:
            return True
    fname = parts[-1] if parts else path
    if fname in EXCLUDE_FILES:
        return True
    if fname.endswith(".log"):
        return True
    return False


def make_zip() -> int:
    print(f">>> Creating ZIP at {OUTPUT_ZIP}")
    os.makedirs(os.path.dirname(OUTPUT_ZIP), exist_ok=True)
    if os.path.exists(OUTPUT_ZIP):
        os.remove(OUTPUT_ZIP)

    root = MOBILE_DIR
    arc_prefix = "replyos-mobile-source"
    count = 0
    total_size = 0

    with zipfile.ZipFile(OUTPUT_ZIP, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for dirpath, dirnames, filenames in os.walk(root):
            # prune excluded dirs in-place (faster than visiting then skipping)
            rel_dir = os.path.relpath(dirpath, root)
            dirnames[:] = [
                d for d in dirnames
                if not should_exclude(
                    os.path.join(rel_dir, d) if rel_dir != "." else d
                )
            ]
            for fname in filenames:
                rel_path = os.path.join(rel_dir, fname) if rel_dir != "." else fname
                if should_exclude(rel_path):
                    continue
                abs_path = os.path.join(dirpath, fname)
                arcname = f"{arc_prefix}/{rel_path}"
                zf.write(abs_path, arcname)
                count += 1
                total_size += os.path.getsize(abs_path)

    out_size = os.path.getsize(OUTPUT_ZIP)
    print(f"    Files: {count}")
    print(f"    Source size: {total_size / 1024 / 1024:.1f} MB")
    print(f"    ZIP size:    {out_size / 1024 / 1024:.1f} MB")
    return out_size


def api(method, url, body=None, binary=False, content_type="application/json"):
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if body is not None and not binary:
        body = json.dumps(body).encode()
    elif body is not None and binary:
        headers["Content-Type"] = content_type
    req = Request(url, data=body, method=method, headers=headers)
    try:
        with urlopen(req) as r:
            data = r.read()
            status = r.status
            ct = r.headers.get("Content-Type", "")
            if "application/json" in ct:
                return status, json.loads(data.decode() or "null")
            return status, data
    except HTTPError as e:
        err_body = e.read().decode() if e.fp else ""
        try:
            err_json = json.loads(err_body)
        except Exception:
            err_json = err_body
        return e.code, err_json


def create_release():
    print(f"\n>>> Creating release {RELEASE_TAG}")
    status, data = api(
        "POST",
        f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/releases",
        body={
            "tag_name": RELEASE_TAG,
            "target_commitish": "main",
            "name": RELEASE_NAME,
            "body": RELEASE_BODY,
            "draft": False,
            "prerelease": False,
        },
    )
    if status not in (200, 201):
        print(f"    Failed: {status}\n{json.dumps(data, indent=2)[:500]}")
        sys.exit("Release creation failed.")
    upload_url = data["upload_url"].split("{")[0]
    html_url = data["html_url"]
    print(f"    HTML URL: {html_url}")
    return upload_url, html_url


def upload_asset(upload_url, file_path, asset_name, label):
    size = os.path.getsize(file_path)
    print(f"\n>>> Uploading {asset_name} ({size:,} bytes)")
    with open(file_path, "rb") as f:
        data_bytes = f.read()
    status, data = api(
        "POST",
        f"{upload_url}?name={asset_name}&label={label}",
        body=data_bytes,
        binary=True,
        content_type="application/zip",
    )
    if status not in (200, 201):
        print(f"    Failed: {status}\n{json.dumps(data, indent=2)[:500]}")
        sys.exit("Asset upload failed.")
    print(f"    Download: {data.get('browser_download_url')}")
    return data.get("browser_download_url")


def main():
    print("=" * 60)
    print("ReplyOS Mobile Source — ZIP + GitHub Release")
    print("=" * 60)

    zip_size = make_zip()
    upload_url, html_url = create_release()

    zip_url = upload_asset(
        upload_url,
        OUTPUT_ZIP,
        f"replyos-mobile-source-{RELEASE_TAG}.zip",
        "Source%20Code%20ZIP",
    )

    # Also include the prebuilt APK in this release for convenience
    apk_path = "/home/z/my-project/mobile/build/app/outputs/flutter-apk/app-release.apk"
    apk_url = None
    if os.path.exists(apk_path):
        apk_url = upload_asset(
            upload_url,
            apk_path,
            f"replyos-arm64-{RELEASE_TAG}.apk",
            "Prebuilt%20APK%20(arm64)",
        )

    print("\n" + "=" * 60)
    print("✓ DONE")
    print("=" * 60)
    print(f"Release page : {html_url}")
    print(f"ZIP download : {zip_url}")
    if apk_url:
        print(f"APK (arm64)  : {apk_url}")
    print(f"ZIP size     : {zip_size / 1024 / 1024:.1f} MB")
    print("=" * 60)


if __name__ == "__main__":
    main()
