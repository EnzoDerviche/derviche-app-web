import { PageHeader } from "@/components/common/PageHeader";
import { ClientForm } from "@/components/clients/ClientForm";

export default function NuevoClientePage() {
  return (
    <>
      <PageHeader title="Nuevo cliente" />
      <ClientForm />
    </>
  );
}
