import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useContactos } from '@/context/ContactosContext';
import { Contacto, contactosService } from '@/services/contactosService';

export default function FavoritosScreen() {
  const router = useRouter();
  const {
    contactos,
    cargando,
    fuenteConexion,
    toggleFavorito,
    cargarEjemplos,
    refrescar,
  } = useContactos();

  const [probandoConexion, setProbandoConexion] = useState(false);
  const [resultadoPrueba, setResultadoPrueba] = useState<string | null>(null);

  // Filtrar favoritos
  const favoritos = contactos.filter((c) => c.favorito);

  // Estadísticas
  const totalContactos = contactos.length;
  const totalFavoritos = favoritos.length;
  const conTelefono = contactos.filter((c) => c.telefono && c.telefono.trim().length > 0).length;
  const conCorreo = contactos.filter((c) => c.correo && c.correo.trim().length > 0).length;

  const probarSupabase = async () => {
    setProbandoConexion(true);
    setResultadoPrueba(null);
    const res = await contactosService.probarConexion();
    setProbandoConexion(false);
    setResultadoPrueba(res.mensaje);

    if (Platform.OS !== 'web') {
      Alert.alert(res.ok ? 'Conexión Exitosa' : 'Aviso de Conexión', res.mensaje);
    }
  };

  const llamarContacto = (telefono: string) => {
    Linking.openURL(`tel:${telefono.replace(/\s+/g, '')}`).catch(() => {
      if (Platform.OS === 'web') alert(`Llamar al número: ${telefono}`);
    });
  };

  const enviarCorreo = (correo: string) => {
    Linking.openURL(`mailto:${correo}`).catch(() => {
      if (Platform.OS === 'web') alert(`Enviar correo a: ${correo}`);
    });
  };

  return (
    <ScrollView style={styles.pantalla} contentContainerStyle={styles.scrollContenido}>
      {/* SECCIÓN 1: ESTADÍSTICAS DE LA AGENDA */}
      <Text style={styles.seccionTitulo}>RESUMEN DE LA AGENDA</Text>
      <View style={styles.gridStats}>
        {/* Card Total */}
        <View style={[styles.cardStat, { borderLeftColor: '#2563EB' }]}>
          <View style={styles.statIconoBgAzul}>
            <Ionicons name="people" size={20} color="#2563EB" />
          </View>
          <View>
            <Text style={styles.statValor}>{totalContactos}</Text>
            <Text style={styles.statEtiqueta}>Total Registrados</Text>
          </View>
        </View>

        {/* Card Favoritos */}
        <View style={[styles.cardStat, { borderLeftColor: '#F59E0B' }]}>
          <View style={styles.statIconoBgAmarillo}>
            <Ionicons name="star" size={20} color="#F59E0B" />
          </View>
          <View>
            <Text style={styles.statValor}>{totalFavoritos}</Text>
            <Text style={styles.statEtiqueta}>Favoritos</Text>
          </View>
        </View>

        {/* Card Con Teléfono */}
        <View style={[styles.cardStat, { borderLeftColor: '#10B981' }]}>
          <View style={styles.statIconoBgVerde}>
            <Ionicons name="call" size={20} color="#10B981" />
          </View>
          <View>
            <Text style={styles.statValor}>{conTelefono}</Text>
            <Text style={styles.statEtiqueta}>Con Teléfono</Text>
          </View>
        </View>

        {/* Card Con Correo */}
        <View style={[styles.cardStat, { borderLeftColor: '#8B5CF6' }]}>
          <View style={styles.statIconoBgMorado}>
            <Ionicons name="mail" size={20} color="#8B5CF6" />
          </View>
          <View>
            <Text style={styles.statValor}>{conCorreo}</Text>
            <Text style={styles.statEtiqueta}>Con Correo</Text>
          </View>
        </View>
      </View>

      {/* SECCIÓN 2: CONTACTOS FAVORITOS */}
      <View style={styles.favoritosHeader}>
        <Text style={styles.seccionTitulo}>CONTACTOS DESTACADOS ({favoritos.length})</Text>
        {favoritos.length > 0 && (
          <TouchableOpacity onPress={() => router.push('/')}>
            <Text style={styles.linkVerTodos}>Ver todos</Text>
          </TouchableOpacity>
        )}
      </View>

      {favoritos.length === 0 ? (
        <View style={styles.vacioFavoritos}>
          <Ionicons name="star-outline" size={44} color="#CBD5E1" />
          <Text style={styles.vacioTitulo}>Aún no tienes contactos favoritos</Text>
          <Text style={styles.vacioDesc}>
            En la pantalla de Contactos, toca la estrella (⭐) en cualquier contacto para
            agregarlo a tus accesos rápidos.
          </Text>
          <TouchableOpacity style={styles.btnIrContactos} onPress={() => router.push('/')}>
            <Text style={styles.btnIrContactosTexto}>Ir a la Lista de Contactos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        favoritos.map((c) => (
          <View key={c.id} style={styles.cardFavorito}>
            <View style={styles.avatarFav}>
              <Text style={styles.avatarFavTexto}>
                {c.nombre.charAt(0).toUpperCase()}
                {(c.apellido || '').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.favInfo}>
              <Text style={styles.favNombre} numberOfLines={1}>
                {c.nombre} {c.apellido || ''}
              </Text>
              <Text style={styles.favDato}>{c.telefono}</Text>
              <Text style={styles.favDato}>{c.correo}</Text>
            </View>
            <View style={styles.favAcciones}>
              <TouchableOpacity
                style={styles.btnFavAccion}
                onPress={() => llamarContacto(c.telefono)}>
                <Ionicons name="call" size={16} color="#2563EB" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnFavAccion}
                onPress={() => enviarCorreo(c.correo)}>
                <Ionicons name="mail" size={16} color="#2563EB" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnFavAccion}
                onPress={() => toggleFavorito(c.id)}>
                <Ionicons name="star" size={16} color="#F59E0B" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* SECCIÓN 3: DIAGNÓSTICO Y ACCIONES */}
      <Text style={[styles.seccionTitulo, { marginTop: 24 }]}>SISTEMA Y BASE DE DATOS</Text>
      <View style={styles.cardSistema}>
        <View style={styles.filaEstado}>
          <Ionicons
            name={fuenteConexion === 'nube' ? 'cloud-done' : 'cloud-offline'}
            size={24}
            color={fuenteConexion === 'nube' ? '#059669' : '#D97706'}
          />
          <View style={styles.estadoTextos}>
            <Text style={styles.estadoTitulo}>
              {fuenteConexion === 'nube' ? 'Supabase Activo' : 'Modo Offline / Local'}
            </Text>
            <Text style={styles.estadoDesc}>
              {fuenteConexion === 'nube'
                ? 'Los contactos se guardan directamente en tu base de datos PostgreSQL en Supabase.'
                : 'Guardando datos en la memoria local del dispositivo con sincronización automática.'}
            </Text>
          </View>
        </View>

        {resultadoPrueba && (
          <View style={styles.resultadoCaja}>
            <Ionicons name="information-circle" size={18} color="#2563EB" />
            <Text style={styles.resultadoTexto}>{resultadoPrueba}</Text>
          </View>
        )}

        <View style={styles.botonesSistema}>
          <TouchableOpacity
            style={styles.btnProbar}
            onPress={probarSupabase}
            disabled={probandoConexion}>
            {probandoConexion ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <>
                <Ionicons name="shield-checkmark-outline" size={16} color="#2563EB" />
                <Text style={styles.btnProbarTexto}>Probar Conexión Supabase</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnEjemplos}
            onPress={async () => {
              await cargarEjemplos();
              if (Platform.OS === 'web') alert('Contactos de ejemplo cargados.');
            }}>
            <Ionicons name="download-outline" size={16} color="#475569" />
            <Text style={styles.btnEjemplosTexto}>Cargar 3 Contactos de Prueba</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContenido: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  seccionTitulo: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  gridStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  cardStat: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statIconoBgAzul: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconoBgAmarillo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconoBgVerde: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconoBgMorado: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValor: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  statEtiqueta: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  favoritosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkVerTodos: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 10,
  },
  vacioFavoritos: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vacioTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 10,
    marginBottom: 4,
  },
  vacioDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  btnIrContactos: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  btnIrContactosTexto: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 13,
  },
  cardFavorito: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  avatarFav: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFavTexto: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  favInfo: {
    flex: 1,
  },
  favNombre: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  favDato: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  favAcciones: {
    flexDirection: 'row',
    gap: 6,
  },
  btnFavAccion: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardSistema: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filaEstado: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  estadoTextos: {
    flex: 1,
  },
  estadoTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  estadoDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 2,
  },
  resultadoCaja: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  resultadoTexto: {
    fontSize: 12,
    color: '#1E40AF',
    flex: 1,
  },
  botonesSistema: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  btnProbar: {
    flex: 1,
    minWidth: 160,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnProbarTexto: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 13,
  },
  btnEjemplos: {
    flex: 1,
    minWidth: 160,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnEjemplosTexto: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 13,
  },
});
