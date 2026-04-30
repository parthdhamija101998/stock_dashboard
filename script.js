// Add this inside your addTicker() function in script.js
async function triggerGitHubAction(newTicker) {
    const GITHUB_TOKEN = "YOUR_PAT_TOKEN"; // Use a secret/proxy in production
    const REPO_OWNER = "parthdhamija101998";
    const REPO_NAME = "stock_dashboard";

    await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/dispatches`, {
        method: 'POST',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
            event_type: 'add_ticker',
            client_payload: { ticker: newTicker }
        })
    });
}
