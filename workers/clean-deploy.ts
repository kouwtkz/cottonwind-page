export async function CleanDeployScheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
  const cronNum = Number(controller.cron);
  const expirationDays = isNaN(cronNum) ? env.WORKERS_CLEAN_EXPIRATION_DAYS as number : cronNum;
  const init = {
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      // We recommend you store the API token as a secret using the Workers dashboard or using Wrangler as documented here: https://developers.cloudflare.com/workers/wrangler/commands/#secret
      "Authorization": `Bearer ${env.WORKERS_API_TOKEN}`,
    },
  };

  const projectNames = (env.WORKERS_CLEAN_PROJECT_NAME as string || "").split(",");
  console.log(projectNames.map);

  await Promise.all(
    projectNames.map(async (projectName) => {
      const endpoint = `https://api.cloudflare.com/client/v4/accounts/${env.WORKERS_ACCOUNT_ID}/pages/projects/${projectName}/deployments`;
      const response = await fetch(endpoint, init);
      const deployments = await response.json() as { [k: string]: any };
      const resultList = deployments.result as any[];
      if (resultList) {
        await Promise.all(resultList.map(async (deployment) => {
          if (deployment.aliases) return;
          // Check if the deployment was created within the last x days (as defined by `expirationDays` above)
          if ((Date.now() - new Date(deployment.created_on).getTime()) > (expirationDays * 86400000)) {
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
    })
  );
}