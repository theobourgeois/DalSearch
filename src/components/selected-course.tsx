import { CourseByCode, CourseAndSubjectCode } from "@/lib/course-utils";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function SelectedCourses({
    courses,
    selectedCourses,
    onRemoveCourse,
}: {
    courses: CourseByCode;
    selectedCourses: CourseAndSubjectCode[];
    onRemoveCourse: (course: CourseAndSubjectCode) => void;
}) {
    return (
        <Card>
            <CardHeader>
                <h3 className="text-2xl font-bold">Selected Courses</h3>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px]">
                    {selectedCourses.map((code) => (
                        <div key={code} className="mb-4 p-4 border rounded-md">
                            <h4 className="text-lg font-semibold">
                                {code} - {courses[code].title}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                                {courses[code].creditHours} credit hours
                            </p>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => onRemoveCourse(code)}
                            >
                                Remove
                            </Button>
                        </div>
                    ))}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
