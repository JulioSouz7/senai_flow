import { Icon } from "../icons/Icon";

interface RefreshButtonProps {
  label: string;
  refreshing: boolean;
  onRefresh: () => void;
}

export function RefreshButton({ label, refreshing, onRefresh }: RefreshButtonProps) {
  return (
    <button
      type="button"
      className="secondary-btn"
      aria-label={`Atualizar ${label}`}
      title={`Atualizar ${label}`}
      disabled={refreshing}
      onClick={onRefresh}
      style={{ minHeight: 36, padding: "8px 10px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}
    >
      <Icon name="refresh" size={15} />
      {refreshing ? "Atualizando..." : "Atualizar"}
    </button>
  );
}
