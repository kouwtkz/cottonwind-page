export async function scheduleTask(event: ScheduledController, env: MeeSvEnv) {
	switch (event.cron) {
		case "0 19 * * *":
			if (env.LIFE_CHECK_URL) {
				const key = "life-check";
				const url = env.LIFE_CHECK_URL;
				const last = await env.KV.get(key);
				const result = String(
					await fetch(url, { method: "POST", body: env.LIFE_CHECK_CHALLENGE })
						.then(async (r) => {
							return await r.text() === env.LIFE_CHECK_VERIFIER
						}) ?? false
				);
				if (last !== result) await env.KV.put(key, result);
			}
			break;
		case "0 15 * * tue":
			if (!env.ACCOUNT_ID || !env.PROJECT_NAME || !env.WORKERS_API_TOKEN) break;
			const cronNum = Number(event.cron);
			const expirationDays = isNaN(cronNum) ? (env.EXPIRATION_DAYS || 7) : cronNum;
			const endpoint = `https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/pages/projects/${env.PROJECT_NAME}/deployments`;
			const init = {
				headers: {
					"Content-Type": "application/json;charset=UTF-8",
					// We recommend you store the API token as a secret using the Workers dashboard or using Wrangler as documented here: https://developers.cloudflare.com/workers/wrangler/commands/#secret
					"Authorization": `Bearer ${env.API_TOKEN}`,
				},
			};

			const response = await fetch(endpoint, init);
			const deployments = await response.json() as { [k: string]: any };
			const resultList = deployments.result as any[];
			await Promise.all(resultList.map(async (deployment) => {
				if (deployment.aliases) return;
				// Check if the deployment was created within the last x days (as defined by `expirationDays` above)
				if ((Date.now() - new Date(deployment.created_on).getTime()) > (expirationDays * 86400000)) {
					// Delete the deployment
					await fetch(`${endpoint}/${deployment.id}`, {
						method: "DELETE",
						headers: {
							"Content-Type": "application/json;charset=UTF-8",
							"Authorization": `Bearer ${env.API_TOKEN}`,
						},
					});
				}
			}));
			break;
	}
}
