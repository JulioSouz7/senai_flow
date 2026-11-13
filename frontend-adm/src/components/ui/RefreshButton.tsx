import { Icon } from "../icons/Icon";

export function RefreshButton({
  refreshing,
  onRefresh,
}: {
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <button
      type="button"
      className="secondary-btn"
      onClick={onRefresh}
      disabled={refreshing}
      aria-label={refreshing ? "Atualizando dados" : "Atualizar dados"}
      title={refreshing ? "Atualizando..." : "Atualizar"}
      style={{ display: "inline-flex", alignItems: "center", gap: 7 }}
    >
      <Icon name="refresh" size={16} />
      {refreshing ? "Atualizando..." : "Atualizar"}
    </button>
  );
}
