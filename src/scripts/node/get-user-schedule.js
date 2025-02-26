import { JSDOM } from 'jsdom';

async function login(email, password) {
  const res = await fetch("https://dalonline.dal.ca/PROD/twbkwbis.P_ValLogin", {
    "headers": {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "max-age=0",
      "content-type": "application/x-www-form-urlencoded",
      "sec-ch-ua": "\"Chromium\";v=\"133\", \"Not(A:Brand\";v=\"99\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"macOS\"",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "cookie": "TESTID=set",
      "Referer": "https://dalonline.dal.ca/PROD/bwskfshd.P_CrseSchd",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": `sid=${encodeURIComponent(email)}&PIN=${encodeURIComponent(password)}`,
    "method": "POST"
  });

  const headers = new Headers(res.headers)
  const cookies = headers.get("set-cookie");
  const sessionId = cookies.split(";").find((cookie) => cookie.includes("SESSID")).split("=")[1];
  return sessionId;
}


async function getSchedule(token) {
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

function to24Hour(time) {
  const [hour, minute] = time.split(':');
  const hourInt = parseInt(hour);
  let minuteInt = parseInt(minute);
  if (minuteInt < 10) {
    minuteInt = `0${minuteInt}`;
  }
  if (hourInt < 12) {
    return `${hourInt + 12}${minuteInt}`;
  }
  return `${hourInt}${minuteInt}`;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function extractCoursesFromTable(tableElement) {
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

async function main() {
  const username = process.argv[2];
  const password = process.argv[3];
  if (!username || !password) {
    console.log("Please provide username and password");
    return;
  }

  const token = await login(username, password);
  const schedule = await getSchedule(token);
  const dom = new JSDOM(schedule);
  const document = dom.window.document;
  const table = document.querySelector('table.datadisplaytable');
  const courses = extractCoursesFromTable(table);
  console.log(courses);
}

main()
