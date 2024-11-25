"use client";
import Fuse from "fuse.js";
import * as React from "react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Course, CourseAndSubjectCode, CourseByCode } from "@/utils/course";

const NUM_RECOMMENDATIONS = 100;

export function Search({ courses }: { courses: CourseByCode }) {
  const [value, setValue] = React.useState("");
  const [recommendations, setRecommendations] = React.useState<
    CourseAndSubjectCode[]
  >([]);
  const open = recommendations.length > 0;
  const courseKeys = React.useMemo(
    () => Object.keys(courses) as CourseAndSubjectCode[],
    [courses],
  );
  const router = useRouter();
  const fuse = React.useMemo(() => {
    return new Fuse(
      courseKeys.map((course) => courses[course]),
      {
        includeScore: true,
        keys: ["subjectCode", "courseCode", "title"],
      },
    );
  }, [courseKeys, courses]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue(value);
    loadRecommendations(value);
  };

  const loadRecommendations = (value: string) => {
    const results = fuse.search(value);
    const recommendations = results
      .slice(0, NUM_RECOMMENDATIONS)
      .map((result) => result.item) as Course[];
    setRecommendations(
      recommendations.map(
        (course) => course.subjectCode + course.courseCode,
      ) as CourseAndSubjectCode[],
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      router.push(`/${recommendations[0] || ""}`);
    }
  };

  const handleSearch = () => {
    router.push(`/${recommendations[0] || ""}`);
  };

  return (
    <div className="flex flex-col gap-2 items-center w-full">
      <div
        className="relative px-2 shadow-black rounded-xl w-full border-2 border-slate-200"
        onKeyDown={handleKeyDown}
      >
        <div className="relative">
          <SearchIcon
            className="absolute top-1/2 left-0 transform -translate-y-1/2"
            size={18}
          />
          <Input
            className="file:text-base focus-visible:ring-0 translate-x-6 p-0 rounded-none shadow-none outline-none border-none"
            value={value}
            onChange={handleChange}
            placeholder="Search for a course.."
          />
        </div>
        <div
          className="overflow-y-auto w-full flex flex-col"
          style={{
            maxHeight: open ? "300px" : 0,
          }}
        >
          {recommendations.map((course) => (
            <Link
              key={course}
              className="flex items-center text-sm gap-1 w-full focus:bg-slate-100 focus:outline-none hover:bg-slate-100 py-1"
              href={`/${course}`}
            >
              <SearchIcon size={14} />
              {courses[course].subjectCode} {courses[course].courseCode} -{" "}
              {courses[course].title}
            </Link>
          ))}
        </div>
      </div>
      <Button onClick={handleSearch} className="w-max">
        Search
      </Button>
    </div>
  );
}
