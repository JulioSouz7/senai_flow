import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import ImageZoom from 'react-native-image-pan-zoom';
import { api } from '../../services/api';
import { RefreshButton } from '../../components/RefreshButton';

interface Props {
  notify?: (text: string) => void;
}

interface Predio {
  id_predio: number;
  nome: string;
}

interface AreaRisco {
  id_area: number;
  id_predio: number;
  nome: string;
  tipo: string;
  orientacao_seguranca: string;
  andar: number;
  imagem_url: string | null;
  status?: string;
  predio?: Predio;
}

interface FormMapa {
  id_predio: string;
  nome: string;
  tipo: string;
  orientacao_seguranca: string;
  andar: string;
}

interface ImagemSelecionada {
  uri: string;
  name: string;
  type: string;
}

const TIPOS_RISCO = [
  { value: 'GERAL', label: 'Geral / Planta completa' },
  { value: 'ROTA_DE_FUGA', label: 'Rota de fuga / Evacuação' },
  { value: 'FISICO', label: 'Risco físico' },
  { value: 'QUIMICO', label: 'Risco químico' },
  { value: 'BIOLOGICO', label: 'Risco biológico' },
  { value: 'ERGONOMICO', label: 'Risco ergonômico' },
  { value: 'ACIDENTES', label: 'Acidentes / Mecânico' },
];

const MAP_WIDTH = Math.max(Dimensions.get('window').width - 52, 200);
const MAP_HEIGHT = 300;

function extrairLista<T>(data: any, chave: string): T[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[chave])) return data[chave];
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function normalizarArea(area: any): AreaRisco {
  return {
    ...area,
    imagem_url:
      area?.imagem_url ??
      area?.url_imagem ??
      area?.imagem ??
      null,
  } as AreaRisco;
}

function nomeAndar(andar: number) {
  if (andar === 0) return 'Subsolo';
  if (andar === 1) return 'Térreo';
  return `${andar - 1}º andar`;
}

function resolverUrlImagem(url?: string | null) {
  if (!url) return '';

  const baseUrl = api.defaults.baseURL || '';
  const origemServidor =
    baseUrl.match(/^(https?:\/\/[^/]+)/i)?.[1] || '';

  if (/^https?:\/\//i.test(url)) {
    // Troca localhost pelo host configurado na API, caso a URL venha do backend assim.
    if (
      origemServidor &&
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(url)
    ) {
      return url.replace(
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i,
        origemServidor,
      );
    }

    return url;
  }

  if (/^(file:|content:|data:|blob:)/i.test(url)) {
    return url;
  }

  const caminho = url.replace(/\\/g, '/').replace(/^\/+/, '');
  return origemServidor ? `${origemServidor}/${caminho}` : url;
}

const formularioInicial: FormMapa = {
  id_predio: '',
  nome: '',
  tipo: 'GERAL',
  orientacao_seguranca: '',
  andar: '1',
};

export function RiskMapScreen({ notify }: Props) {
  const [areas, setAreas] = useState<AreaRisco[]>([]);
  const [predios, setPredios] = useState<Predio[]>([]);
  const [andarSelecionado, setAndarSelecionado] = useState(1);
  const [areaSelecionadaId, setAreaSelecionadaId] = useState<number | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imagemFalhou, setImagemFalhou] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [editando, setEditando] = useState<AreaRisco | null>(null);
  const [imagem, setImagem] = useState<ImagemSelecionada | null>(null);
  const [previewImagem, setPreviewImagem] = useState('');
  const [form, setForm] = useState<FormMapa>(formularioInicial);

  const avisar = (mensagem: string) => {
    if (notify) {
      notify(mensagem);
    } else {
      Alert.alert('Mapa de risco', mensagem);
    }
  };

  const buscarDados = async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    let failedBuildings = false;

    try {
      const [areasResposta, prediosResposta] = await Promise.all([
        api.get('/areas-risco'),
        api.get('/predios').catch(() => {
          failedBuildings = true;
          return { data: [] };
        }),
      ]);

      const areasRaw = extrairLista<any>(areasResposta.data, 'areas');
      const listaAreas = areasRaw.map(normalizarArea);
      const listaPredios = extrairLista<Predio>(
        prediosResposta.data,
        'predios',
      );

      setAreas(listaAreas);

      if (listaPredios.length > 0) {
        setPredios(listaPredios);
      } else {
        const encontrados = new Map<number, Predio>();

        listaAreas.forEach((area) => {
          if (area.predio?.id_predio) {
            encontrados.set(area.predio.id_predio, area.predio);
          } else if (area.id_predio) {
            encontrados.set(area.id_predio, {
              id_predio: area.id_predio,
              nome: `Prédio ${area.id_predio}`,
            });
          }
        });

        setPredios(Array.from(encontrados.values()));
      }
      if (manual) avisar(failedBuildings ? 'Mapas atualizados, mas não foi possível carregar os prédios.' : 'Mapas de risco atualizados.');
    } catch (error: any) {
      console.error(
        'Erro ao carregar mapas de risco:',
        error?.response?.data || error,
      );
      setAreas([]);
      avisar(manual ? 'Não foi possível atualizar os mapas de risco.' : 'Não foi possível carregar os mapas de risco.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void buscarDados();
    // Busca inicial ao abrir a tela.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const andaresDisponiveis = useMemo(
    () =>
      Array.from(
        new Set([
          1,
          2,
          ...areas
            .map((area) => Number(area.andar))
            .filter((andar) => Number.isFinite(andar)),
        ]),
      ).sort((a, b) => a - b),
    [areas],
  );

  const areasDoAndar = areas.filter(
    (area) => Number(area.andar) === andarSelecionado,
  );

  const areaAtual =
    areasDoAndar.find((area) => area.id_area === areaSelecionadaId) ||
    areasDoAndar[0];

  useEffect(() => {
    setImagemFalhou(false);
  }, [areaAtual?.id_area, areaAtual?.imagem_url]);

  const atualizarCampo = (campo: keyof FormMapa, valor: string) => {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  };

  const abrirCadastro = () => {
    setEditando(null);
    setImagem(null);
    setPreviewImagem('');
    setForm({
      ...formularioInicial,
      id_predio: predios[0]?.id_predio
        ? String(predios[0].id_predio)
        : '',
      andar: String(andarSelecionado),
    });
    setModalAberto(true);
  };

  const abrirEdicao = (area: AreaRisco) => {
    setEditando(area);
    setImagem(null);
    setPreviewImagem(resolverUrlImagem(area.imagem_url));
    setForm({
      id_predio: String(area.id_predio || predios[0]?.id_predio || ''),
      nome: area.nome || '',
      tipo: area.tipo || 'GERAL',
      orientacao_seguranca: area.orientacao_seguranca || '',
      andar: String(area.andar ?? 1),
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    if (salvando) return;

    setModalAberto(false);
    setEditando(null);
    setImagem(null);
    setPreviewImagem('');
  };

  const selecionarImagem = async () => {
    try {
      const permissao =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissao.granted) {
        avisar('Permita o acesso à galeria para selecionar uma imagem.');
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

      if (resultado.canceled || !resultado.assets[0]) return;

      const asset = resultado.assets[0];
      const nomeArquivo =
        asset.fileName || `mapa-risco-${Date.now()}.jpg`;
      const tipoArquivo = asset.mimeType || 'image/jpeg';

      setImagem({
        uri: asset.uri,
        name: nomeArquivo,
        type: tipoArquivo,
      });
      setPreviewImagem(asset.uri);
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      avisar('Não foi possível selecionar a imagem.');
    }
  };

  const salvarMapa = async () => {
    const idPredio = Number(form.id_predio);
    const andar = Number(form.andar);

    if (!idPredio || !Number.isFinite(idPredio)) {
      avisar('Selecione um prédio válido.');
      return;
    }

    if (!form.nome.trim()) {
      avisar('Informe o nome do mapa ou setor.');
      return;
    }

    if (!form.orientacao_seguranca.trim()) {
      avisar('Informe a orientação de segurança.');
      return;
    }

    if (form.andar.trim() === '' || !Number.isFinite(andar)) {
      avisar('Informe um andar válido.');
      return;
    }

    const dados = new FormData();
    dados.append('id_predio', String(idPredio));
    dados.append('nome', form.nome.trim());
    dados.append('tipo', form.tipo.toUpperCase());
    dados.append(
      'orientacao_seguranca',
      form.orientacao_seguranca.trim(),
    );
    dados.append('andar', String(andar));

    if (imagem) {
      dados.append(
        'imagem',
        {
          uri: imagem.uri,
          name: imagem.name,
          type: imagem.type,
        } as any,
      );
    }

    try {
      setSalvando(true);

      if (editando) {
        await api.put(`/areas-risco/${editando.id_area}`, dados);
        avisar('Mapa de risco atualizado com sucesso.');
      } else {
        await api.post('/areas-risco', dados);
        avisar('Mapa de risco cadastrado com sucesso.');
      }

      setAndarSelecionado(andar);
      setAreaSelecionadaId(editando?.id_area ?? null);
      setModalAberto(false);
      setEditando(null);
      setImagem(null);
      setPreviewImagem('');
      await buscarDados();
    } catch (error: any) {
      console.error(
        'Erro ao salvar mapa:',
        error?.response?.data || error,
      );
      avisar(
        error?.response?.data?.message ||
          error?.response?.data?.erro ||
          'Não foi possível salvar o mapa de risco.',
      );
    } finally {
      setSalvando(false);
    }
  };

  const confirmarDesativacao = (area: AreaRisco) => {
    Alert.alert('Desativar mapa', `Deseja desativar "${area.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desativar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.patch(`/areas-risco/${area.id_area}/desativar`);
            avisar(`Mapa "${area.nome}" desativado.`);
            setAreaSelecionadaId(null);
            await buscarDados();
          } catch (error: any) {
            console.error(
              'Erro ao desativar mapa:',
              error?.response?.data || error,
            );
            avisar(
              error?.response?.data?.message ||
                'Não foi possível desativar o mapa.',
            );
          }
        },
      },
    ]);
  };

  const urlImagemAtual = resolverUrlImagem(areaAtual?.imagem_url);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.eyebrow}>SEGURANÇA E ACESSIBILIDADE</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text style={styles.title}>Mapa de risco</Text>
        <RefreshButton refreshing={refreshing} onPress={() => void buscarDados(true)} />
      </View>
      <Text style={styles.subtitle}>
        {areaAtual?.nome || 'Nenhum mapa cadastrado neste andar'}
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={abrirCadastro}>
        <Text style={styles.primaryButtonText}>+ Novo mapa de risco</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Andar</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalList}
      >
        {andaresDisponiveis.map((andar) => {
          const ativo = andarSelecionado === andar;

          return (
            <TouchableOpacity
              key={andar}
              style={[styles.chip, ativo && styles.chipActive]}
              onPress={() => {
                setAndarSelecionado(andar);
                setAreaSelecionadaId(null);
              }}
            >
              <Text style={[styles.chipText, ativo && styles.chipTextActive]}>
                {nomeAndar(andar)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {areasDoAndar.length > 1 && (
        <>
          <Text style={styles.sectionTitle}>Mapas deste andar</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalList}
          >
            {areasDoAndar.map((area) => {
              const ativo = areaAtual?.id_area === area.id_area;

              return (
                <TouchableOpacity
                  key={area.id_area}
                  style={[styles.chip, ativo && styles.chipActive]}
                  onPress={() => setAreaSelecionadaId(area.id_area)}
                >
                  <Text
                    numberOfLines={1}
                    style={[styles.chipText, ativo && styles.chipTextActive]}
                  >
                    {area.nome}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      )}

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#dc2626"
          style={styles.loader}
        />
      ) : (
        <>
          {areaAtual ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>ORIENTAÇÃO DE SEGURANÇA</Text>
              <Text style={styles.infoText}>
                {areaAtual.orientacao_seguranca ||
                  'Nenhuma orientação cadastrada.'}
              </Text>
              <Text style={styles.riskType}>
                Tipo: {(areaAtual.tipo || 'GERAL').replace(/_/g, ' ')}
              </Text>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                Nenhum mapa encontrado para este andar.
              </Text>
            </View>
          )}

          {areaAtual?.imagem_url && !imagemFalhou ? (
            <View style={styles.imageCard}>
              <ImageZoom
                cropWidth={MAP_WIDTH}
                cropHeight={MAP_HEIGHT}
                imageWidth={MAP_WIDTH}
                imageHeight={MAP_HEIGHT}
                minScale={1}
                maxScale={4}
                enableCenterFocus
              >
                <Image
                  source={{ uri: urlImagemAtual }}
                  style={styles.mapImage}
                  resizeMode="contain"
                  onError={(event) => {
                    console.warn(
                      'Falha ao carregar imagem do mapa:',
                      urlImagemAtual,
                      event.nativeEvent,
                    );
                    setImagemFalhou(true);
                  }}
                />
              </ImageZoom>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {areaAtual?.imagem_url && imagemFalhou
                  ? 'Não foi possível carregar a imagem. Verifique a URL e o acesso ao servidor.'
                  : areaAtual
                    ? 'Este mapa ainda não possui uma imagem.'
                    : 'Cadastre um mapa para este andar.'}
              </Text>
            </View>
          )}

          {areaAtual && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => abrirEdicao(areaAtual)}
              >
                <Text style={styles.secondaryButtonText}>Editar mapa</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dangerButton}
                onPress={() => confirmarDesativacao(areaAtual)}
              >
                <Text style={styles.dangerButtonText}>Desativar</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      <Modal
        visible={modalAberto}
        transparent
        animationType="slide"
        onRequestClose={fecharModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editando ? 'Editar mapa de risco' : 'Novo mapa de risco'}
                </Text>

                <TouchableOpacity onPress={fecharModal} disabled={salvando}>
                  <Text style={styles.closeText}>Fechar</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Prédio</Text>
              {predios.length > 0 ? (
                <View style={styles.choiceList}>
                  {predios.map((predio) => {
                    const selecionado =
                      form.id_predio === String(predio.id_predio);

                    return (
                      <TouchableOpacity
                        key={predio.id_predio}
                        style={[
                          styles.choice,
                          selecionado && styles.choiceActive,
                        ]}
                        onPress={() =>
                          atualizarCampo(
                            'id_predio',
                            String(predio.id_predio),
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.choiceText,
                            selecionado && styles.choiceTextActive,
                          ]}
                        >
                          {predio.nome}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <TextInput
                  style={styles.input}
                  value={form.id_predio}
                  onChangeText={(valor) =>
                    atualizarCampo('id_predio', valor)
                  }
                  placeholder="ID do prédio"
                  keyboardType="numeric"
                />
              )}

              <Text style={styles.label}>Andar</Text>
              <TextInput
                style={styles.input}
                value={form.andar}
                onChangeText={(valor) => atualizarCampo('andar', valor)}
                placeholder="Ex.: 1"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Nome do mapa / setor</Text>
              <TextInput
                style={styles.input}
                value={form.nome}
                onChangeText={(valor) => atualizarCampo('nome', valor)}
                placeholder="Ex.: Bloco D - Térreo"
              />

              <Text style={styles.label}>Tipo de risco</Text>
              <View style={styles.choiceList}>
                {TIPOS_RISCO.map((tipo) => {
                  const selecionado = form.tipo === tipo.value;

                  return (
                    <TouchableOpacity
                      key={tipo.value}
                      style={[
                        styles.choice,
                        selecionado && styles.choiceActive,
                      ]}
                      onPress={() => atualizarCampo('tipo', tipo.value)}
                    >
                      <Text
                        style={[
                          styles.choiceText,
                          selecionado && styles.choiceTextActive,
                        ]}
                      >
                        {tipo.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Orientação de segurança</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={form.orientacao_seguranca}
                onChangeText={(valor) =>
                  atualizarCampo('orientacao_seguranca', valor)
                }
                placeholder="Descreva rotas de fuga, pontos de encontro, extintores e EPIs."
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.label}>Imagem da planta / mapa</Text>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => void selecionarImagem()}
              >
                <Text style={styles.secondaryButtonText}>
                  {imagem ? 'Trocar imagem' : 'Selecionar imagem'}
                </Text>
              </TouchableOpacity>

              {!!previewImagem && (
                <Image
                  source={{ uri: previewImagem }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={fecharModal}
                  disabled={salvando}
                >
                  <Text style={styles.secondaryButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    salvando && styles.disabledButton,
                  ]}
                  onPress={() => void salvarMapa()}
                  disabled={salvando}
                >
                  <Text style={styles.primaryButtonText}>
                    {salvando ? 'Salvando...' : 'Salvar mapa'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  container: { padding: 16, paddingBottom: 32 },
  eyebrow: { color: '#dc2626', fontSize: 10, fontWeight: '800' },
  title: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 5,
  },
  subtitle: { color: '#64748b', fontSize: 13, marginTop: 5 },
  sectionTitle: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  primaryButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  disabledButton: { opacity: 0.55 },
  horizontalList: { flexGrow: 0 },
  chip: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 8,
    marginRight: 8,
    maxWidth: 220,
  },
  chipActive: { backgroundColor: '#fef2f2', borderColor: '#dc2626' },
  chipText: { color: '#475569', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#dc2626' },
  loader: { marginVertical: 32 },
  infoCard: {
    marginTop: 18,
    padding: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
  },
  infoLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 6,
  },
  infoText: { color: '#1e293b', fontSize: 13, lineHeight: 19 },
  riskType: { color: '#64748b', fontSize: 11, marginTop: 9 },
  imageCard: {
    marginTop: 14,
    height: MAP_HEIGHT,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mapImage: { width: MAP_WIDTH, height: MAP_HEIGHT },
  emptyCard: {
    marginTop: 14,
    padding: 22,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
  },
  emptyText: { color: '#64748b', fontSize: 13, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { color: '#334155', fontSize: 12, fontWeight: '700' },
  dangerButton: {
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonText: { color: '#dc2626', fontSize: 12, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    padding: 14,
  },
  modalCard: {
    maxHeight: '92%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: { color: '#0f172a', fontSize: 17, fontWeight: '800' },
  closeText: { color: '#dc2626', fontWeight: '700' },
  label: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 13,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 10,
    color: '#0f172a',
    fontSize: 13,
  },
  multilineInput: { minHeight: 92 },
  choiceList: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  choice: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  choiceActive: { borderColor: '#dc2626', backgroundColor: '#fef2f2' },
  choiceText: { color: '#475569', fontSize: 11, fontWeight: '600' },
  choiceTextActive: { color: '#dc2626' },
  previewImage: {
    width: '100%',
    height: 180,
    marginTop: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    marginBottom: 8,
  },
});