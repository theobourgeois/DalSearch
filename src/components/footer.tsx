import Link from "next/link";
import { Coffee, Github, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Footer() {
    return (
        <footer className="bg-gradient-to-r from-gray-900 to-black text-white py-12 border-t border-gray-800 bg-gray-900">
            <div className="max-w-6xl mx-auto px-4">
                {/* Coffee button section - centered and prominent */}
                <div className="flex justify-center mb-10">
                    <Link
                        href="https://buymeacoffee.com/theobourgeois"
                        className="transform hover:scale-105 transition-all duration-300"
                    >
                        <Button
                            size="lg"
                            className="bg-yellow-400 hover:bg-yellow-400 dark:bg-yellow-400 dark:hover:bg-yellow-300 text-black font-medium px-6 py-6 rounded-xl shadow-lg hover:shadow-amber-500/20"
                        >
                            <Coffee className="mr-2 h-5 w-5" />
                            Buy me a coffee
                        </Button>
                    </Link>
                </div>

                {/* Main footer content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {/* Logo/Brand section */}
                    <div className="flex flex-col items-center md:items-start">
                        <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-yellow-200">
                            DalSearch
                        </h2>
                        <p className="text-gray-400 text-sm max-w-xs text-center md:text-left">
                            A tool to help Dalhousie University students find
                            and explore courses more efficiently.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-xl font-semibold mb-4 text-center md:text-left">
                            Quick Links
                        </h3>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href="https://www.dal.ca/"
                                    className="flex items-center gap-2 text-gray-300 hover:text-amber-400 transition-colors"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    About Dalhousie
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="https://self-service.dal.ca/BannerExtensibility/customPage/page/dal.stuweb_academicTimetable"
                                    className="flex items-center gap-2 text-gray-300 hover:text-amber-400 transition-colors"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Dal Academic Timetable
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="https://github.com/theobourgeois/DalSearch"
                                    className="flex items-center gap-2 text-gray-300 hover:text-amber-400 transition-colors"
                                >
                                    <Github className="h-4 w-4" />
                                    Source Code
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Created By */}
                    <div>
                        <h3 className="text-xl font-semibold mb-4 text-center md:text-left">
                            Created By
                        </h3>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href="https://theobourgeois.com"
                                    className="flex items-center gap-2 text-gray-300 hover:text-amber-400 transition-colors"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Théo Bourgeois
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="https://chrislangille.github.io/portfolio"
                                    className="flex items-center gap-2 text-gray-300 hover:text-amber-400 transition-colors"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Chris Langille
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="mt-12 pt-6 border-t border-gray-800 text-center">
                    <p className="text-gray-500 text-sm">
                        DalSearch is not Affiliated with Dalhousie University.
                    </p>
                    <p className="text-gray-600 text-xs mt-2">
                        © {new Date().getFullYear()} DalSearch
                    </p>
                </div>
            </div>
        </footer>
    );
}
