import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { d1, r2, sandbox, access } from "@emdash-cms/cloudflare";
import { formsPlugin } from "@emdash-cms/plugin-forms";
import webhookNotifier from "@emdash-cms/plugin-webhook-notifier";
import { defineConfig, fontProviders } from "astro/config";
import emdash from "emdash/astro";

export default defineConfig({
	output: "server",
	adapter: cloudflare(),
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			database: d1({ binding: "DB", session: "auto" }),
			storage: r2({ binding: "MEDIA" }),
			// Cloudflare Access SSO (transparent auth). The Zero Trust team fronts
			// Keycloak upstream; emdash validates the Cf-Access-Jwt-Assertion Access
			// injects on every request to the gated path (www…/_emdash/admin, see
			// cloudflare/access-sso.tf gate app). teamDomain + audience are the
			// non-secret identifiers of that Access app (Terraform output
			// `emdash_access_audience`). roleMapping maps the Keycloak group names
			// (lowercase, from the cloudflare-access client's Group Membership
			// mapper) Access passes in the JWT `groups` claim to EmDash roles;
			// users with no matching group get the default role.
			auth: access({
				teamDomain: "grilluminates.cloudflareaccess.com",
				audience: "060f42255276e36705850f52cc023dd46c3d4a029a53bb5dd2cde1cb6f00dacb",
				roleMapping: {
					"admins": 50,
					"moderators": 40,
					"users": 30,
				},
			}),
			plugins: [formsPlugin()],
			sandboxed: [webhookNotifier],
			sandboxRunner: sandbox(),
			marketplace: "https://marketplace.emdashcms.com",
		}),
	],
	fonts: [
		{
			provider: fontProviders.google(),
			name: "Inter",
			cssVariable: "--font-body",
			weights: [400, 500, 600, 700],
			fallbacks: ["sans-serif"],
		},
		{
			provider: fontProviders.google(),
			name: "JetBrains Mono",
			cssVariable: "--font-mono",
			weights: [400, 500],
			fallbacks: ["monospace"],
		},
	],
	devToolbar: { enabled: false },
});
