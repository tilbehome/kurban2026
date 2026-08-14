import { Invoice360View } from "@/modules/faturalar/presentation/components/Invoice360View";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) { return <Invoice360View id={(await params).id} />; }
