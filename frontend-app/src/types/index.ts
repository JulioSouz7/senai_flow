export type Role = "student" | "teacher" | "management"; 

export const profiles = 
{ 
    student: { name: "Lucas Andrade", label: "Aluno • DS2", initials: "LA" }, 
    teacher: { name: "André Silva", label: "Docente", initials: "AS" }, 
    management: { name: "Marina Costa", label: "Coordenação", initials: "MC" }, 
}; 

export const managementNav = [ 
    ["grid", "Dashboard"], 
    ["clock", "Validação de reservas"], 
    ["box", "Solicitações de equipamentos"], 
    ["tool", "Gestão de avarias"], 
    ["settings", "Cadastros"], 
    ["message", "Comunicados"],
    ["message", "Relatos e sugestões"], 
    ["users", "Controle de acessos"], 
    ["map", "Mapa de riscos"], 
]; 

export const teacherNav = [
    ["calendar", "Agenda de salas"], 
    ["building", "Minhas reservas"], 
    ["box", "Solicitação de equipamentos"], 
    ["tool", "Relatórios de avaria"], 
    ["trophy", "Ranking de turmas"], 
    ["map", "Mapa de riscos"], 
    ["message", "FAQs e sugestões"], 
];