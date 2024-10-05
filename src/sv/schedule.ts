export async function scheduleTask(event: ScheduledController, env: MeeCommonEnv) {
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
	}
}
