import fs from "fs";

async function main() {
    try {
        const res = fetch(
            "https://self-service.dal.ca/BannerExtensibility/internalPb/virtualDomains.dal_stuweb_academicTimetable_subjects?MzA%3DdGVybXM%3D=ODE%3DMjAyNTAwOzIwMjQzMDsyMDI1MTA7MjAyNTIwOw%3D%3D&Mzk%3DZGlzdHJpY3Rz=OTk%3DMTAwOzIwMDszMDA7NDAwOw%3D%3D&encoded=true",
            {
                headers: {
                    accept: "application/json, text/plain, */*",
                    "accept-language": "en-US,en;q=0.9",
                    "sec-ch-ua": '"Chromium";v="131", "Not_A Brand";v="24"',
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": '"macOS"',
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    cookie: "JSESSIONID=7AAB3A11B5B1C0825AF4EFED532B9672; IDMSESSID=1A874AB26C4FC35A8F8817B7BE83ED7671DFA2B9DA5CBE2DF861F92920747D45ED13918376FF64BCDFDB89D3C1A5FB8D",
                    Referer:
                        "https://self-service.dal.ca/BannerExtensibility/customPage/page/dal.stuweb_academicTimetable",
                    "Referrer-Policy": "strict-origin-when-cross-origin",
                },
                body: null,
                method: "GET",
            }
        );
        const data = await res.json();
        const transformed = data.map(({ CODE, DESCR }) => ({
            code: CODE,
            description: DESCR,
        }));

        fs.writeFileSync(
            "../../utils/subjects.json",
            JSON.stringify(transformed)
        );
    } catch (error) {
        console.error(error);
    }
}

main();
