import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useContactos } from '@/context/ContactosContext';
import { Contacto } from '@/services/contactosService';

export default function ContactosScreen() {
  const router = useRouter();
  const {
    contactos,
    cargando,
    refrescando,
    refrescar,
    fuenteConexion,
    eliminarContacto,
    actualizarContacto,
    toggleFavorito,
    cargarEjemplos,
  } = useContactos();

  // Búsqueda
  const [busqueda, setBusqueda] = useState('');

  // Modal de edición
  const [modalVisible, setModalVisible] = useState(false);
  const [contactoAEditar, setContactoAEditar] = useState<Contacto | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editApellido, setEditApellido] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editCorreo, setEditCorreo] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // Filtrado de contactos en tiempo real
  const contactosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return contactos;
    const q = busqueda.toLowerCase().trim();
    return contactos.filter((c) => {
      const nombreCompleto = `${c.nombre} ${c.apellido || ''}`.toLowerCase();
      const tel = (c.telefono || '').toLowerCase();
      const mail = (c.correo || '').toLowerCase();
      return nombreCompleto.includes(q) || tel.includes(q) || mail.includes(q);
    });
  }, [contactos, busqueda]);

  // Generar color consistente según el nombre
  const obtenerColorAvatar = (nombre: string) => {
    const colores = ['#2563EB', '#7C3AED', '#DB2777', '#059669', '#D97706', '#0891B2', '#4F46E5'];
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
      hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colores[Math.abs(hash) % colores.length];
  };

  // Obtener iniciales
  const obtenerIniciales = (nombre: string, apellido?: string) => {
    const p = nombre ? nombre.trim().charAt(0).toUpperCase() : '?';
    const s = apellido ? apellido.trim().charAt(0).toUpperCase() : '';
    return `${p}${s}`;
  };

  // Abrir modal de edición
  const iniciarEdicion = (contacto: Contacto) => {
    setContactoAEditar(contacto);
    setEditNombre(contacto.nombre || '');
    setEditApellido(contacto.apellido || '');
    setEditTelefono(contacto.telefono || '');
    setEditCorreo(contacto.correo || '');
    setModalVisible(true);
  };

  // Guardar cambios de edición
  const guardarEdicion = async () => {
    if (!editNombre.trim() || !editTelefono.trim() || !editCorreo.trim()) {
      if (Platform.OS === 'web') {
        alert('Por favor completa los campos obligatorios: Nombre, Teléfono y Correo.');
      } else {
        Alert.alert('Campos incompletos', 'Por favor completa Nombre, Teléfono y Correo.');
      }
      return;
    }

    if (contactoAEditar) {
      setGuardandoEdicion(true);
      const res = await actualizarContacto(contactoAEditar.id, {
        nombre: editNombre,
        apellido: editApellido,
        telefono: editTelefono,
        correo: editCorreo,
      });
      setGuardandoEdicion(false);

      if (res.ok) {
        setModalVisible(false);
        setContactoAEditar(null);
      } else {
        if (Platform.OS === 'web') {
          alert('Error al actualizar: ' + (res.error || 'Intenta de nuevo'));
        } else {
          Alert.alert('Error', res.error || 'No se pudo actualizar el contacto.');
        }
      }
    }
  };

  // Confirmar eliminación
  const confirmarEliminar = (contacto: Contacto) => {
    const nombreCompleto = `${contacto.nombre} ${contacto.apellido || ''}`.trim();
    if (Platform.OS === 'web') {
      if (window.confirm(`¿Seguro que deseas eliminar a "${nombreCompleto}" de tu agenda?`)) {
        eliminarContacto(contacto.id);
      }
      return;
    }

    Alert.alert(
      'Eliminar Contacto',
      `¿Seguro que deseas eliminar a "${nombreCompleto}" de tu agenda?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => eliminarContacto(contacto.id),
        },
      ]
    );
  };

  // Realizar llamada directa
  const llamarContacto = (telefono: string) => {
    const url = `tel:${telefono.replace(/\s+/g, '')}`;
    Linking.openURL(url).catch(() => {
      if (Platform.OS === 'web') {
        alert(`Llamar al número: ${telefono}`);
      }
    });
  };

  // Enviar correo directo
  const enviarCorreo = (correo: string) => {
    const url = `mailto:${correo}`;
    Linking.openURL(url).catch(() => {
      if (Platform.OS === 'web') {
        alert(`Enviar correo a: ${correo}`);
      }
    });
  };

  // Renderizar cada tarjeta de contacto
  const renderContacto = ({ item }: { item: Contacto }) => {
    const iniciales = obtenerIniciales(item.nombre, item.apellido);
    const avatarBg = obtenerColorAvatar(item.nombre);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          {/* Avatar con iniciales */}
          <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
            <Text style={styles.avatarTexto}>{iniciales}</Text>
          </View>

          {/* Información del contacto */}
          <View style={styles.infoContainer}>
            <View style={styles.filaTitulo}>
              <Text style={styles.nombre} numberOfLines={1}>
                {item.nombre} {item.apellido || ''}
              </Text>
              {/* Botón Favorito */}
              <TouchableOpacity
                onPress={() => toggleFavorito(item.id)}
                style={styles.btnFavorito}
                accessibilityLabel="Marcar favorito">
                <Ionicons
                  name={item.favorito ? 'star' : 'star-outline'}
                  size={20}
                  color={item.favorito ? '#F59E0B' : '#9CA3AF'}
                />
              </TouchableOpacity>
            </View>

            {/* Teléfono */}
            <TouchableOpacity
              style={styles.filaDato}
              onPress={() => llamarContacto(item.telefono)}
              activeOpacity={0.7}>
              <Ionicons name="call-outline" size={15} color="#2563EB" />
              <Text style={styles.textoDatoLink}>{item.telefono}</Text>
            </TouchableOpacity>

            {/* Correo */}
            <TouchableOpacity
              style={styles.filaDato}
              onPress={() => enviarCorreo(item.correo)}
              activeOpacity={0.7}>
              <Ionicons name="mail-outline" size={15} color="#2563EB" />
              <Text style={styles.textoDatoLink}>{item.correo}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Acciones de la tarjeta */}
        <View style={styles.accionesFila}>
          <TouchableOpacity
            style={[styles.btnAccion, styles.btnAccionLlamar]}
            onPress={() => llamarContacto(item.telefono)}>
            <Ionicons name="call" size={14} color="#2563EB" />
            <Text style={styles.btnTextoLlamar}>Llamar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnAccion, styles.btnAccionEditar]}
            onPress={() => iniciarEdicion(item)}>
            <Ionicons name="pencil" size={14} color="#D97706" />
            <Text style={styles.btnTextoEditar}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnAccion, styles.btnAccionEliminar]}
            onPress={() => confirmarEliminar(item)}>
            <Ionicons name="trash" size={14} color="#EF4444" />
            <Text style={styles.btnTextoEliminar}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.pantalla}>
      {/* Barra de estado de conexión */}
      <View style={styles.barraConexion}>
        <View style={styles.indicadorFila}>
          <View
            style={[
              styles.puntoConexion,
              { backgroundColor: fuenteConexion === 'nube' ? '#10B981' : '#F59E0B' },
            ]}
          />
          <Text style={styles.textoConexion}>
            {fuenteConexion === 'nube'
              ? 'Conectado a la nube (Supabase)'
              : 'Almacenamiento local activo'}
          </Text>
        </View>
        <Text style={styles.contadorBadge}>
          {contactosFiltrados.length} {contactosFiltrados.length === 1 ? 'contacto' : 'contactos'}
        </Text>
      </View>

      {/* Buscador */}
      <View style={styles.buscadorContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.iconoBuscador} />
        <TextInput
          style={styles.buscadorInput}
          placeholder="Buscar por nombre, teléfono o email..."
          placeholderTextColor="#9CA3AF"
          value={busqueda}
          onChangeText={setBusqueda}
          clearButtonMode="while-editing"
        />
        {busqueda.length > 0 && (
          <TouchableOpacity onPress={() => setBusqueda('')} style={styles.btnLimpiarBusqueda}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Listado con Pull to Refresh */}
      {cargando ? (
        <View style={styles.centrado}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.textoCargando}>Cargando agenda...</Text>
        </View>
      ) : (
        <FlatList
          data={contactosFiltrados}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderContacto}
          contentContainerStyle={styles.listaContenido}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={refrescar}
              colors={['#2563EB']}
              tintColor="#2563EB"
            />
          }
          ListEmptyComponent={
            <View style={styles.vacioContainer}>
              <Ionicons
                name={busqueda ? 'search-outline' : 'people-outline'}
                size={64}
                color="#CBD5E1"
              />
              <Text style={styles.vacioTitulo}>
                {busqueda ? 'Sin coincidencias' : 'Tu agenda está vacía'}
              </Text>
              <Text style={styles.vacioSubtitulo}>
                {busqueda
                  ? `No encontramos resultados para "${busqueda}".`
                  : 'Empieza registrando tu primer contacto o carga datos de prueba.'}
              </Text>
              <View style={styles.vacioBotones}>
                <TouchableOpacity
                  style={styles.btnCrearVacio}
                  onPress={() => router.push('/nuevo')}>
                  <Ionicons name="person-add" size={16} color="#FFFFFF" />
                  <Text style={styles.btnCrearVacioTexto}>Nuevo Contacto</Text>
                </TouchableOpacity>
                {!busqueda && (
                  <TouchableOpacity style={styles.btnEjemploVacio} onPress={cargarEjemplos}>
                    <Ionicons name="cloud-download-outline" size={16} color="#2563EB" />
                    <Text style={styles.btnEjemploVacioTexto}>Cargar Ejemplos</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          }
        />
      )}

      {/* Botón flotante para crear contacto */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/nuevo')}
        activeOpacity={0.85}
        accessibilityLabel="Agregar nuevo contacto">
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      {/* MODAL DE EDICIÓN */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}>
          <View style={styles.modalContenido}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Editar Contacto</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalBtnCerrar}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.labelInput}>Nombre *</Text>
            <TextInput
              style={styles.modalInput}
              value={editNombre}
              onChangeText={setEditNombre}
              placeholder="Ej: Pamela"
            />

            <Text style={styles.labelInput}>Apellido</Text>
            <TextInput
              style={styles.modalInput}
              value={editApellido}
              onChangeText={setEditApellido}
              placeholder="Ej: Macías"
            />

            <Text style={styles.labelInput}>Teléfono *</Text>
            <TextInput
              style={styles.modalInput}
              value={editTelefono}
              onChangeText={setEditTelefono}
              keyboardType="phone-pad"
              placeholder="Ej: +593 98 765 4321"
            />

            <Text style={styles.labelInput}>Correo Electrónico *</Text>
            <TextInput
              style={styles.modalInput}
              value={editCorreo}
              onChangeText={setEditCorreo}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Ej: correo@ejemplo.com"
            />

            <View style={styles.modalAcciones}>
              <TouchableOpacity
                style={styles.modalBtnCancelar}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.modalBtnCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalBtnGuardar}
                onPress={guardarEdicion}
                disabled={guardandoEdicion}>
                {guardandoEdicion ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalBtnGuardarTexto}>Guardar Cambios</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  barraConexion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  indicadorFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  puntoConexion: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  textoConexion: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  contadorBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  buscadorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  iconoBuscador: {
    marginRight: 8,
  },
  buscadorInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: '#0F172A',
  },
  btnLimpiarBusqueda: {
    padding: 4,
  },
  listaContenido: {
    padding: 16,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTexto: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
  },
  filaTitulo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nombre: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  btnFavorito: {
    padding: 4,
  },
  filaDato: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  textoDatoLink: {
    fontSize: 13,
    color: '#334155',
  },
  accionesFila: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  btnAccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  btnAccionLlamar: {
    backgroundColor: '#EFF6FF',
  },
  btnTextoLlamar: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  btnAccionEditar: {
    backgroundColor: '#FEF3C7',
  },
  btnTextoEditar: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  btnAccionEliminar: {
    backgroundColor: '#FEE2E2',
  },
  btnTextoEliminar: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  centrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  textoCargando: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
  },
  vacioContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  vacioTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 6,
  },
  vacioSubtitulo: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  vacioBotones: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  btnCrearVacio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  btnCrearVacioTexto: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  btnEjemploVacio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  btnEjemploVacioTexto: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  // Estilos del modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContenido: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 480,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalBtnCerrar: {
    padding: 4,
  },
  labelInput: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
    marginTop: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 8,
  },
  modalAcciones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  modalBtnCancelar: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  modalBtnCancelarTexto: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14,
  },
  modalBtnGuardar: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 130,
    alignItems: 'center',
  },
  modalBtnGuardarTexto: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
