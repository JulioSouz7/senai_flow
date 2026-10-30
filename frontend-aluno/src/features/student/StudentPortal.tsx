"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import {
  BellRing,
  Building2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  House,
  LogOut,
  MapPinned,
  MessageSquareText,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type {
  AreaRisco,
  AuthSession,
  Comunicado,
  Faq,
  MinhaTurmaResponse,
  Predio,
  RankingSala,
  Relato,
} from "@/lib/types";
import { getErrorMessage } from "@/lib/api";
import { studentService } from "@/services/studentService";
import styles from "./StudentPortal.module.scss";

type TabId = "turma" | "comunicados" | "ranking" | "relatos" | "mapa";
type SectionId = TabId | "suporte";
type Overlay = "perfil" | "suporte" | null;

const tabs: { id: TabId; label: string; icon: typeof House }[] = [
  { id: "turma", label: "Minha Turma", icon: House },
  { id: "comunicados", label: "Comunicados", icon: BellRing },
  { id: "ranking", label: "Ranking", icon: Trophy },
  { id: "relatos", label: "Relatos", icon: MessageSquareText },
  { id: "mapa", label: "Mapa de Risco", icon: MapPinned },
];

interface StudentPortalProps {
  session: AuthSession;
  onLogout: () => void;
}

export function StudentPortal({ session, onLogout }: StudentPortalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("turma");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [turmaInfo, setTurmaInfo] = useState<MinhaTurmaResponse | null>(null);
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [ranking, setRanking] = useState<RankingSala[]>([]);
  const [predios, setPredios] = useState<Predio[]>([]);
  const [areas, setAreas] = useState<AreaRisco[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [ownRelatos, setOwnRelatos] = useState<Relato[]>([]);
  const [loadingSections, setLoadingSections] = useState<Partial<Record<SectionId, boolean>>>({});
  const [loaded, setLoaded] = useState<Partial<Record<SectionId, boolean>>>({});
  const [errors, setErrors] = useState<Partial<Record<SectionId, string>>>({});
  const [refreshVersions, setRefreshVersions] = useState<Partial<Record<SectionId, number>>>({});
  const requestedVersions = useRef<Partial<Record<SectionId, number>>>({});

  useEffect(() => {
    let active = true;
    const section: SectionId = overlay === "suporte" ? "suporte" : activeTab;
    if (section === "relatos") return;
    const version = refreshVersions[section] || 0;
    const versions = requestedVersions.current;
    if (loaded[section] && versions[section] === version) return;
    versions[section] = version;

    let completed = false;
    async function loadSection() {
      setLoadingSections((current) => ({ ...current, [section]: true }));
      setErrors((current) => ({ ...current, [section]: undefined }));
      try {
        if (section === "turma") {
          const result = await studentService.minhaTurma(session.token);
          if (active) setTurmaInfo(result);
        } else if (section === "comunicados") {
          const result = await studentService.comunicados(session.token);
          if (active) setComunicados(result);
        } else if (section === "ranking") {
          const result = await studentService.ranking(session.token);
          if (active) setRanking(result);
        } else if (section === "mapa") {
          const [buildingData, areaData] = await Promise.all([
            studentService.predios(session.token),
            studentService.areasRisco(session.token),
          ]);
          if (active) {
            setPredios(buildingData);
            setAreas(areaData);
          }
        } else if (section === "suporte") {
          const result = await studentService.faqs(session.token);
          if (active) setFaqs(result);
        }
        if (active) setLoaded((current) => ({ ...current, [section]: true }));
        if (active && version > 0) toast.success("Dados atualizados.");
        completed = true;
      } catch (loadError) {
        completed = true;
        if (active) {
          const message = getErrorMessage(loadError, "Não foi possível carregar os dados.");
          setErrors((current) => ({ ...current, [section]: message }));
          toast.error(message);
        }
      } finally {
        if (active) setLoadingSections((current) => ({ ...current, [section]: false }));
      }
    }

    void loadSection();
    return () => {
      active = false;
      if (!completed && versions[section] === version) {
        delete versions[section];
      }
    };
  }, [activeTab, loaded, overlay, refreshVersions, session.token]);

  function refreshSection(section: SectionId) {
    if (section === "relatos") {
      toast.error("A API não oferece uma listagem privada de relatos do aluno.");
      return;
    }
    if (loadingSections[section]) return;
    setRefreshVersions((current) => ({ ...current, [section]: (current[section] || 0) + 1 }));
  }

  const user = session.usuario;
  const initials = getInitials(user.nome);

  return (
    <main className={styles.portal}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>S</span>
          <span className={styles.brandText}>SENAI <strong>Flow</strong><small>ALUNO</small></span>
        </div>
        <button className={styles.avatarButton} type="button" aria-label="Abrir perfil" onClick={() => setOverlay("perfil")}>
          {initials || <UserRound size={20} />}
        </button>
      </header>

      <div className={styles.content}>
        {overlay === "suporte" ? (
          <SupportView faqs={faqs} token={session.token} loading={Boolean(loadingSections.suporte)} refreshing={Boolean(loadingSections.suporte)} error={errors.suporte || ""} onClose={() => setOverlay("perfil")} onRetry={() => refreshSection("suporte")} />
        ) : (
          <>
            {activeTab === "turma" && <MyClassView data={turmaInfo} loading={Boolean(loadingSections.turma)} refreshing={Boolean(loadingSections.turma)} error={errors.turma || ""} onRefresh={() => refreshSection("turma")} />}
            {activeTab === "comunicados" && <AnnouncementsView items={comunicados} loading={Boolean(loadingSections.comunicados)} refreshing={Boolean(loadingSections.comunicados)} error={errors.comunicados || ""} onRefresh={() => refreshSection("comunicados")} />}
            {activeTab === "ranking" && <RankingView items={ranking} loading={Boolean(loadingSections.ranking)} refreshing={Boolean(loadingSections.ranking)} error={errors.ranking || ""} onRefresh={() => refreshSection("ranking")} />}
            {activeTab === "relatos" && <ReportsView token={session.token} items={ownRelatos} onCreated={(relato) => setOwnRelatos((current) => [relato, ...current])} onRefresh={() => refreshSection("relatos")} />}
            {activeTab === "mapa" && <RiskMapView items={areas} predios={predios} loading={Boolean(loadingSections.mapa)} refreshing={Boolean(loadingSections.mapa)} error={errors.mapa || ""} onRefresh={() => refreshSection("mapa")} />}
          </>
        )}
      </div>

      <nav className={styles.bottomNav} aria-label="Navegação do aluno">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            className={`${styles.navItem} ${activeTab === id && overlay !== "suporte" ? styles.navItemActive : ""}`}
            type="button"
            key={id}
            aria-current={activeTab === id && overlay !== "suporte" ? "page" : undefined}
            onClick={() => { setOverlay(null); setActiveTab(id); }}
          >
            <Icon size={20} strokeWidth={activeTab === id ? 2.4 : 1.8} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {overlay === "perfil" && (
        <ProfileSheet user={user} turma={turmaInfo?.turma || null} onClose={() => setOverlay(null)} onSupport={() => setOverlay("suporte")} onLogout={onLogout} />
      )}
    </main>
  );
}

function ViewHeading({ eyebrow, title, description, onRefresh, refreshing = false }: { eyebrow: string; title: string; description: string; onRefresh?: () => void; refreshing?: boolean }) {
  return <div className={styles.viewHeading}><div><p className={styles.eyebrow}>{eyebrow}</p><h1>{title}</h1><p className={styles.description}>{description}</p></div>{onRefresh && <button className={styles.refreshButton} type="button" aria-label={`Atualizar ${title}`} title="Atualizar dados" onClick={onRefresh} disabled={refreshing}><RefreshCw size={18} className={refreshing ? styles.refreshing : ""} /></button>}</div>;
}

function LoadingState() {
  return <div className={styles.loadingState} role="status">Carregando informações...</div>;
}

function ErrorState({ message }: { message: string }) {
  return <div className={styles.errorState} role="alert">{message}</div>;
}

function EmptyState({ icon: Icon, title, detail }: { icon: typeof ClipboardList; title: string; detail: string }) {
  return <div className={styles.emptyState}><span className={styles.emptyIcon}><Icon size={22} aria-hidden="true" /></span><h2>{title}</h2><p>{detail}</p></div>;
}

function MyClassView({ data, loading, refreshing, error, onRefresh }: { data: MinhaTurmaResponse | null; loading: boolean; refreshing: boolean; error: string; onRefresh: () => void }) {
  const now = useCurrentTime();
  const notices = (data?.comunicados || []).filter((item) => isAnnouncementCurrent(item, now));
  return (
    <section>
      <ViewHeading eyebrow="ESPAÇO DA TURMA" title="Minha Turma" description="Avisos e informações compartilhados com a sua turma." />
      {loading && <LoadingState />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && <>
        <div className={styles.classBanner}>
          <span className={styles.bannerIcon}><House size={21} aria-hidden="true" /></span>
          <div><span className={styles.smallLabel}>SUA TURMA</span><h2>{data?.turma?.nome || "Turma não atribuída"}</h2><p>{data?.turma?.curso || "Os comunicados da sua turma aparecem aqui."}</p></div>
          <Sparkles className={styles.bannerSpark} size={19} aria-hidden="true" />
        </div>
        <div className={styles.classFacts}><div><span>Curso</span><strong>{data?.turma?.curso || "Curso não disponível"}</strong></div><div><span>Docentes</span><strong>{data?.docentes?.length ? data.docentes.map((docente) => docente.nome).join(", ") : "Nenhum docente vinculado"}</strong></div></div>
        <SectionTitle title="Mural da turma" count={notices.length} refreshing={refreshing} onRefresh={onRefresh} />
        {notices.length ? <AnnouncementList items={notices} /> : <EmptyState icon={ClipboardList} title="Sem avisos por enquanto" detail="Os comunicados publicados para sua turma aparecerão aqui." />}
      </>}
    </section>
  );
}

function AnnouncementsView({ items, loading, refreshing, error, onRefresh }: { items: Comunicado[]; loading: boolean; refreshing: boolean; error: string; onRefresh: () => void }) {
  const now = useCurrentTime();
  const visibleItems = items.filter((item) => isAnnouncementCurrent(item, now));
  return (
    <section>
      <ViewHeading eyebrow="INSTITUIÇÃO" title="Comunicados" description="Avisos gerais publicados para a comunidade SENAI." onRefresh={onRefresh} refreshing={refreshing} />
      {loading && <LoadingState />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && (visibleItems.length ? <AnnouncementList items={visibleItems} /> : <EmptyState icon={BellRing} title="Nenhum comunicado" detail="Os comunicados gerais dos últimos dois dias aparecerão nesta área." />)}
    </section>
  );
}

function AnnouncementList({ items }: { items: Comunicado[] }) {
  return (
    <div className={styles.announcementList}>
      {items.map((item) => <article className={styles.announcement} key={item.id_comunicado}>
        <span className={styles.announcementIcon}><BellRing size={18} aria-hidden="true" /></span>
        <div className={styles.announcementBody}>
          <div className={styles.announcementMeta}><span>{item.abrangencia === "TURMA" ? "AVISO DA TURMA" : "AVISO INSTITUCIONAL"}</span><time dateTime={item.dt_publicacao}>{formatDate(item.dt_publicacao)}</time></div>
          <h2>{item.titulo}</h2><p>{item.conteudo}</p>
          {item.administrador?.usuario?.nome && <small>Publicado por {item.administrador.usuario.nome}</small>}
        </div>
      </article>)}
    </div>
  );
}

function RankingView({ items, loading, refreshing, error, onRefresh }: { items: RankingSala[]; loading: boolean; refreshing: boolean; error: string; onRefresh: () => void }) {
  return (
    <section>
      <ViewHeading eyebrow="CUIDADO COM OS ESPAÇOS" title="Ranking de salas" description="Pontuação de organização e conservação registrada no semestre." onRefresh={onRefresh} refreshing={refreshing} />
      {loading && <LoadingState />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && (items.length ? <div className={styles.rankingList}>
        {items.map((item) => <article className={styles.rankingRow} key={item.id_sala}>
          <span className={`${styles.rankNumber} ${item.posicao === 1 ? styles.rankTop : ""}`}>{item.posicao === 1 ? <Trophy size={18} aria-label="Primeiro lugar" /> : String(item.posicao).padStart(2, "0")}</span>
          <div className={styles.rankDetails}><h2>{item.nome_sala}</h2><p>{item.predio} <span>·</span> {item.total_avaliacoes} avaliações</p></div>
          <div className={styles.rankScore}><strong>{item.total_pontos}</strong><small>pontos</small></div>
        </article>)}
        {items[0]?.semestre_letivo && <p className={styles.semesterNote}>Semestre {items[0].semestre_letivo}</p>}
      </div> : <EmptyState icon={Trophy} title="Ranking ainda sem pontuação" detail="As salas avaliadas aparecerão quando houver registros no semestre." />)}
    </section>
  );
}

function ReportsView({ token, items, onCreated, onRefresh }: { token: string; items: Relato[]; onCreated: (relato: Relato) => void; onRefresh: () => void }) {
  const [tipo, setTipo] = useState<"SUGESTAO" | "RECLAMACAO">("SUGESTAO");
  const [descricao, setDescricao] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [creating, setCreating] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const result = await studentService.criarRelato(token, tipo, descricao.trim());
      onCreated(result.relato);
      setDescricao("");
      setCreating(false);
      toast.success("Relato enviado para a administração.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível enviar seu relato."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <ViewHeading eyebrow="SUA VOZ IMPORTA" title="Relatos" description="Envie uma sugestão ou reclamação diretamente à administração." onRefresh={onRefresh} />
      {creating ? <form className={styles.reportForm} onSubmit={submit}>
        <button className={styles.backButton} type="button" onClick={() => setCreating(false)}><ChevronRight size={17} className={styles.backChevron} />Voltar aos relatos</button>
        <fieldset className={styles.segmented}><legend>Tipo de relato</legend>
          <button type="button" className={tipo === "SUGESTAO" ? styles.segmentActive : ""} onClick={() => setTipo("SUGESTAO")}>Sugestão</button>
          <button type="button" className={tipo === "RECLAMACAO" ? styles.segmentActive : ""} onClick={() => setTipo("RECLAMACAO")}>Reclamação</button>
        </fieldset>
        <label className={styles.fieldLabel} htmlFor="relato-description">Descrição</label>
        <textarea id="relato-description" value={descricao} onChange={(event) => setDescricao(event.target.value.slice(0, 255))} placeholder="Escreva sua mensagem..." maxLength={255} rows={6} required />
        <div className={styles.charCount}>{descricao.length}/255</div>
        <button className={styles.primaryAction} disabled={submitting || !descricao.trim()}><MessageSquareText size={18} aria-hidden="true" />{submitting ? "Enviando..." : "Enviar relato"}</button>
        <p className={styles.formHint}>O relato será enviado com sua identificação de aluno.</p>
      </form> : <>
        <button className={styles.createReportButton} type="button" onClick={() => setCreating(true)}><Plus size={19} aria-hidden="true" />Criar relato</button>
        {items.length ? <div className={styles.reportList}>{items.map((item) => <ReportCard key={item.id_relato} item={item} />)}</div> : <EmptyState icon={MessageSquareText} title="Nenhum relato enviado nesta sessão" detail="Os relatos históricos não podem ser consultados com segurança pela API atual. Os novos relatos enviados aparecerão aqui." />}
        {items.length > 0 && <p className={styles.historyNotice}>A API atual não oferece uma listagem privada para atualizar o histórico completo.</p>}
      </>}
    </section>
  );
}

function RiskMapView({ items, predios, loading, refreshing, error, onRefresh }: { items: AreaRisco[]; predios: Predio[]; loading: boolean; refreshing: boolean; error: string; onRefresh: () => void }) {
  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const buildingId = selectedBuilding ?? predios[0]?.id_predio ?? null;
  const buildingAreas = useMemo(() => items.filter((item) => item.id_predio === buildingId), [items, buildingId]);
  const floors = useMemo(() => [...new Set(buildingAreas.map((area) => area.andar))].sort((a, b) => a - b), [buildingAreas]);
  const floor = selectedFloor !== null && floors.includes(selectedFloor) ? selectedFloor : floors[0] ?? null;
  const filteredAreas = buildingAreas.filter((area) =>
    (floor === null || area.andar === floor) && `${area.nome} ${area.tipo} ${area.orientacao_seguranca}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <section>
      <ViewHeading eyebrow="SEGURANÇA NO CAMPUS" title="Mapa de Risco" description="Áreas sinalizadas e orientações organizadas por bloco e andar." onRefresh={onRefresh} refreshing={refreshing} />
      {loading && <LoadingState />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && <>
        <div className={styles.mapFilters}>
          <span className={styles.filterLabel}><Building2 size={16} aria-hidden="true" /> Bloco</span>
          <div className={styles.locationOptions} role="group" aria-label="Selecionar bloco">
            {predios.map((predio) => <button key={predio.id_predio} className={`${styles.locationButton} ${buildingId === predio.id_predio ? styles.locationActive : ""}`} type="button" onClick={() => { setSelectedBuilding(predio.id_predio); setSelectedFloor(null); }}><Building2 size={17} aria-hidden="true" />{predio.nome}</button>)}
          </div>
          <span className={styles.filterLabel}><MapPinned size={16} aria-hidden="true" /> Andar</span>
          <div className={styles.floorOptions} role="group" aria-label="Selecionar andar">
            {floors.map((item) => <button key={item} className={`${styles.locationButton} ${floor === item ? styles.locationActive : ""}`} type="button" onClick={() => setSelectedFloor(item)}>{item}º andar</button>)}
            {!floors.length && <span className={styles.noFloor}>Sem andares cadastrados</span>}
          </div>
        </div>
        <label className={styles.searchBox}><Search size={18} aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar área ou risco" /></label>
        {filteredAreas.length ? <div className={styles.riskList}>
          {filteredAreas.map((area) => <article className={styles.riskCard} key={area.id_area}>
            <div className={styles.riskCardTop}><span className={styles.riskIcon}><ShieldAlert size={19} aria-hidden="true" /></span><span className={styles.riskType}>{area.tipo}</span><span className={styles.floorTag}>{area.andar}º andar</span></div>
            <h2>{area.nome}</h2><p>{area.orientacao_seguranca}</p>
            <div className={styles.riskImageFrame}>
              {area.imagem_url && isCloudinaryImage(area.imagem_url) ? <Image className={styles.riskImage} src={area.imagem_url} alt={`Imagem da área de risco ${area.nome}`} fill sizes="(max-width: 760px) calc(100vw - 68px), 720px" /> : <div className={styles.riskImageEmpty}><span className={styles.emptyIcon}><ShieldAlert size={20} aria-hidden="true" /></span><span>Imagem não cadastrada</span></div>}
            </div>
          </article>)}
        </div> : <EmptyState icon={ShieldAlert} title="Nenhuma área de risco cadastrada" detail="Não há registros para este bloco e andar." />}
      </>}
    </section>
  );
}

function ProfileSheet({ user, turma, onClose, onSupport, onLogout }: { user: AuthSession["usuario"]; turma: MinhaTurmaResponse["turma"]; onClose: () => void; onSupport: () => void; onLogout: () => void }) {
  return (
    <div className={styles.overlayBackdrop} role="presentation" onClick={onClose}>
      <section className={styles.profileSheet} role="dialog" aria-modal="true" aria-labelledby="profile-title" onClick={(event) => event.stopPropagation()}>
        <div className={styles.sheetHandle} />
        <button className={styles.closeButton} type="button" aria-label="Fechar perfil" onClick={onClose}><X size={21} /></button>
        <div className={styles.profileHeading}><span className={styles.profileAvatar}>{getInitials(user.nome)}</span><div><h2 id="profile-title">{user.nome}</h2><span className={styles.roleTag}>ALUNO</span></div></div>
        <div className={styles.profileFields}>
          <div><span>E-mail institucional</span><strong>{user.email}</strong></div>
          <div className={styles.profilePair}><div><span>Turma</span><strong>{turma?.nome || user.aluno?.turma?.nome || "Turma não atribuída"}</strong></div><div><span>Matrícula</span><strong>{user.aluno?.matricula || "Não informada"}</strong></div></div>
        </div>
        <button className={styles.supportButton} type="button" onClick={onSupport}><CircleHelp size={20} aria-hidden="true" />Central de Suporte / FAQ</button>
        <button className={styles.logoutButton} type="button" onClick={onLogout}><LogOut size={18} aria-hidden="true" />Sair da conta</button>
      </section>
    </div>
  );
}

function SupportView({ faqs, token, loading, refreshing, error, onClose, onRetry }: { faqs: Faq[]; token: string; loading: boolean; refreshing: boolean; error: string; onClose: () => void; onRetry: () => void }) {
  const [category, setCategory] = useState("TODAS");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [assunto, setAssunto] = useState("");
  const [descricao, setDescricao] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const categories = ["TODAS", ...new Set(faqs.map((faq) => faq.categoria).filter((value): value is string => Boolean(value)))];
  const filtered = category === "TODAS" ? faqs : faqs.filter((faq) => faq.categoria === category);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (descricao.trim().length < 30) {
      toast.error("Descreva o problema com pelo menos 30 caracteres.");
      return;
    }
    setSubmitting(true);
    try {
      await studentService.abrirChamado(token, assunto.trim(), descricao.trim());
      setAssunto("");
      setDescricao("");
      toast.success("Chamado aberto com sucesso.");
    } catch (submitError) {
      toast.error(getErrorMessage(submitError, "Não foi possível abrir o chamado."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={styles.supportView}>
      <div className={styles.supportTop}><button className={styles.backButton} type="button" onClick={onClose}><ChevronRight size={18} className={styles.backChevron} />Perfil</button><button className={styles.closeButtonInline} type="button" aria-label="Fechar suporte" onClick={onClose}><X size={21} /></button></div>
      <ViewHeading eyebrow="AJUDA SENAI FLOW" title="Central de Suporte" description="Consulte as respostas ou envie sua dúvida para a equipe." onRefresh={onRetry} refreshing={refreshing} />
      <div className={styles.supportSectionTitle}><CircleHelp size={19} /><h2>Perguntas frequentes</h2></div>
      {loading && <LoadingState />}
      {!loading && error && <><ErrorState message={error} /><button className={styles.retryButton} type="button" onClick={onRetry}>Tentar novamente</button></>}
      {!loading && !error && <>
        <div className={styles.faqCategories} role="group" aria-label="Filtrar categoria de perguntas">{categories.map((item) => <button key={item} type="button" className={category === item ? styles.faqCategoryActive : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
        <div className={styles.faqList}>
          {filtered.map((faq) => <article className={styles.faqItem} key={faq.id_faq}>
            <button type="button" aria-expanded={openFaq === faq.id_faq} onClick={() => setOpenFaq(openFaq === faq.id_faq ? null : faq.id_faq)}><span>{faq.pergunta}</span><ChevronDown size={18} className={openFaq === faq.id_faq ? styles.chevronOpen : ""} /></button>
            {openFaq === faq.id_faq && <p>{faq.resposta}</p>}
          </article>)}
          {!filtered.length && <p className={styles.noFaq}>Nenhuma pergunta cadastrada nesta categoria.</p>}
        </div>
      </>}
      <div className={styles.supportDivider} />
      <div className={styles.supportSectionTitle}><MessageSquareText size={19} /><h2>Abrir chamado</h2></div>
      <form className={styles.ticketForm} onSubmit={submit}>
        <label htmlFor="ticket-subject">Assunto do chamado</label>
        <input id="ticket-subject" value={assunto} onChange={(event) => setAssunto(event.target.value.slice(0, 255))} maxLength={255} required placeholder="Ex.: acesso ao portal" />
        <label htmlFor="ticket-description">Descreva a dúvida ou problema</label>
        <textarea id="ticket-description" value={descricao} onChange={(event) => setDescricao(event.target.value.slice(0, 255))} maxLength={255} minLength={30} rows={4} required placeholder="Inclua detalhes para que possamos ajudar..." />
        <div className={styles.charCount}>{descricao.length}/255 · mínimo 30</div>
        <button className={styles.primaryAction} disabled={submitting || !assunto.trim() || descricao.trim().length < 30}><MessageSquareText size={18} aria-hidden="true" />{submitting ? "Enviando..." : "Enviar chamado"}</button>
      </form>
    </section>
  );
}

function SectionTitle({ title, count, refreshing, onRefresh }: { title: string; count: number; refreshing: boolean; onRefresh: () => void }) {
  return <div className={styles.sectionTitle}><h2>{title}</h2><div className={styles.sectionActions}><span>{count}</span><button className={styles.refreshButton} type="button" aria-label="Atualizar mural da turma" title="Atualizar mural" onClick={onRefresh} disabled={refreshing}><RefreshCw size={16} className={refreshing ? styles.refreshing : ""} /></button></div></div>;
}

function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
}

function ReportCard({ item }: { item: Relato }) {
  const answered = Boolean(item.resposta?.trim());
  const statusClass = reportStatusClass(item.status);
  return <article className={styles.reportCard}>
    <div className={styles.reportCardTop}><span className={styles.reportType}>{item.tipo === "SUGESTAO" ? "SUGESTÃO" : "RECLAMAÇÃO"}</span><span className={`${styles.reportStatus} ${styles[statusClass]}`}>{reportStatusLabel(item.status)}</span></div>
    <p className={styles.reportDescription}>{item.descricao}</p>
    <time className={styles.reportDate} dateTime={item.dt_envio}>{formatDateTime(item.dt_envio)}</time>
    <div className={styles.responseLabel}><span className={`${styles.responseDot} ${answered ? styles.responseReceived : ""}`} />{answered ? "Resposta recebida" : "Aguardando retorno"}</div>
    {answered && <div className={styles.adminResponse}><span>Resposta da administração</span><p>{item.resposta}</p></div>}
  </article>;
}

function useCurrentTime() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

function isAnnouncementCurrent(item: Comunicado, now: number) {
  const publishedAt = Date.parse(item.dt_publicacao);
  const age = now - publishedAt;
  return Number.isFinite(publishedAt) && age >= 0 && age < 48 * 60 * 60 * 1000;
}

function isCloudinaryImage(value: string) {
  try {
    const imageUrl = new URL(value);
    return imageUrl.protocol === "https:" && imageUrl.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

function reportStatusClass(status: string) {
  if (status === "PENDENTE") return "reportPending";
  if (status === "ENVIADO") return "reportSent";
  if (status === "LIDO") return "reportRead";
  if (status === "CORPORATIVO") return "reportCorporate";
  return "reportUnknown";
}

function reportStatusLabel(status: string) {
  if (status === "PENDENTE") return "Pendente";
  if (status === "ENVIADO") return "Enviado";
  if (status === "LIDO") return "Lido";
  if (status === "CORPORATIVO") return "Encaminhado ao corporativo";
  return status;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data não disponível";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}