import { Icon } from "../../components/icons/Icon";

function Feed({ go }: { go:(n:number)=>void }) {
  return (
    <>
      <div className="mobile-greeting">
        <div>
          <span>QUARTA-FEIRA, 18 DE MARÇO</span>
          <h1>Olá, Lucas</h1>
          <p>DS2 • Desenvolvimento de Sistemas</p>
        </div>
        <span className="score-mini">
          <Icon name="trophy" size={15}/> 2.480 pts
        </span>
      </div>

      <article className="next-class">
        <div>
          <span>SUA PRÓXIMA AULA • 10:15</span>
          <h2>Banco de Dados</h2>
          <p>Prof. Carla Mendes</p>
        </div>
        <div>
          <Icon name="building"/>
          <b>Bloco D • Sala 04</b>
          <small>2º pavimento</small>
        </div>
      </article>

      <div className="student-score">
        <div>
          <Icon name="trophy"/>
          <span>
            <small>PONTUAÇÃO DA DS2</small>
            <b>2.480 pontos</b>
          </span>
        </div>
        <div>
          <b>Excelente</b>
          <small>94% de conservação</small>
        </div>
      </div>

      <div className="student-quick">
        <button onClick={()=>go(1)}>
          <Icon name="map"/>
          <span>Mapa de riscos</span>
        </button>
        <button onClick={()=>go(3)}>
          <Icon name="message"/>
          <span>Enviar relato</span>
        </button>
      </div>

      <div className="feed-tabs">
        <button className="active">Todos</button>
        <button>Minha turma</button>
        <button>Coordenação</button>
      </div>

      <div className="mobile-title">
        <div>
          <h2>Mural oficial</h2>
          <p>Comunicados da unidade</p>
        </div>
        <span>3 novos</span>
      </div>

      <section className="feed">
        {[["alert","ATENÇÃO","Simulado de evacuação","Nesta sexta-feira, às 10h. Consulte a rota do Bloco D e siga as orientações da Brigada.","Coordenação • Hoje, 08:30","pinned"],["message","MINHA TURMA","Apresentação do projeto integrador","As equipes deverão enviar a versão final até quinta-feira, às 18h.","Prof. André • Ontem, 17:45",""],["building","INSTITUCIONAL","Manutenção preventiva no Lab. D-03","O laboratório ficará indisponível durante o período da manhã.","Administração • 15 mar, 10:20",""]].map((x)=>
          <article className={`feed-card ${x[5]}`} key={x[2]}>
            <div className="feed-icon">
              <Icon name={x[0]}/>
            </div>
            <div>
              <span>{x[1]}</span>
              <h2>{x[2]}</h2>
              <p>{x[3]}</p>
              <small>{x[4]}</small>
            </div>
          </article>
        )}
      </section>
    </>
  );
}

export default Feed;
