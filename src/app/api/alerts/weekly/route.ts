import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// This route is invoked by Vercel Cron (configure in vercel.json)
// Schedule: 0 9 * * 1 (Every Monday at 9am UTC)
export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron call (Vercel adds this header)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceClient();
  const now = new Date();

  try {
    // 1. Delete expired scan history (older than 30 days)
    await serviceClient
      .from("scan_history")
      .delete()
      .lt("expires_at", now.toISOString());

    // 2. Find users who want weekly email alerts
    const { data: users } = await serviceClient
      .from("user_usage")
      .select("user_id, plan, email_alerts, slack_webhook, weekly_scan_enabled")
      .eq("weekly_scan_enabled", true)
      .neq("plan", "free");

    if (!users || users.length === 0) {
      return NextResponse.json({ processed: 0, message: "No users need weekly scans" });
    }

    let processed = 0;
    for (const user of users) {
      try {
        // Get their latest scan
        const { data: lastScan } = await serviceClient
          .from("scan_history")
          .select("compliance_score, issues_found, critical_count, created_at")
          .eq("user_id", user.user_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!lastScan) continue;

        // Send email alert if configured
        if (user.email_alerts) {
          const { data: authUser } = await serviceClient.auth.admin.getUserById(user.user_id);
          const email = authUser?.user?.email;

          if (email) {
            // Use Supabase Edge Functions or external email service
            await sendWeeklyEmailAlert(email, {
              score: lastScan.compliance_score,
              issuesFound: lastScan.issues_found,
              criticalCount: lastScan.critical_count,
              lastScanDate: lastScan.created_at,
            });
          }
        }

        // Send Slack webhook if configured
        if (user.slack_webhook) {
          await sendSlackAlert(user.slack_webhook, {
            score: lastScan.compliance_score,
            issuesFound: lastScan.issues_found,
            criticalCount: lastScan.critical_count,
          });
        }

        processed++;
      } catch (err) {
        console.error(`Failed to process weekly alert for user ${user.user_id}:`, err);
      }
    }

    return NextResponse.json({ processed, timestamp: now.toISOString() });
  } catch (error) {
    console.error("Weekly alerts cron error:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}

async function sendWeeklyEmailAlert(
  email: string,
  data: { score: number; issuesFound: number; criticalCount: number; lastScanDate: string }
) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;
  const scoreColor = data.score >= 80 ? "🟢" : data.score >= 50 ? "🟡" : "🔴";

  // Use Resend API for transactional email
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping email alert");
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "List Guard <alerts@listguard.app>",
      to: email,
      subject: `${scoreColor} Weekly Compliance Report — Score: ${data.score}/100`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h1 style="color: #0ea5e9;">List Guard Weekly Report</h1>
          <div style="background: #0f172a; border-radius: 12px; padding: 24px; color: white; margin: 16px 0;">
            <h2 style="margin: 0; font-size: 48px; color: ${data.score >= 80 ? '#10b981' : data.score >= 50 ? '#f59e0b' : '#ef4444'};">${data.score}/100</h2>
            <p style="color: #94a3b8; margin: 8px 0 0;">Compliance Score</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="background: #f8fafc;">
              <td style="padding: 12px 16px;">Total Issues</td>
              <td style="padding: 12px 16px; text-align: right; font-weight: bold;">${data.issuesFound}</td>
            </tr>
            <tr style="background: #fee2e2;">
              <td style="padding: 12px 16px; color: #dc2626;">Critical Issues</td>
              <td style="padding: 12px 16px; text-align: right; font-weight: bold; color: #dc2626;">${data.criticalCount}</td>
            </tr>
          </table>
          <a href="${APP_URL}/app/dashboard" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">View Full Report →</a>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">You're receiving this because you enabled weekly alerts. <a href="${APP_URL}/app/settings">Manage preferences</a></p>
        </div>
      `,
    }),
  });
}

async function sendSlackAlert(
  webhookUrl: string,
  data: { score: number; issuesFound: number; criticalCount: number }
) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;
  const scoreEmoji = data.score >= 80 ? "✅" : data.score >= 50 ? "⚠️" : "🚨";

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `${scoreEmoji} *List Guard Weekly Compliance Report*`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Compliance Score: ${data.score}/100*\n${data.issuesFound} total issues | ${data.criticalCount} critical`,
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "View Dashboard" },
              url: `${APP_URL}/app/dashboard`,
              style: data.criticalCount > 0 ? "danger" : "primary",
            },
          ],
        },
      ],
    }),
  });
}
