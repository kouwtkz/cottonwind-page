export async function scheduleTask(event: ScheduledController, env: MeeSvEnv) {
	switch (event.cron) {
		case "0 19 * * *":
			if (env.DEV) console.log(event.cron);
			await SvLifeCheck(env);
			await SvCleanPages(env);
			break;
	}
}

export async function SvLifeCheck(env: MeeSvEnv) {
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
}

export async function SvCleanPages(env: MeeSvEnv, expirationDays?: number) {
	if (!env.ACCOUNT_ID || !env.PROJECT_NAMES || !env.WORKERS_API_TOKEN) return;
	if (expirationDays === undefined) expirationDays = env.EXPIRATION_DAYS || 1;
	const init = {
		headers: {
			"Content-Type": "application/json;charset=UTF-8",
			// We recommend you store the API token as a secret using the Workers dashboard or using Wrangler as documented here: https://developers.cloudflare.com/workers/wrangler/commands/#secret
			"Authorization": `Bearer ${env.WORKERS_API_TOKEN}`,
		},
	};
	const projects = Array.isArray(env.PROJECT_NAMES) ? env.PROJECT_NAMES : [env.PROJECT_NAMES];
	for (const project of projects) {
		const endpoint = `https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/pages/projects/${project}/deployments`;
		const response = await fetch(endpoint, init);
		const deployments = await response.json() as { [k: string]: any };
		const resultList = (deployments.result || []) as any[];
		const now = Date.now();
		await Promise.all(resultList.map(async (deployment) => {
			if (deployment.aliases) return;
			// Check if the deployment was created within the last x days (as defined by `expirationDays` above)
			if ((now - new Date(deployment.created_on).getTime()) > (expirationDays * 86400000)) {
				// Delete the deployment
				await fetch(`${endpoint}/${deployment.id}`, {
					method: "DELETE",
					headers: {
						"Content-Type": "application/json;charset=UTF-8",
						"Authorization": `Bearer ${env.WORKERS_API_TOKEN}`,
					},
				});
			}
		}));
	}
}
