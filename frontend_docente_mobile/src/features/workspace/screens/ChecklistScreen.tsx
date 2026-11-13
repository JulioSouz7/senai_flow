import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Linking 
} from 'react-native';
import { Feather } from '@expo/vector-icons';

// Interfaces originais mantidas
interface ReservaHorario {
  dt_reserva?: string;
  hora_inicio?: string;
  hora_fim?: string;
}

interface Reserva {
  sala?: { nome: string } | null;
  turma?: { nome: string } | null;
  reserva_horario?: ReservaHorario | ReservaHorario[];
  reservaHorario?: ReservaHorario | ReservaHorario[];
}

interface ChecklistProps {
  notify?: (x: string) => void;
  onConfirm: (dados: any) => void;
  reserva: Reserva;
}

export default function Checklist({ onConfirm, reserva, notify }: ChecklistProps) {
  const [checked, setChecked] = useState<string[]>([]);

  const items = [
    "Mesas e cadeiras estão organizadas",
    "Equipamentos foram desligados",
    "Sala está limpa",
    "Ar-condicionado e luzes desligados",
  ];

  // Extração segura dos dados da reserva[cite: 9]
  const salaNome = reserva.sala?.nome || "Sala Indefinida";
  const turmaNome = reserva.turma?.nome || "Turma Indefinida";
  
  const relacaoHorario = reserva.reserva_horario || reserva.reservaHorario;
  const horarioObj = Array.isArray(relacaoHorario) ? relacaoHorario[0] : relacaoHorario;
  const horaInicio = horarioObj?.hora_inicio?.substring(0, 5) || "00:00";
  const horaFim = horarioObj?.hora_fim?.substring(0, 5) || "00:00";

  const handleConfirmar = () => {
    const sala_em_ordem = checked.length === items.length;
    
    let observacoes = "Encerrado via app docente. ";
    if (checked.length > 0) {
      observacoes += `Itens confirmados: ${checked.length}/${items.length}.`;
    } else {
      observacoes += "Nenhum item do checklist foi marcado.";
    }

    onConfirm({
      sala_em_ordem,
      houve_avaria: false,
      observacoes
    });
  };

  const toggleItem = (item: string) => {
    setChecked((prev) => 
      prev.includes(item) 
        ? prev.filter((x) => x !== item) 
        : [...prev, item]
    );
  };

  const handleOpenForm = () => {
    // Abre o link do Google Forms no navegador padrão do dispositivo[cite: 9]
    Linking.openURL("https://forms.gle/Cy99kENVLJ4Ht7Mk8");
  };

  return (
    <View style={styles.container}>
      {/* Título da Página */}
      <View style={styles.moduleHeading}>
        <Text style={styles.eyebrow}>CONSERVAÇÃO E PONTUAÇÃO</Text>
        <Text style={styles.pageTitle}>Encerrar uso da sala</Text>
        <Text style={styles.pageSubtitle}>
          Confirme as condições do ambiente para liberar a pontuação da turma.
        </Text>
      </View>

      {/* Painel do Checklist[cite: 9] */}
      <View style={styles.panel}>
        
        {/* Resumo da Aula */}
        <View style={styles.classSummary}>
          <View style={styles.iconBox}>
            <Feather name="layout" size={24} color="#e30613" />
          </View>
          
          <View style={styles.classInfo}>
            <Text style={styles.roomName}>{salaNome}</Text>
            <Text style={styles.className}>{turmaNome} • {horaInicio}–{horaFim}</Text>
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>EM ANDAMENTO</Text>
          </View>
        </View>

        {/* Callout de Pontos */}
        <View style={styles.pointsCallout}>
          <Feather name="award" size={20} color="#d97706" />
          <Text style={styles.pointsText}>
            O bom estado da sala oferece à turma 20 pontos no ranking semestral.
          </Text>
        </View>

        {/* Lista de Checkboxes */}
        <View style={styles.checklistContainer}>
          {items.map((item) => {
            const isChecked = checked.includes(item);
            return (
              <TouchableOpacity 
                key={item} 
                style={[styles.checkItem, isChecked && styles.checkItemActive]} 
                activeOpacity={0.7}
                onPress={() => toggleItem(item)}
              >
                <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>
                  {isChecked && <Feather name="check" size={14} color="#e30613" />}
                </View>
                <Text style={styles.checkText}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Botão de Avaria[cite: 9] */}
        <TouchableOpacity style={styles.damageLink} onPress={handleOpenForm}>
          <Feather name="alert-triangle" size={16} color="#e30613" />
          <Text style={styles.damageText}>Encontrei uma avaria nesta sala</Text>
        </TouchableOpacity>
        
        {/* Botão de Confirmação */}
        <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirmar}>
          <Text style={styles.primaryBtnText}>Confirmar entrega e encerrar aula</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  moduleHeading: {
    marginBottom: 20,
  },
  eyebrow: {
    color: '#e30613',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  pageTitle: {
    marginTop: 4,
    color: '#111827',
    fontSize: 24,
    fontWeight: '400',
  },
  pageSubtitle: {
    marginTop: 4,
    color: '#6b7280',
    fontSize: 12,
    lineHeight: 18,
  },
  panel: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 20,
    marginBottom: 20,
  },
  classSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBox: {
    width: 48,
    height: 48,
    backgroundColor: '#fff0f1',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  classInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  className: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#166534',
    fontSize: 10,
    fontWeight: '700',
  },
  pointsCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  pointsText: {
    marginLeft: 12,
    fontSize: 12,
    color: '#92400e',
    flex: 1,
  },
  checklistContainer: {
    marginBottom: 24,
    gap: 12, // Espaçamento entre os itens
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  checkItemActive: {
    borderColor: '#e30613',
    backgroundColor: '#fff0f1',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    borderColor: '#e30613',
    backgroundColor: '#ffffff',
  },
  checkText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  damageLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  damageText: {
    marginLeft: 8,
    color: '#e30613',
    fontSize: 13,
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: '#e30613',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});