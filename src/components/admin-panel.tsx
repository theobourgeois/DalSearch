import FlaggedReviews from "@/components/flagged-review";

export default function AdminPanel() {
  return (
    <section className="mt-8">
      <h3 className="text-xl font-semibold mt-6">Flagged Reviews</h3>
      <FlaggedReviews />
    </section>
  );
}