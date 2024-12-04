"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Course, Term, terms } from "@/utils/course";
import { useEffect, useMemo, useState } from "react";
import { RecommendationInput } from "./recommendations-input";
import { Checkbox } from "@/components/ui/checkbox";
import Fuse from "fuse.js";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@uidotdev/usehooks";

const NUM_COURSE_LEVELS = 9;
const ALL_COURSE_LEVELS = Array.from({ length: NUM_COURSE_LEVELS }, (_, i) =>
    ((i + 1) * 1000).toString()
);
export const ALL_SUBJECT_CODES = [
    "ACAD",
    "ACSC",
    "AGRI",
    "AGRN",
    "ANAT",
    "ANSC",
    "APSC",
    "AQUA",
    "ARBC",
    "ARCH",
    "ARTS",
    "ASSC",
    "BIOC",
    "BIOE",
    "BIOL",
    "BIOA",
    "BMNG",
    "BVSC",
    "BAFD",
    "BUSS",
    "BUSI",
    "CANA",
    "CHEE",
    "CHEM",
    "CHMA",
    "CHIN",
    "CIVL",
    "CLAS",
    "COMM",
    "CMSD",
    "CPST",
    "CSCA",
    "CSCI",
    "CTMP",
    "CRWR",
    "DEHY",
    "DENT",
    "DMUT",
    "DGIN",
    "DISM",
    "EMSP",
    "EESC",
    "ERTH",
    "ECON",
    "ECOA",
    "ECED",
    "ECMM",
    "ENGI",
    "INWK",
    "ENGM",
    "ENGN",
    "ENGL",
    "ENSL",
    "EGLA",
    "ENVA",
    "ENVE",
    "ENVS",
    "ENVI",
    "EPAH",
    "EURO",
    "EXTE",
    "FILM",
    "FIGS",
    "FOSC",
    "FOOD",
    "FREN",
    "GWST",
    "GENE",
    "GEOG",
    "GERM",
    "HESA",
    "HINF",
    "HLTH",
    "HPRO",
    "HSCE",
    "HAHP",
    "HSTC",
    "HIST",
    "HORT",
    "INDG",
    "IENG",
    "INFO",
    "INFB",
    "INTE",
    "INTD",
    "INTA",
    "IPHE",
    "ITAL",
    "JPHD",
    "JOUR",
    "KINE",
    "KING",
    "LARC",
    "LAWS",
    "LJSO",
    "LEIS",
    "MRIT",
    "MGMT",
    "MGTA",
    "MARA",
    "MARI",
    "MATL",
    "MATH",
    "MTHA",
    "MECH",
    "MNSC",
    "MEDP",
    "MEDR",
    "MICI",
    "MCRA",
    "MINE",
    "MUSC",
    "NESC",
    "NUMT",
    "NURS",
    "NUTR",
    "OCCU",
    "OCEA",
    "ORAL",
    "PHDP",
    "PATH",
    "PERF",
    "PERI",
    "PHAC",
    "PHAR",
    "PHIL",
    "PHLA",
    "MPAS",
    "PHYC",
    "PHYS",
    "PHYL",
    "PHYT",
    "PLAN",
    "PLSC",
    "POLI",
    "PGPH",
    "PEAS",
    "PSYR",
    "PSYO",
    "PSYC",
    "PUAD",
    "RADT",
    "REGN",
    "RELS",
    "RESM",
    "RSPT",
    "RUSN",
    "SCIE",
    "SLWK",
    "SOSA",
    "SOCI",
    "SOIL",
    "SPAN",
    "SPNA",
    "SPEC",
    "STAT",
    "STAA",
    "SUST",
    "THEA",
    "TYPR",
    "VTEC",
    "VISC",
    "WPUB",
];

type CourseFilter = {
    terms: Term[];
    courseLevels: string[]; // 1000, 2000, 3000, 4000...
    subjectCodes: string[]; // CSCI, MATH, etc.
    searchTerm: string;
};

export function FindCourses({ courses }: { courses: Course[] }) {
    const [filter, setFilter] = useState<CourseFilter>({
        terms: Object.keys(terms),
        courseLevels: ALL_COURSE_LEVELS,
        subjectCodes: [],
        searchTerm: "",
    });

    const fuse = useMemo(() => {
        return new Fuse(courses, {
            includeScore: true,
            keys: ["subjectCode", "courseCode", "title"],
        });
    }, [courses]);

    const deferredFilter = useDebounce(filter, 300);

    const filteredCourses = useMemo(() => {
        const filter = deferredFilter;
        const fuzzySearchedCourses = filter.searchTerm
            ? fuse.search(filter.searchTerm).map((result) => result.item)
            : courses;
        const filteredCourses = fuzzySearchedCourses.filter((course) => {
            const hasSelectedTerm = course.termClasses.some((termClass) => {
                return filter.terms.includes(termClass.term);
            });
            const hasSelectedCourseLevel = filter.courseLevels.includes(
                course.courseCode[0] + "000"
            );
            const hasSelectedSubjectCode = filter.subjectCodes.includes(
                course.subjectCode
            );
            return (
                hasSelectedTerm &&
                hasSelectedCourseLevel &&
                hasSelectedSubjectCode
            );
        });

        return filteredCourses;
    }, [courses, deferredFilter, fuse]);

    useEffect(() => {
        const storedFilter = localStorage.getItem("filter");
        if (storedFilter) {
            setFilter(JSON.parse(storedFilter));
        }
    }, []);

    const handleCheckFilter =
        (key: Exclude<keyof CourseFilter, "searchTerm">, value: string) =>
        (checked: boolean) => {
            const newFilter = { ...filter };
            if (checked) {
                newFilter[key] = [...(newFilter[key] ?? []), value];
            } else {
                newFilter[key] = newFilter[key]?.filter((v) => v !== value);
            }
            localStorage.setItem("filter", JSON.stringify(newFilter));
            setFilter(newFilter);
        };

    const handleAddSubjectCode = (subjectCode: string) => {
        const newFilter = { ...filter };
        if (newFilter.subjectCodes.includes(subjectCode)) {
            newFilter.subjectCodes = newFilter.subjectCodes.filter(
                (code) => code !== subjectCode
            );
        } else {
            newFilter.subjectCodes = [...newFilter.subjectCodes, subjectCode];
        }
        localStorage.setItem("filter", JSON.stringify(newFilter));
        setFilter(newFilter);
    };

    const handleRemoveSubjectCode = (subjectCode: string) => {
        const newFilter = { ...filter };
        newFilter.subjectCodes = newFilter.subjectCodes.filter(
            (code) => code !== subjectCode
        );
        localStorage.setItem("filter", JSON.stringify(newFilter));
        setFilter(newFilter);
    };

    const handleClearAllSubjectCodes = () => {
        const newFilter = { ...filter };
        newFilter.subjectCodes = [];
        localStorage.setItem("filter", JSON.stringify(newFilter));
        setFilter(newFilter);
    };

    const handleSelectAllCourseLevels = () => {
        const newFilter = { ...filter };
        newFilter.courseLevels = ALL_COURSE_LEVELS;
        localStorage.setItem("filter", JSON.stringify(newFilter));
        setFilter(newFilter);
    };

    const handleDeselectAllCourseLevels = () => {
        const newFilter = { ...filter };
        newFilter.courseLevels = [];
        localStorage.setItem("filter", JSON.stringify(newFilter));
        setFilter(newFilter);
    };

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-muted-foreground" />
                <Input
                    className="flex-1"
                    value={filter.searchTerm}
                    onChange={(e) =>
                        setFilter({
                            ...filter,
                            searchTerm: e.target.value,
                        })
                    }
                    placeholder="Search for course name, code, or subject code"
                />
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">
                        Filter Courses
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        <div>
                            <Label className="text-lg font-semibold mb-2 block">
                                Course Levels
                            </Label>
                            <div className="mb-2 flex gap-2 items-center">
                                <Button
                                    size="sm"
                                    onClick={handleSelectAllCourseLevels}
                                >
                                    Select All
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleDeselectAllCourseLevels}
                                >
                                    Deselect All
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {ALL_COURSE_LEVELS.map((courseLevel) => (
                                    <div
                                        key={courseLevel}
                                        className="flex items-center space-x-2"
                                    >
                                        <Checkbox
                                            id={`level-${courseLevel}`}
                                            checked={filter.courseLevels.includes(
                                                courseLevel
                                            )}
                                            onCheckedChange={handleCheckFilter(
                                                "courseLevels",
                                                courseLevel
                                            )}
                                        />
                                        <Label htmlFor={`level-${courseLevel}`}>
                                            {courseLevel}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <Label className="text-lg font-semibold mb-2 block">
                                Terms
                            </Label>
                            <div className="space-y-2">
                                {Object.entries(terms).map(
                                    ([term, termName]) => (
                                        <div
                                            key={term}
                                            className="flex items-center space-x-2"
                                        >
                                            <Checkbox
                                                id={`term-${term}`}
                                                checked={filter.terms.includes(
                                                    term as Term
                                                )}
                                                onCheckedChange={handleCheckFilter(
                                                    "terms",
                                                    term
                                                )}
                                            />
                                            <Label htmlFor={`term-${term}`}>
                                                {termName}
                                            </Label>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                        <div className="col-span-3">
                            <Label className="text-lg font-semibold mb-2 block">
                                Subject Codes
                            </Label>
                            <div className="flex justify-between items-center mb-2">
                                <Button
                                    size="sm"
                                    onClick={handleClearAllSubjectCodes}
                                >
                                    Clear All
                                </Button>
                            </div>
                            <RecommendationInput
                                showAllItemsByDefault
                                placeholder="Search for a subject code.."
                                isHoveredList
                                allItems={ALL_SUBJECT_CODES}
                                onSelect={handleAddSubjectCode}
                                closeOnSelect={false}
                                numOfRecommendations={ALL_SUBJECT_CODES.length}
                                renderRecommendation={(
                                    subjectCode,
                                    isCurrentSelected
                                ) => (
                                    <div
                                        className={cn(
                                            "flex cursor-pointer hover:bg-slate-100 items-center text-sm gap-2 w-full focus:outline-none py-2 px-2 rounded",
                                            isCurrentSelected && "bg-slate-100"
                                        )}
                                    >
                                        <Checkbox
                                            checked={filter.subjectCodes.includes(
                                                subjectCode
                                            )}
                                            onCheckedChange={handleCheckFilter(
                                                "subjectCodes",
                                                subjectCode
                                            )}
                                        />
                                        {subjectCode}
                                    </div>
                                )}
                            />
                            <div className="flex flex-wrap gap-2 mt-2">
                                {filter.subjectCodes.map((subjectCode) => (
                                    <Badge
                                        key={subjectCode}
                                        variant="secondary"
                                        className="flex items-center gap-1"
                                    >
                                        {subjectCode}
                                        <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={() =>
                                                handleRemoveSubjectCode(
                                                    subjectCode
                                                )
                                            }
                                        />
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                {filteredCourses.map((course) => (
                    <Card key={course.subjectCode + course.courseCode}>
                        <CardHeader>
                            <CardTitle className="text-xl">
                                {course.subjectCode} {course.courseCode} -{" "}
                                {course.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                {course.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
