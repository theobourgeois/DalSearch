"use client";

import { useEffect, useMemo, useState } from "react";
import type { InstructorData } from "@/lib/types";
import { InstructorsList } from "./instructors-list";
import { InstructorsSearch } from "./instructors-search";
import { InstructorsFilters } from "./instructors-filters";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 10;

function getFilteredAndSortedInstructors(
  instructors: InstructorData[],
  searchTerm: string,
  ratingFilter: number | null,
  orderBy: { key: "name" | "rating" | "courses"; direction: "asc" | "desc" },
) {
  const filteredInstructors = instructors.filter((instructor) => {
    const rmpFullName = instructor.rateMyProfData
      ? `${instructor.rateMyProfData.firstName} ${instructor.rateMyProfData.lastName}`
      : "";

    const matchesSearch =
      instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rmpFullName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRating =
      ratingFilter === null ||
      (instructor.rateMyProfData &&
        Number(instructor.rateMyProfData.overallRating) >= ratingFilter);

    return matchesRating && matchesSearch;
  });

  const sortedInstructors = [...filteredInstructors].sort((a, b) => {
    let comparison = 0;

    if (orderBy.key === "name") {
      const nameA = a.rateMyProfData
        ? `${a.rateMyProfData.firstName} ${a.rateMyProfData.lastName}`
        : a.name;
      const nameB = b.rateMyProfData
        ? `${b.rateMyProfData.firstName} ${b.rateMyProfData.lastName}`
        : b.name;
      comparison = nameA.localeCompare(nameB);
    } else if (orderBy.key === "rating") {
      const ratingA = a.rateMyProfData
        ? Number(a.rateMyProfData.overallRating)
        : 0;
      const ratingB = b.rateMyProfData
        ? Number(b.rateMyProfData.overallRating)
        : 0;
      comparison = ratingB - ratingA; // Higher ratings first
    } else if (orderBy.key === "courses") {
      comparison = b.courseAndTerms.length - a.courseAndTerms.length;
    }

    // Reverse the comparison if direction is descending
    return orderBy.direction === "desc" ? -comparison : comparison;
  });

  return sortedInstructors;
}

export function InstructorsPageContent({
  instructors,
}: {
  instructors: InstructorData[];
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [orderBy, setOrderBy] = useState<{
    key: "name" | "rating" | "courses";
    direction: "asc" | "desc";
  }>({
    key: "name",
    direction: "asc",
  });

  const sortedInstructors = useMemo(
    () =>
      getFilteredAndSortedInstructors(
        instructors,
        searchTerm,
        ratingFilter,
        orderBy,
      ),
    [instructors, searchTerm, ratingFilter, orderBy],
  );

  const totalPages = Math.ceil(sortedInstructors.length / ITEMS_PER_PAGE);
  const paginatedInstructors = sortedInstructors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    if (sortedInstructors.length <= ITEMS_PER_PAGE) {
      setCurrentPage(1);
    }
  }, [sortedInstructors]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if there are few
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show a subset of pages with ellipsis
      if (currentPage <= 3) {
        // Near the start
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push(null); // Ellipsis
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push(1);
        pages.push(null); // Ellipsis
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push(1);
        pages.push(null); // Ellipsis
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(null); // Ellipsis
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <InstructorsSearch
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </div>

        <InstructorsFilters
          ratingFilter={ratingFilter}
          setRatingFilter={setRatingFilter}
          orderBy={orderBy}
          setOrderBy={setOrderBy}
        />
      </div>

      <div className="rounded-lg border dark:border-none bg-card">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-medium">
            {sortedInstructors.length} Instructors Found
          </h2>
        </div>

        <InstructorsList instructors={paginatedInstructors} />

        {totalPages > 1 && (
          <div className="p-4 border-t">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      handlePageChange(Math.max(1, currentPage - 1))
                    }
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {getPageNumbers().map((page, index) =>
                  page === null ? (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <span className="px-4 py-2">...</span>
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={`page-${page}`}>
                      <PaginationLink
                        onClick={() => handlePageChange(page as number)}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      handlePageChange(Math.min(totalPages, currentPage + 1))
                    }
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}
