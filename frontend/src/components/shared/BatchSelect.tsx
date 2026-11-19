import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { Batch, Page } from "../../types";
export function BatchSelect({
  value,
  onChange,
  disabled = false,
}: {
  value?: string | null;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["batches", "active"],
    queryFn: async () => {
      const r = await api.get<Page<Batch> | Batch[]>("/batches/");
      return Array.isArray(r.data) ? r.data : r.data.results;
    },
  });
  return (
    <select
      aria-label="Select batch"
      className="field"
      disabled={disabled || isLoading}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">
        {isLoading ? "Loading batches…" : "Select Batch"}
      </option>
      {data?.map((b) => (
        <option key={b.id} value={b.id}>
          {b.number}
          {b.year ? ` · ${b.year}` : ""}
        </option>
      ))}
    </select>
  );
}
