import { ClassSession, currentTerm, Time } from '@/lib/course-utils';
import { JSDOM } from 'jsdom';

function formatDate(date: Date) {
  const year: string | number = date.getFullYear();
  let month: string | number = date.getMonth() + 1;
  let day: string | number = date.getDate();
  // prepend 0 to month and day if they are less than 10
  month = month < 10 ? `0${month}` : month;
  day = day < 10 ? `0${day}` : day;

  return `${month}/${day}/${year}`;
}

export async function POST(request: Request) {
  const headers = new Headers(request.headers);
  const token = headers.get('Authorization')?.split('Bearer ')[1];
  const payload = (await request.json()) ?? null;
  const date = payload?.date ?? formatDate(new Date());

  if (!token) {
    return new Response("Invalid token", { status: 401 });
  }

  const schedule = await getSchedulePage(token, date);
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Accept',
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

async function getSchedulePage(token: string, date: string) {
  const response = await fetch("https://dalonline.dal.ca/PROD/bwskfshd.p_proc_crse_schd", {
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
      "cookie": `TESTID=set; SESSID=${token};`,
      "Referer": "https://dalonline.dal.ca/PROD/bwskfshd.P_CrseSchd",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": `goto_date_in=${encodeURIComponent(date)}&start_date_in=${encodeURIComponent(formatDate(new Date()))}`,
    "method": "POST"
  });

  return response.text();
}

function to24Hour(timeWithPeriod: string) {
  const [time, period] = timeWithPeriod.split(' ');
  const [hour, minute] = time.split(':');
  const hourInt = parseInt(hour);
  let minuteInt: number | string = parseInt(minute);
  if (minuteInt < 10) {
    minuteInt = `0${minuteInt}`;
  }

  if (period === 'pm' && hourInt < 12) {
    return `${hourInt + 12}${minuteInt}`;
  }

  return `${hourInt}${minuteInt}`;
}

const DAYS = ['M', 'T', 'W', 'R', 'F'] as const;

function extractCoursesFromTable(tableElement: Element) {
  const courses: Array<ClassSession> = [];

  const rows = tableElement.querySelectorAll('tr');
  for (const row of rows) {
    const cells = row.querySelectorAll('td');
    for (let i = 0; i < cells.length; i++) {
      const a = cells[i].querySelector('a');
      if (!a) {
        continue;
      }

      const day = DAYS[i]
      const text = a.innerHTML;
      const line = text.split('<br>');
      const [course, section] = line[0].split('-');
      const [subject, courseNumber] = course.split(' ');
      const [crn] = line[1].split(' ');
      const [uStartTime, uEndTime] = line[2].split('-');
      const startTime = to24Hour(uStartTime) as Time;
      const endTime = to24Hour(uEndTime) as Time;
      const location = line[3];
      let type: ClassSession["type"] = "Lec"
      if (section[0] === 'T') {
        type = 'Tut';
      }
      if (section[0] === 'B') {
        type = 'Lab';
      }
      const courseCode = subject + courseNumber as ClassSession["course"];

      courses.push({
        term: currentTerm,
        days: [day],
        crn,
        type,
        course: courseCode,
        time: {
          start: startTime,
          end: endTime
        },
        section,
        location
      });

    }
  }

  const reducedCourses = courses.reduce((acc, course) => {
    const [day] = course.days;
    const existingCourse = acc.find((c) => c.crn === course.crn);
    if (!existingCourse) {
      return [...acc, course];
    }
    existingCourse.days.push(day);
    return existingCourse ? acc : [...acc, course];
  }, [] as typeof courses);

  return reducedCourses;
}