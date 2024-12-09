"use client";
import { CourseByCode } from "@/utils/course";
import UserSchedule from "@/components/user-schedule";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ScheduleBuilder({
    courses,
}: {
    courses: CourseByCode;
}) {
    return (
        <div className="grid grid-cols-4 gap-2">
            <div className="col-span-1">
                <Card>
                    <CardHeader>
                        <h2 className="text-xl font-bold">Find Courses</h2>
                    </CardHeader>
                    <CardContent></CardContent>
                </Card>
            </div>
            <div className="col-span-3">
                <UserSchedule />
            </div>
        </div>
    );
}
