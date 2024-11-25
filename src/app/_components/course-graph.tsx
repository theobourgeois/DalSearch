import { CourseGraph } from "@/utils/course-graph"
import { CourseAndSubjectCode } from "@/utils/course"

export function Graph({ graph }: { graph: CourseGraph }) {
  const sortedGraph = Object.entries(graph).sort((a, b) => a[0].localeCompare(b[0]))
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const level1Nodes = sortedGraph.filter(([_, node]) => node.prereqs === undefined)
  return (
    <div className="flex gap-2 justify-evenly">
      {level1Nodes.map(([courseCode, node]) => (
        <div className="flex flex-col gap-2" key={courseCode}>
          <GraphNode courseCode={courseCode as CourseAndSubjectCode} postreqs={node.postreqs} graph={graph} />
        </div>
      ))}
    </div>
  )
}

function GraphLabel({ label }: { label: string }) {
  return (
    <div className="bg-blue-200 w-24 h-24 flex justify-center items-center rounded-full">
      <p>{label}</p>
    </div>
  )
}

function GraphNode({ courseCode, postreqs, graph }: { graph: CourseGraph, courseCode: CourseAndSubjectCode, postreqs: CourseAndSubjectCode[] }) {
  return (
    <>
      <GraphLabel label={courseCode} />
      <div className="flex gap-2 justify-around">
        {postreqs.map((postreq) => (
          <div className="flex flex-col gap-4" key={postreq}>
            <GraphNode
              key={postreq}
              courseCode={postreq}
              postreqs={graph[postreq].postreqs}
              graph={graph}
            />
          </div>
        ))}
      </div>
    </>
  )
}
