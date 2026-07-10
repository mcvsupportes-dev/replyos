#!/usr/bin/env python3
"""
ReplyOS GitHub Release Script
- Pushes all project code to GitHub
- Creates a new release with the latest APK as a release asset
- Prints admin credentials and download URLs

Uses GitHub REST API (no git CLI auth required).
"""

import os
import sys
import json
import base64
import subprocess
import time
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

# ===== Configuration =====
# Token is read from env var GH_TOKEN (never hard-code secrets in source files —
# GitHub Push Protection will reject the push otherwise).
GITHUB_TOKEN = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
if not GITHUB_TOKEN:
    sys.exit("ERROR: Set GH_TOKEN environment variable before running this script.")
REPO_OWNER = "mcvsupportes-dev"
REPO_NAME = "replyos"
PROJECT_DIR = "/home/z/my-project"
APK_PATH = "/home/z/my-project/mobile/build/app/outputs/flutter-apk/app-release.apk"
RELEASE_TAG = f"v{time.strftime('%Y.%m.%d-%H%M')}"
RELEASE_NAME = f"ReplyOS Mobile App + Dashboard {RELEASE_TAG}"
RELEASE_BODY = """# ReplyOS Release

## Mobile App (APK)
- Flutter app with WhatsApp bridge integration
- Firebase Auth (email + Google)
- Subscription plans synced with dashboard
- Real WhatsApp pairing via bridge (8-digit code)
- Send/receive messages through bridge

## Dashboard (Next.js)
- Admin panel for managing users, plans, WhatsApp bridge
- Public APIs for mobile app (auth, plans, whatsapp)
- Firebase Admin SDK integration
- Deployed on Vercel

## Admin Login
- Email: admin@replyos.com
- Password: ReplyOS2025!

## WhatsApp Bridge
- Deployed on Ubuntu 26.04 AWS EC2 (13.60.186.223)
- PM2 + Nginx reverse proxy
- API key required for all endpoints
"""

ADMIN_EMAIL = "admin@replyos.com"
ADMIN_PASSWORD = "ReplyOS2025!"


def api(method, url, body=None, binary=False, content_type="application/json"):
    """Call GitHub REST API."""
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


def step(msg):
    print(f"\n>>> {msg}")


def push_code():
    """Ensure remote uses current token, then push main."""
    step("Updating git remote with current token")
    new_url = f"https://{REPO_OWNER}:{GITHUB_TOKEN}@github.com/{REPO_OWNER}/{REPO_NAME}.git"
    subprocess.run(
        ["git", "remote", "set-url", "origin", new_url],
        cwd=PROJECT_DIR, check=True, capture_output=True,
    )
    print("    Remote URL updated.")

    step("Checking git status")
    status = subprocess.run(
        ["git", "status", "--short"],
        cwd=PROJECT_DIR, capture_output=True, text=True, check=True,
    ).stdout.strip()
    if status:
        print(f"    Uncommitted changes:\n{status}")
        subprocess.run(["git", "add", "-A"], cwd=PROJECT_DIR, check=True)
        subprocess.run(
            ["git", "commit", "-m", f"chore: release {RELEASE_TAG}"],
            cwd=PROJECT_DIR, check=True, capture_output=True,
        )
        print("    Committed.")
    else:
        print("    Working tree clean.")

    step("Pushing to GitHub")
    result = subprocess.run(
        ["git", "push", "-u", "origin", "main"],
        cwd=PROJECT_DIR, capture_output=True, text=True,
    )
    if result.returncode != 0:
        print(f"    STDOUT: {result.stdout}")
        print(f"    STDERR: {result.stderr}")
        # Maybe main doesn't exist upstream yet — try `git push origin HEAD:main`
        result2 = subprocess.run(
            ["git", "push", "origin", "HEAD:main"],
            cwd=PROJECT_DIR, capture_output=True, text=True,
        )
        print(f"    Retry: rc={result2.returncode}")
        print(f"    STDERR: {result2.stderr}")
        if result2.returncode != 0:
            sys.exit("Push failed.")
    print("    Push OK.")


def create_release():
    """Create a new GitHub release; return (release_id, upload_url, html_url)."""
    step(f"Creating release {RELEASE_TAG}")
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
    rid = data["id"]
    upload_url = data["upload_url"].split("{")[0]
    html_url = data["html_url"]
    print(f"    Release ID: {rid}")
    print(f"    HTML URL:   {html_url}")
    return rid, upload_url, html_url


def upload_apk(upload_url):
    """Upload the APK as a release asset."""
    step(f"Uploading APK ({os.path.getsize(APK_PATH)} bytes)")
    if not os.path.exists(APK_PATH):
        sys.exit(f"APK not found: {APK_PATH}")
    with open(APK_PATH, "rb") as f:
        apk_bytes = f.read()
    asset_name = f"replyos-{RELEASE_TAG}.apk"
    status, data = api(
        "POST",
        f"{upload_url}?name={asset_name}&label=ReplyOS%20Android%20APK",
        body=apk_bytes,
        binary=True,
        content_type="application/vnd.android.package-archive",
    )
    if status not in (200, 201):
        print(f"    Failed: {status}\n{json.dumps(data, indent=2)[:500]}")
        sys.exit("APK upload failed.")
    print(f"    Asset ID:   {data.get('id')}")
    print(f"    Asset name: {data.get('name')}")
    print(f"    Download:   {data.get('browser_download_url')}")
    return data.get("browser_download_url")


def main():
    print("=" * 60)
    print("ReplyOS GitHub Release Script")
    print(f"Repo:   {REPO_OWNER}/{REPO_NAME}")
    print(f"Tag:    {RELEASE_TAG}")
    print(f"APK:    {APK_PATH}")
    print("=" * 60)

    push_code()
    rid, upload_url, html_url = create_release()
    apk_url = upload_apk(upload_url)

    print("\n" + "=" * 60)
    print("✓ RELEASE PUBLISHED")
    print("=" * 60)
    print(f"Release page : {html_url}")
    print(f"APK download : {apk_url}")
    print(f"Admin email  : {ADMIN_EMAIL}")
    print(f"Admin pass   : {ADMIN_PASSWORD}")
    print(f"Dashboard    : https://replyos-bbbmu.vercel.app")
    print("=" * 60)


if __name__ == "__main__":
    main()
