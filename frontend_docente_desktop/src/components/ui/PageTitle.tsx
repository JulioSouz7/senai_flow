import type { ReactNode } from "react";

export function PageTitle
    ({ eyebrow, title, text, action }: { eyebrow: string; title: string; text: string; action?: ReactNode }) 
        {
    return (
    <div className="page-title">
        <div>
            <span>{eyebrow}</span>
            <h1>{title}</h1>
            <p>{text}</p>
        </div>
        {action}
    </div>);
}
