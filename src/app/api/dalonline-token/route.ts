
async function loginAndGetToken(netid: string, password: string) {
  const res = await fetch("https://dalonline.dal.ca/PROD/twbkwbis.P_ValLogin", {
    "headers": {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "max-age=0",
      "content-type": "application/x-www-form-urlencoded",
      "sec-ch-ua": "\"Chromium\";v=\"133\", \"Not(A:Brand\";v=\"99\"",
      "sec-ch-ua-mobile": "?0",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "cookie": "TESTID=set",
      "Referer": "https://dalonline.dal.ca/PROD/bwskfshd.P_CrseSchd",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": `sid=${encodeURIComponent(netid)}&PIN=${encodeURIComponent(password)}`,
    "method": "POST"
  });

  const headers = new Headers(res.headers)
  const cookies = headers.get("set-cookie");
  const sessionId = cookies?.split(";")?.find((cookie) => cookie.includes("SESSID"))?.split("=")[1];
  return sessionId ?? null;
}


export async function POST(request: Request) {
  const payload = await request.json();
  const netid = payload.netid;
  const password = payload.password;
  const token = await loginAndGetToken(netid, password);

  if (token === null) {
    return new Response("Invalid credentials", { status: 401 });
  }

  return new Response(JSON.stringify(token), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
