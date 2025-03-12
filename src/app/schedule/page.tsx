import { Calendar } from "lucide-react";
import UserSchedule from "@/components/user-schedule";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScheduleControls } from "@/components/schedule-controls";
import { courses } from "@/lib/course-utils";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ManageSchedule } from "@/components/manage-schedule";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Schedule() {
    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
            <Card className="max-w-8xl mx-auto shadow-sm">
                <CardHeader className="pb-0">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-8 w-8 text-primary" />
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">
                                    Schedule
                                </h1>
                            </div>
                            <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                                View and manage your class schedule
                            </p>
                        </div>
                        <div className="flex gap-3 items-center">
                            <ScheduleControls />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 md:hidden">
                    <Tabs defaultValue="schedule" className="w-full">
                        <TabsList className="grid grid-cols-2 mb-6">
                            <TabsTrigger value="schedule">
                                View Schedule
                            </TabsTrigger>
                            <TabsTrigger value="manage">
                                Manage Schedule
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="schedule" className="pt-2 px-2">
                            <UserSchedule />
                        </TabsContent>
                        <TabsContent value="manage" className="pt-2 px-2">
                            <ManageSchedule courses={Object.values(courses)} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
                <CardContent className="pt-6 hidden md:block">
                    <ResizablePanelGroup
                        direction="horizontal"
                        className="w-full h-full"
                    >
                        <ResizablePanel defaultSize={50} minSize={30}>
                            <UserSchedule />
                        </ResizablePanel>
                        <ResizableHandle withHandle className="mx-2" />
                        <ResizablePanel defaultSize={35} minSize={32}>
                            <div className="mt-2 mx-4">
                                <ManageSchedule
                                    courses={Object.values(courses)}
                                />
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </CardContent>
            </Card>
        </main>
    );
}
