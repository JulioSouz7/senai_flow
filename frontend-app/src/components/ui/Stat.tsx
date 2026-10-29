import { Icon } from "../../components/icons/Icon";

export function Stat({ icon, label, value, note, tone = "" }:
    { icon: string; label: string; value: string; note: string; tone?: string }) 
{
  return (
  <article className="stat">
    <span className={`stat-icon ${tone}`}>
        <Icon name={icon}/>
    </span>
    
        <div>
            <small>{label}</small>
            <strong>{value}</strong>
            <p>{note}</p>
        </div>
    </article> );
}