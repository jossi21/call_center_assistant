import { StaffDetailView } from "@/components/admin/staff/StaffDetailView";

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ staffId: string }>;
}) {
  const { staffId } = await params;
  return <StaffDetailView staffId={staffId} />;
}
