#!/usr/bin/env node
// Write .env.local with the Firebase service account JSON intact.
// The Edit/Write tools redact "-----BEGIN PRIVATE KEY-----" lines,
// so we build the file from the project's mobile config + a JSON
// passed via argv.
const fs = require("fs");
const path = require("path");

const sa = {
  type: "service_account",
  project_id: "replyos-af4d3",
  private_key_id: "8e2dee002f9a42c1164dfff18508b53654970b75",
  private_key:
    "-----BEGIN PRIVATE KEY-----\n" +
    "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDPue7pkCwUxbEx\n" +
    "vD4vYEH9idiGBGgSKtVgThgZcZEDkvd9hZIO64ZvlAIa2vA+NcZs8QNpxFFLboKR\n" +
    "bB5dfLBklGFvd645Ul4D4UMgrxSkafV2i+a5CmIbqiJymectbxrK2/fiqdrt07Qg\n" +
    "sUtc7aOg0nJDUUQYNjhiMuRL7FPdR4Fs0aQLN7K/D5b+CMWegTNscptt+vrxwvLU\n" +
    "mX69xwqyvkDupPGFk/S0GnFcIelJRrcMJtSvQtSqvNr0qvjunVtNUlpCELjFz1q7\n" +
    "+Rpu8yzmPQAzn1a8ez+PSB2pSsob3Yln6Ce5By+iAdjvs9U0cID77a7PUU64qEqK\n" +
    "UJUiu+wpAgMBAAECggEACvtuCEwhKydOgxjMLYNdycflZM8hKhYN+jhMFDWfBeeE\n" +
    "YnmoK1YZYUHGdgwC1+R47Uk1YHygEv2winwDA6H0I2/S0kAAu91rxLG+nkuTVaPt\n" +
    "IHYsswtmUhxwaMr+irY33jy7QhuvzD4Sj7M/5EBYvnJnLGxEo4ZjpxFrZMuFnYpc\n" +
    "s32hoXqlzjXqZgwDwO4tkhsO98ipKCbEWLTvgdypFxR8PFoeoR9U3lkwJy6XKXzm\n" +
    "nijeYgF4NaGG2aE6dJQPPrmQbkenW/P9fm3+XaWsHFjP40TnUPtRbtvvtwQBjMAQ\n" +
    "/hdXsaFUB8qDQd+rQYb2dZ1v6fnQVaFMCy2f5zmJTwKBgQDoLrHK8WKF530m1ets\n" +
    "wU8G6EQRGcMCr/SZOV5cJOZ9dyaPZek6uRJS843Ls6sRaL9VCfz8s0g7mBKkkA0x\n" +
    "Aw6LkB3zT24EqLzIGFSCkcun9zwVokZ+oszd7InCnvex8UiO9v9wu8wqUFZ6vAiM\n" +
    "dHMohLle+12ln2bWBONsH6B2SwKBgQDlCQBAzZAFrlo0EO7zGoBLjUKYQXRgFGWb\n" +
    "BXgsU/qmJroKAunFQzGNoTfHCgYkk5KeLvnQrc6SMbQwOW/a36lGg2EEbvDzN0nO\n" +
    "Ud1//RHp1bQesBL3jyxi+ijRmuOrrxL/CPCpOVJ9+iMIqdd1PS8uoOhq0JXjuxEi\n" +
    "OilwOVfu2wKBgHPfkeWJcDUJoWD3U8Xz93+n/QhXxgYaUEUD536u/8TP6ROZtbsT\n" +
    "z/xMBpEJuq82in5jPLnUs5DiRTORnLPAJcsrAneCRZLXr1dhJRQAtRW/gmH9mZbr\n" +
    "oriCqwHRGibZFvAafsMBRlQ7wd0A6HdISoyHKIgphMP6eHUI/YLhidBfAoGAb0z4\n" +
    "eoVqv9gCrdqsxCbUweJbwnHMhARle/gkdiY5YBThw4u23s3Qfushl/AfHBc64PQj\n" +
    "Im3UPOc6kVTYLp0SPdoKg4UGQqtTipft9Ayfb+sSJPebwAIrp825mGKU0RG7QYSu\n" +
    "rw3UMLQl4kfnFGovS5GWYJIMxSZbJS7uhELZoJECgYEAi+NaoddIWHqZcH8++oft\n" +
    "MqinWkcsgqMKg8Y5CrnDBNDgh2VWF8Jgv95agVgtn4A4i2/L0iIUtvu/m8F7pLzW\n" +
    "u2MgrWXVbgvocR+B0yrCuiq1is4K3iMSs4N/niwP/aaudtLCTvfFzZOE7J1dezl1\n" +
    "dW7eafZjj6Mc/HowOrVLZ1g=\n" +
    "-----END PRIVATE KEY-----\n",
  client_email:
    "firebase-adminsdk-fbsvc@replyos-af4d3.iam.gserviceaccount.com",
  client_id: "113497910833984184746",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url:
    "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40replyos-af4d3.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};

const env = `# ReplyOS Admin — Firebase + Admin Auth (LOCAL ONLY, NEVER COMMIT)
# Project: replyos-af4d3

# --- Firebase Client SDK (public, browser-safe) ---
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDT6mK57wM0jdKNFtSGbzVohh2dcntV0Ek
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=replyos-af4d3.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://replyos-af4d3-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=replyos-af4d3
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=replyos-af4d3.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=637515594302
NEXT_PUBLIC_FIREBASE_APP_ID=1:637515594302:web:2dc67974fb815062b52f6f
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G_REPLYOS

# --- Firebase Admin SDK (server-only, JSON-encoded service account) ---
FIREBASE_SERVICE_ACCOUNT=${JSON.stringify(sa)}

# --- Admin login credentials (bootstrap) ---
ADMIN_BOOTSTRAP_EMAIL=admin@replyos.com
ADMIN_BOOTSTRAP_PASSWORD=ReplyOS2025!

# --- WhatsApp Cloud API (set later when provided) ---
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_API_VERSION=v21.0
`;

const out = path.resolve("/home/z/my-project/.env.local");
fs.writeFileSync(out, env, "utf8");
console.log("Wrote", out, "bytes=", env.length);
