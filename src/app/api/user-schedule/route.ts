import { JSDOM } from 'jsdom';

export async function POST(request: Request) {
  const payload = await request.json();
  const token = payload.token;

  if (!token) {
    return new Response("Invalid token", { status: 401 });
  }

  const schedule = await getSchedule(token);
  const dom = new JSDOM(schedule);
  const document = dom.window.document;
  const table = document.querySelector('table.datadisplaytable');

  if (!table) {
    return new Response("Something went wrong", { status: 500 });
  }

  const courses = extractCoursesFromTable(table);

  return new Response(JSON.stringify(courses), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

async function getSchedule(token: string) {
  const response = await fetch("https://dalonline.dal.ca/PROD/bwskfshd.P_CrseSchd", {
    "headers": {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "en-US,en;q=0.9",
      "sec-ch-ua": "\"Chromium\";v=\"133\", \"Not(A:Brand\";v=\"99\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"macOS\"",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "cookie": `TESTID=set; SESSID=${token};`,
      "Referer": "https://dalonline.dal.ca/PROD/twbkwbis.P_GenMenu?name=bmenu.P_RegMnu",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": null,
    "method": "GET"
  });
  return response.text();
}

function to24Hour(time: string) {
  const [hour, minute] = time.split(':');
  const hourInt = parseInt(hour);
  let minuteInt: number | string = parseInt(minute);
  if (minuteInt < 10) {
    minuteInt = `0${minuteInt}`;
  }
  if (hourInt < 12) {
    return `${hourInt + 12}${minuteInt}`;
  }
  return `${hourInt}${minuteInt}`;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function extractCoursesFromTable(tableElement: Element) {
  const courses = [];

  const rows = tableElement.querySelectorAll('tr');
  for (const row of rows) {
    const cells = row.querySelectorAll('td');
    for (let i = 0; i < cells.length; i++) {
      const a = cells[i].querySelector('a');
      if (!a) {
        continue;
      }
      const day = DAYS[i];
      const text = a.innerHTML;
      const line = text.split('<br>');
      const [course, section] = line[0].split('-');
      const [subject, courseNumber] = course.split(' ');
      const [crn] = line[1].split(' ');
      const [uStartTime, uEndTime] = line[2].split('-');
      const startTime = to24Hour(uStartTime.split(" ")[0])
      const endTime = to24Hour(uEndTime.split(" ")[0])
      const location = line[3];

      courses.push({
        day,
        subject,
        courseNumber,
        section,
        crn,
        startTime,
        endTime,
        location
      });

    }
  }


  return courses;
}