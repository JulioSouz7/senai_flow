import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api, getApiError } from '@/services/api';
import { useFeedback } from '@/components/FeedbackProvider';
import { RefreshButton } from '@/components/RefreshButton';

interface ItemRanking {
  posicao: number;
  id_sala: number;
  nome_sala: string;
  predio: string;
  total_pontos: number;
  total_avaliacoes: number;
  semestre_letivo: string;
}

export default function RankingScreen() {
  const { notify } = useFeedback();
  const [ranking, setRanking] = useState<ItemRanking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);
  const now = new Date();
  const semestreLetivo = `${now.getFullYear()}/${now.getMonth() < 6 ? '1' : '2'}`;

  const fetchPontuacao = async (manual = false) => {
    try {
      setLoading(true);
      const response = await api.get(`/pontuacoes/ranking?semestre_letivo=${semestreLetivo}`);
      const data = response.data;
      setRanking(Array.isArray(data) ? data : []);
      if (manual) notify('Ranking atualizado.', 'success');
    } catch (error) {
      console.error('Erro ao buscar pontuação:', error);
      notify(getApiError(error, 'Não foi possível carregar o ranking.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPontuacao();
  }, [semestreLetivo]);

  // Calcula o total acumulado das salas retornadas
  const totalPontos = ranking.reduce((acc, item) => acc + (item.total_pontos || 0), 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e30613" />
        <Text style={styles.loadingText}>A carregar pontuações...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Ocultar este cabeçalho caso você já o exiba no WorkspaceScreen */}
      <View style={styles.moduleHeading}>
        <View style={styles.headingRow}>
          <View style={styles.headingCopy}>
            <Text style={styles.eyebrow}>CONSERVAÇÃO</Text>
            <Text style={styles.pageTitle}>Placar de pontuação</Text>
          </View>
          <RefreshButton label="ranking" refreshing={refreshing} onPress={async () => {
            if (refreshing) return;
            setRefreshing(true);
            await fetchPontuacao(true);
            setRefreshing(false);
          }} />
        </View>
        <Text style={styles.pageSubtitle}>Pontos acumulados no semestre {semestreLetivo}.</Text>
      </View>

      {/* Exibição do total de pontos */}
      <View style={styles.scoreCard}>
        <View style={styles.iconContainer}>
          <Feather name="award" size={38} color="#fbbf24" />
        </View>
        <View style={styles.scoreContent}>
          <Text style={styles.scoreLabel}>TOTAL DE PONTOS</Text>
          <Text style={styles.scoreValue}>{totalPontos.toLocaleString('pt-BR')}</Text>
          <Text style={styles.scoreDescription}>pontos disponíveis no semestre</Text>
        </View>
      </View>

      <View style={styles.mobileTitleContainer}>
        <Text style={styles.sectionTitle}>Ranking por sala</Text>
        <Text style={styles.sectionSubtitle}>Semestre {semestreLetivo}</Text>
      </View>

      {/* Lista do Ranking */}
      <View style={styles.rankingList}>
        {ranking.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma pontuação encontrada.</Text>
        ) : (
          ranking.map((item) => {
            const isFirstPlace = item.posicao === 1;
            return (
              <View 
                key={item.id_sala} 
                style={[styles.rankingItem, isFirstPlace && styles.rankingItemFirst]}
              >
                <View style={styles.itemLeft}>
                  <View style={[styles.positionBadge, isFirstPlace && styles.positionBadgeFirst]}>
                    <Text style={[styles.positionText, isFirstPlace && styles.positionTextFirst]}>
                      {item.posicao}
                    </Text>
                  </View>
                  <View style={styles.roomInfo}>
                    <Text style={styles.roomName}>
                      {item.nome_sala} <Text style={styles.roomBuilding}>({item.predio})</Text>
                    </Text>
                  </View>
                </View>
                <Text style={styles.pointsText}>{item.total_pontos} pts</Text>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
  moduleHeading: {
    marginBottom: 20,
  },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  headingCopy: { flex: 1, minWidth: 0 },
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
  },
  scoreCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    marginRight: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreContent: {
    flex: 1,
  },
  scoreLabel: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scoreValue: {
    color: '#ffffff',
    fontSize: 38,
    fontWeight: '800',
    lineHeight: 44,
  },
  scoreDescription: {
    color: '#9ca3af',
    fontSize: 11,
  },
  mobileTitleContainer: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionSubtitle: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  rankingList: {
    flexDirection: 'column',
    gap: 10, // Espaçamento entre os cards
  },
  emptyText: {
    padding: 16,
    color: '#6b7280',
    fontSize: 14,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  rankingItemFirst: {
    backgroundColor: '#fff0f1',
    borderColor: '#fca5a5',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  positionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  positionBadgeFirst: {
    backgroundColor: '#ffffff',
  },
  positionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  positionTextFirst: {
    color: '#111827',
  },
  roomInfo: {
    flex: 1,
    paddingRight: 8,
  },
  roomName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  roomBuilding: {
    fontWeight: '400',
    color: '#6b7280',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
});